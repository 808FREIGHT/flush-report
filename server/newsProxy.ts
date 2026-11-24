import type { IncomingMessage, ServerResponse } from "http";

const GOOGLE_NEWS_HOST = "news.google.com";

function sendText(res: ServerResponse, status: number, body: string, contentType: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(body);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  sendText(res, status, JSON.stringify(body), "application/json; charset=utf-8");
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "0.0.0.0" || host === "::1" || host === "[::1]") return true;
  if (/^127\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) return true;
  if (/^169\.254\.\d+\.\d+$/.test(host)) return true;
  return false;
}

function parseSafeHttpUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (isPrivateHostname(parsed.hostname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Server-side news helpers:
 * - GET /api/news-rss?q=...  → Google News RSS XML (avoids browser CORS / broken public proxies)
 * - GET /api/article-access?url=... → lightweight reachability check for story links
 */
export function newsProxyMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = new URL(req.url || "/", "http://localhost");
  const route = url.pathname;

  if (route !== "/api/news-rss" && route !== "/api/article-access") {
    next();
    return;
  }

  void (async () => {
    try {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed." });
        return;
      }

      if (route === "/api/news-rss") {
        const query = url.searchParams.get("q")?.trim() || "";
        if (!query || query.length > 240) {
          sendJson(res, 400, { error: "Provide a search query under 240 characters." });
          return;
        }

        const rssUrl = new URL("https://news.google.com/rss/search");
        rssUrl.searchParams.set("q", query);
        rssUrl.searchParams.set("hl", "en-US");
        rssUrl.searchParams.set("gl", "US");
        rssUrl.searchParams.set("ceid", "US:en");

        if (rssUrl.hostname !== GOOGLE_NEWS_HOST) {
          sendJson(res, 400, { error: "Unexpected RSS host." });
          return;
        }

        const response = await fetchWithTimeout(
          rssUrl.toString(),
          {
            headers: {
              "User-Agent": "FlushReportNewsBot/1.0 (+https://theflushreport.com)",
              Accept: "application/rss+xml, application/xml, text/xml, */*",
            },
          },
          12_000,
        );

        if (!response.ok) {
          sendJson(res, 502, { error: `Upstream news search failed (${response.status}).` });
          return;
        }

        const xml = await response.text();
        if (!/<rss[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml)) {
          sendJson(res, 502, { error: "Upstream news search returned a non-RSS body." });
          return;
        }

        sendText(res, 200, xml, "application/rss+xml; charset=utf-8");
        return;
      }

      const articleUrl = parseSafeHttpUrl(url.searchParams.get("url"));
      if (!articleUrl) {
        sendJson(res, 400, { error: "Provide a public http(s) article URL." });
        return;
      }

      const response = await fetchWithTimeout(
        articleUrl.toString(),
        {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": "FlushReportNewsBot/1.0 (+https://theflushreport.com)",
            Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          },
        },
        8_000,
      );

      const sample = (await response.text()).slice(0, 2500);
      const denied =
        /access denied/i.test(sample) ||
        /\b403\b/.test(sample) ||
        /forbidden/i.test(sample) ||
        /request blocked/i.test(sample) ||
        /captcha/i.test(sample) ||
        /permission denied/i.test(sample) ||
        /not authorized/i.test(sample);

      sendJson(res, 200, {
        accessible: response.ok && !denied,
        status: response.status,
        reason: !response.ok ? `http_${response.status}` : denied ? "access_denied_marker" : "ok",
      });
    } catch {
      if (route === "/api/news-rss") {
        sendJson(res, 502, { error: "News search proxy failed." });
        return;
      }
      // Reachability checks should not wipe the whole live drop when a host is flaky.
      sendJson(res, 200, { accessible: true, reason: "unverified" });
    }
  })();
}
