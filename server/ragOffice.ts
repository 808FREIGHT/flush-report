import { createHmac, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

const COOKIE = "fr_office";
const MAX_FILES = 8;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".heic", "image/heic"],
  [".heif", "image/heif"],
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".webm", "video/webm"],
  [".pdf", "application/pdf"],
]);

type OfficeFile = {
  storedName: string;
  originalName: string;
  mime: string;
  size: number;
  onTicker?: boolean;
};

type Submission = {
  id: string;
  createdAt: string;
  files: OfficeFile[];
};

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "data", "rag-office");
const indexPath = path.join(dataDir, "index.json");

function officePassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return "";
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((entry) => entry.startsWith("ADMIN_PASSWORD="));
  return line ? line.slice("ADMIN_PASSWORD=".length).trim() : "";
}

function sessionToken(password: string) {
  return createHmac("sha256", password).update("flush-report-office-v1").digest("hex");
}

function passwordsMatch(input: string, expected: string) {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function readCookie(req: IncomingMessage, name: string) {
  const raw = req.headers.cookie ?? "";
  const hit = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : "";
}

function isAuthed(req: IncomingMessage) {
  const password = officePassword();
  if (!password) return false;
  const given = readCookie(req, COOKIE);
  const expected = sessionToken(password);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readSubmissions(): Submission[] {
  if (!existsSync(indexPath)) return [];
  const parsed = JSON.parse(readFileSync(indexPath, "utf8")) as Submission[];
  return Array.isArray(parsed) ? parsed : [];
}

function writeSubmissions(submissions: Submission[]) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(indexPath, JSON.stringify(submissions, null, 2));
}

function extensionFor(filename: string, mime: string) {
  const fromName = path.extname(filename).toLowerCase();
  if (ALLOWED.has(fromName)) return fromName;
  for (const [ext, type] of ALLOWED) {
    if (type === mime) return ext;
  }
  return "";
}

function readLimitedBody(req: IncomingMessage, maxBytes: number) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk) => {
      const buffer = Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) {
        reject(new Error("Each file needs to stay under 20 MB."));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipart(buffer: Buffer, contentType: string) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = match?.[1] || match?.[2];
  if (!boundary) throw new Error("Attach a photo or clip first.");
  const delim = Buffer.from(`--${boundary}`);
  const files: { originalName: string; mime: string; buffer: Buffer; truncated: boolean }[] = [];
  let start = buffer.indexOf(delim);
  while (start !== -1) {
    let next = buffer.indexOf(delim, start + delim.length);
    if (next === -1) break;
    let part = buffer.subarray(start + delim.length, next);
    if (part.subarray(0, 2).equals(Buffer.from("\r\n"))) part = part.subarray(2);
    if (part.subarray(-2).equals(Buffer.from("\r\n"))) part = part.subarray(0, -2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const header = part.subarray(0, headerEnd).toString("utf8");
      const filename = /filename="([^"]*)"/.exec(header)?.[1];
      if (filename) {
        const mime = /Content-Type:\s*([^\r\n]+)/i.exec(header)?.[1]?.trim() || "";
        const body = part.subarray(headerEnd + 4);
        files.push({
          originalName: filename,
          mime,
          buffer: body,
          truncated: body.length > MAX_FILE_BYTES,
        });
      }
    }
    start = next;
  }
  return files;
}

function parseUpload(req: IncomingMessage) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return Promise.reject(new Error("Attach a photo or clip first."));
  }
  return readLimitedBody(req, MAX_FILES * MAX_FILE_BYTES + 1024 * 1024).then((buffer) => ({
    files: parseMultipart(buffer, contentType),
  }));
}

async function saveSubmission(req: IncomingMessage, res: ServerResponse) {
  let parsed: Awaited<ReturnType<typeof parseUpload>>;
  try {
    parsed = await parseUpload(req);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Upload failed." });
    return;
  }

  if (parsed.files.length === 0) {
    sendJson(res, 400, { error: "Attach a photo or clip first." });
    return;
  }

  if (parsed.files.length > MAX_FILES) {
    sendJson(res, 400, { error: "Send up to 8 files at a time." });
    return;
  }

  if (parsed.files.some((file) => file.truncated)) {
    sendJson(res, 400, { error: "Each file needs to stay under 20 MB." });
    return;
  }

  const id = randomBytes(8).toString("hex");
  const folder = path.join(dataDir, "files", id);
  mkdirSync(folder, { recursive: true });
  const stored: OfficeFile[] = [];

  for (const [index, file] of parsed.files.entries()) {
    const ext = extensionFor(file.originalName, file.mime);
    if (!ext) {
      rmSync(folder, { recursive: true, force: true });
      sendJson(res, 400, { error: "Send a photo, a short video, or a PDF." });
      return;
    }
    const storedName = `${index}${ext}`;
    writeFileSync(path.join(folder, storedName), file.buffer);
    stored.push({
      storedName,
      originalName: path.basename(file.originalName).slice(0, 180),
      mime: ALLOWED.get(ext) || file.mime,
      size: file.buffer.length,
    });
  }

  const submissions = readSubmissions();
  submissions.unshift({ id, createdAt: new Date().toISOString(), files: stored });
  writeSubmissions(submissions);
  sendJson(res, 200, { ok: true });
}

function listSubmissions(res: ServerResponse) {
  const submissions = readSubmissions().map((submission) => ({
    ...submission,
    files: submission.files.map((file) => ({
      ...file,
      url: `/api/admin/file/${submission.id}/${file.storedName}`,
    })),
  }));
  sendJson(res, 200, { submissions });
}

function sendFile(res: ServerResponse, id: string, storedName: string) {
  if (!/^[a-f0-9]{16}$/.test(id) || !/^\d+\.[a-z0-9]+$/.test(storedName)) {
    sendJson(res, 404, { error: "File not found." });
    return;
  }
  const submission = readSubmissions().find((entry) => entry.id === id);
  const file = submission?.files.find((entry) => entry.storedName === storedName);
  const filePath = path.join(dataDir, "files", id, storedName);
  if (!file || !existsSync(filePath)) {
    sendJson(res, 404, { error: "File not found." });
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", file.mime);
  res.setHeader("Content-Disposition", `inline; filename="${file.originalName.replace(/"/g, "")}"`);
  createReadStream(filePath).pipe(res);
}

function tickerImages() {
  return readSubmissions().flatMap((submission) =>
    submission.files
      .filter((file) => file.onTicker && file.mime.startsWith("image/") && file.mime !== "image/heic" && file.mime !== "image/heif")
      .map((file) => ({
        src: `/api/rag-ticker/file/${submission.id}/${file.storedName}`,
        alt: file.originalName,
      })),
  );
}

function setTicker(res: ServerResponse, id: string, storedName: string, onTicker: boolean) {
  if (!/^[a-f0-9]{16}$/.test(id) || !/^\d+\.[a-z0-9]+$/.test(storedName)) {
    sendJson(res, 404, { error: "File not found." });
    return;
  }
  const submissions = readSubmissions();
  const submission = submissions.find((entry) => entry.id === id);
  const file = submission?.files.find((entry) => entry.storedName === storedName);
  if (!file) {
    sendJson(res, 404, { error: "File not found." });
    return;
  }
  if (!file.mime.startsWith("image/") || file.mime === "image/heic" || file.mime === "image/heif") {
    sendJson(res, 400, { error: "Only a regular photo can go on the ticker." });
    return;
  }
  file.onTicker = onTicker;
  writeSubmissions(submissions);
  sendJson(res, 200, { ok: true, onTicker });
}

function sendPublicTickerFile(res: ServerResponse, id: string, storedName: string) {
  const file = readSubmissions()
    .find((entry) => entry.id === id)
    ?.files.find((entry) => entry.storedName === storedName);
  if (!file?.onTicker) {
    sendJson(res, 404, { error: "File not found." });
    return;
  }
  sendFile(res, id, storedName);
}

function deleteSubmission(res: ServerResponse, id: string) {
  if (!/^[a-f0-9]{16}$/.test(id)) {
    sendJson(res, 404, { error: "Submission not found." });
    return;
  }
  const remaining = readSubmissions().filter((entry) => entry.id !== id);
  writeSubmissions(remaining);
  rmSync(path.join(dataDir, "files", id), { recursive: true, force: true });
  sendJson(res, 200, { ok: true });
}

export function ragOfficeMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = new URL(req.url || "/", "http://localhost");
  const route = url.pathname;
  if (route !== "/api/rag-pics" && route !== "/api/rag-ticker" && !route.startsWith("/api/rag-ticker/") && !route.startsWith("/api/admin")) {
    next();
    return;
  }

  void (async () => {
    if (req.method === "POST" && route === "/api/rag-pics") {
      await saveSubmission(req, res);
      return;
    }

    if (req.method === "GET" && route === "/api/rag-ticker") {
      sendJson(res, 200, { images: tickerImages() });
      return;
    }

    const publicFileMatch = route.match(/^\/api\/rag-ticker\/file\/([a-f0-9]{16})\/(\d+\.[a-z0-9]+)$/);
    if (req.method === "GET" && publicFileMatch) {
      sendPublicTickerFile(res, publicFileMatch[1], publicFileMatch[2]);
      return;
    }

    if (req.method === "POST" && route === "/api/admin/login") {
      const password = officePassword();
      if (!password) {
        sendJson(res, 503, { error: "The back office password is not set yet." });
        return;
      }
      const raw = await readLimitedBody(req, 20_000);
      const body = JSON.parse(raw.toString("utf8")) as { password?: string };
      if (!body.password || !passwordsMatch(body.password, password)) {
        sendJson(res, 401, { error: "That password does not match." });
        return;
      }
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.setHeader("Set-Cookie", `${COOKIE}=${sessionToken(password)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && route === "/api/admin/logout") {
      res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (!isAuthed(req)) {
      sendJson(res, 401, { error: "Log in to the back office." });
      return;
    }

    if (req.method === "GET" && route === "/api/admin/session") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && route === "/api/admin/submissions") {
      listSubmissions(res);
      return;
    }

    const fileMatch = route.match(/^\/api\/admin\/file\/([a-f0-9]{16})\/(\d+\.[a-z0-9]+)$/);
    if (req.method === "GET" && fileMatch) {
      sendFile(res, fileMatch[1], fileMatch[2]);
      return;
    }

    if (req.method === "POST" && route === "/api/admin/ticker") {
      const raw = await readLimitedBody(req, 20_000);
      const body = JSON.parse(raw.toString("utf8")) as { id?: string; storedName?: string; onTicker?: boolean };
      setTicker(res, body.id || "", body.storedName || "", Boolean(body.onTicker));
      return;
    }

    const deleteMatch = route.match(/^\/api\/admin\/submissions\/([a-f0-9]{16})$/);
    if (req.method === "DELETE" && deleteMatch) {
      deleteSubmission(res, deleteMatch[1]);
      return;
    }

    sendJson(res, 404, { error: "Not found." });
  })().catch((error) => {
    console.error("[rag-office]", error);
    if (!res.headersSent) sendJson(res, 500, { error: "The back office hit a problem." });
  });
}
