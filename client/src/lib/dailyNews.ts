export type DailyNewsStory = {
  title: string;
  url: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  date: string;
  summary: string;
  category: string;
  location: string;
  ogImage?: string;
};

export type DailyCostSignal = {
  lane: "Pump repairs" | "Public burden" | "Downstream impact";
  amount: string;
  snippet: string;
  source: string;
  url: string;
  location: string;
  title: string;
  ogImage?: string;
};

export type WildlifeImpactStory = {
  title: string;
  url: string;
  source: string;
  sourceUrl?: string;
  date: string;
  location: string;
  snippet: string;
  ogImage?: string;
};

const CACHE_KEY = "flush-report-daily-news-v6";
const WILDLIFE_CACHE_KEY = "flush-report-weekly-wildlife-archive-v4";
const OG_IMAGE_CACHE_KEY = "flush-report-og-image-cache-v1";
const SCRAPE_STATUS_KEY = "flush-report-scrape-status-v1";
const ACCESS_CHECK_CACHE_KEY = "flush-report-article-access-cache-v1";
const NEWS_LIMIT = 18;
export const SITE_REGION_LOCK = "US_ONLY";
const MIN_WEEKLY_WILDLIFE_STORIES = 3;
const DAILY_SCRAPE_CUTOFF_HOUR = 8;
const DAILY_SCRAPE_CUTOFF_MINUTE = 30;

type ScrapeSource = "live" | "cache" | "fallback";
type ScrapeTarget = "dailyStories" | "weeklyWildlife" | "dailyCostSignals";

export type ScrapeStatusRecord = {
  target: ScrapeTarget;
  interval: "daily" | "weekly" | "derived-daily";
  source: ScrapeSource;
  itemCount: number;
  intervalKey: string;
  lastAttemptAt: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  note?: string;
};

type AccessCheckCache = Record<
  string,
  {
    day: string;
    accessible: boolean;
    checkedAt: string;
    reason?: string;
  }
>;

function resolvedUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function localDateTimePartsForZone(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || "0");
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function shiftDateByDays(year: number, month: number, day: number, deltaDays: number): {
  year: number;
  month: number;
  day: number;
} {
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function dailyScrapeCycleKey(timeZone = resolvedUserTimeZone()): string {
  const now = new Date();
  const local = localDateTimePartsForZone(now, timeZone);
  const isBeforeCutoff =
    local.hour < DAILY_SCRAPE_CUTOFF_HOUR ||
    (local.hour === DAILY_SCRAPE_CUTOFF_HOUR && local.minute < DAILY_SCRAPE_CUTOFF_MINUTE);

  const cycleDate = isBeforeCutoff
    ? shiftDateByDays(local.year, local.month, local.day, -1)
    : { year: local.year, month: local.month, day: local.day };

  return `${cycleDate.year}-${pad2(cycleDate.month)}-${pad2(cycleDate.day)}@${timeZone}`;
}

type NewsLane = {
  category: string;
  queries: string[];
  matcher: RegExp;
  minItems: number;
};

const newsLanes: NewsLane[] = [
  {
    category: "Legislation",
    queries: [
      "flushable wipes legislation bill rules policy WIPPES Act do not flush label",
      "wet wipes law utility regulation do not flush",
    ],
    matcher: /(legislation|bill|law|rule|policy|senate|house|act|regulation)/i,
    minItems: 3,
  },
  {
    category: "Catastrophes",
    queries: [
      "flushable wipes sewer backup spill emergency overflow clog damage",
      "wet wipes pump failure sewer blockage contamination event",
    ],
    matcher: /(catastrophe|disaster|spill|overflow|failure|collapse|contamination|emergency)/i,
    minItems: 3,
  },
  {
    category: "Public warnings",
    queries: [
      "utility warning flushable wipes sewer warning public works alert",
      "do not flush wipes warning wastewater department alert",
    ],
    matcher: /(warning|alert|public works|do not flush|utility department|advisory)/i,
    minItems: 3,
  },
  {
    category: "Infrastructure money",
    queries: [
      "flushable wipes pump station repair cost sewer maintenance taxpayer",
      "wet wipes infrastructure costs utility repair spending",
    ],
    matcher: /(funding|grant|bond|budget|cost|investment|repair|upgrades|project|money)/i,
    minItems: 3,
  },
];

function readScrapeStatusMap(): Partial<Record<ScrapeTarget, ScrapeStatusRecord>> {
  try {
    const raw = localStorage.getItem(SCRAPE_STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<ScrapeTarget, ScrapeStatusRecord>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeScrapeStatusMap(statusMap: Partial<Record<ScrapeTarget, ScrapeStatusRecord>>): void {
  try {
    localStorage.setItem(SCRAPE_STATUS_KEY, JSON.stringify(statusMap));
  } catch {
    // Ignore diagnostics persistence failures.
  }
}

function updateScrapeStatus(
  target: ScrapeTarget,
  next: Omit<ScrapeStatusRecord, "target">,
): void {
  const statusMap = readScrapeStatusMap();
  statusMap[target] = { target, ...next };
  writeScrapeStatusMap(statusMap);
}

export function getScrapeStatusSnapshot(): Partial<Record<ScrapeTarget, ScrapeStatusRecord>> {
  return readScrapeStatusMap();
}

function readAccessCheckCache(): AccessCheckCache {
  try {
    const raw = localStorage.getItem(ACCESS_CHECK_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AccessCheckCache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAccessCheckCache(cache: AccessCheckCache): void {
  try {
    localStorage.setItem(ACCESS_CHECK_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write failures.
  }
}

const accessDeniedPatterns = [
  /access denied/i,
  /\b403\b/,
  /forbidden/i,
  /request blocked/i,
  /captcha/i,
  /permission denied/i,
  /not authorized/i,
];

async function checkArticleUrlAccessible(url: string): Promise<{ accessible: boolean; reason?: string }> {
  if (!isHttpUrl(url)) return { accessible: false, reason: "invalid_url" };

  const day = dailyScrapeCycleKey();
  const cache = readAccessCheckCache();
  const cached = cache[url];
  if (cached && cached.day === day) {
    return { accessible: cached.accessible, reason: cached.reason };
  }

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { signal: controller.signal });
    window.clearTimeout(timeout);

    if (!response.ok) {
      const reason = `http_${response.status}`;
      cache[url] = { day, accessible: false, checkedAt: new Date().toISOString(), reason };
      writeAccessCheckCache(cache);
      return { accessible: false, reason };
    }

    const text = (await response.text()).slice(0, 2500);
    const denied = accessDeniedPatterns.some((pattern) => pattern.test(text));
    const accessible = !denied;
    const reason = accessible ? "ok" : "access_denied_marker";
    cache[url] = { day, accessible, checkedAt: new Date().toISOString(), reason };
    writeAccessCheckCache(cache);
    return { accessible, reason };
  } catch {
    cache[url] = { day, accessible: false, checkedAt: new Date().toISOString(), reason: "fetch_error" };
    writeAccessCheckCache(cache);
    return { accessible: false, reason: "fetch_error" };
  }
}

async function filterAccessibleByUrl<T extends { url: string }>(items: T[]): Promise<T[]> {
  if (items.length === 0) return [];
  const checks = await Promise.all(items.map((item) => checkArticleUrlAccessible(item.url)));
  return items.filter((_item, index) => checks[index]?.accessible);
}

export function clearScrapeCaches(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(WILDLIFE_CACHE_KEY);
    localStorage.removeItem(ACCESS_CHECK_CACHE_KEY);
  } catch {
    // Ignore cache clear failures.
  }
}

export const fallbackDailyStories: DailyNewsStory[] = [
  {
    category: "Infrastructure money",
    title: "Federal wipe-labeling push advances as utilities report rising cleanup costs",
    summary:
      "Utilities and wastewater groups continue backing stronger \"Do Not Flush\" labeling after citing recurring wipe-related clogs and taxpayer-funded maintenance pressure.",
    source: "CASA",
    sourceUrl: "https://casaweb.org",
    date: "Apr. 29, 2026",
    url: "https://casaweb.org/federal-legislative-update-4-13-26/",
    location: "United States",
  },
  {
    category: "Catastrophes",
    title: "Officials warn wipes and grease are clogging sewer systems during drought",
    summary:
      "Local officials warned that wipes continue to create avoidable sewer blockages and emergency response burdens, especially during stressed system conditions.",
    source: "Tampa Bay 28",
    sourceUrl: "https://www.tampabay28.com",
    date: "Apr. 27, 2026",
    url: "https://www.tampabay28.com/news/local-news/officials-warn-wipes-and-grease-are-clogging-sewer-systems-during-drought",
    location: "Florida, USA",
  },
  {
    category: "Legislation",
    title: "Tennessee passes rules tied to failing systems and wipe-labeling pressure",
    summary:
      "State lawmakers advanced system-protection rules while utilities continue public messaging on non-flushable wipes and recurring sewer damage.",
    source: "Tennessee Lookout",
    sourceUrl: "https://tennesseelookout.com",
    date: "Apr. 7, 2026",
    url: "https://tennesseelookout.com/2026/04/07/tennessee-legislature-passes-bill-setting-new-rules-for-failing-wastewater-systems/",
    location: "Tennessee, USA",
  },
  {
    category: "Legislation",
    title: "CASA reports Senate passage of the federal WIPPES Act",
    summary:
      "The WIPPES Act would create federal 'Do Not Flush' labeling requirements for nonflushable wipes packaging, mirroring California's standard and giving utilities a clearer prevention message.",
    source: "CASA",
    sourceUrl: "https://casaweb.org",
    date: "Apr. 13, 2026",
    url: "https://casaweb.org/federal-legislative-update-4-13-26/",
    location: "United States",
  },
  {
    category: "Public warnings",
    title: "Lennox warns flushable wipes are damaging sewer equipment",
    summary:
      "The Lennox Utility Department reported increasing damage from so-called flushable wipes, warning that wipes clog lines, damage pumps, and can force costly emergency repairs.",
    source: "City of Lennox",
    sourceUrl: "https://www.cityoflennoxsd.com",
    date: "Apr. 14, 2026",
    url: "https://www.cityoflennoxsd.com/article/2816312",
    location: "Lennox, South Dakota",
  },
  {
    category: "Public warnings",
    title: "Great Bend says wipes are clogging mains, lift stations, and pumps",
    summary:
      "Great Bend Public Utilities warned that wipes do not break down fast enough, collect throughout the wastewater system, and combine with grease and debris to create blockages and backups.",
    source: "Great Bend Public Utilities",
    sourceUrl: "https://www.greatbendks.net",
    date: "Apr. 21, 2026",
    url: "https://www.greatbendks.net/CivicAlerts.aspx?AID=377",
    location: "Great Bend, Kansas",
  },
];

export const fallbackCostSignals: DailyCostSignal[] = [
  {
    lane: "Pump repairs",
    amount: "$50K+",
    snippet: "City reporting tied wipe clogs to a major lift-station pump replacement cost.",
    source: "Cordova Times",
    url: "https://thecordovatimes.com/2026/04/07/50k-city-sewer-pump-replacement-attributed-to-un-flushable-wipes/",
    location: "Cordova, Alaska",
    title: "Pump replacement cost linked to wipe-related clogs",
  },
  {
    lane: "Public burden",
    amount: "$441M/yr",
    snippet: "Utility estimate of annual collection-system costs connected to flushable wipes.",
    source: "NACWA",
    url: "https://www.nacwa.org/docs/default-source/resources---public/executive-summary_cost_of_wipes.pdf",
    location: "United States",
    title: "Annual utility burden from flushable wipes",
  },
  {
    lane: "Downstream impact",
    amount: "$414M",
    snippet: "Marine debris modeling indicates large tourism-spending losses when debris pressure increases.",
    source: "NOAA Marine Debris Program",
    url: "https://marinedebris.noaa.gov/research/economic-impacts-marine-debris-tourism-dependent-communities",
    location: "Great Lakes Region",
    title: "Economic impact from marine debris in tourism communities",
  },
];

export const fallbackWildlifeImpactStories: WildlifeImpactStory[] = [
  {
    title: "Wipe debris and sewage overflow controls spotlight fish-habitat risk in state grant response",
    url: "https://www.epa.gov/newsreleases/epa-announces-29-million-protect-waterways-sewage-overflows-massachusetts",
    source: "U.S. EPA",
    sourceUrl: "https://www.epa.gov",
    date: "Apr. 29, 2026",
    location: "Massachusetts, USA",
    snippet:
      "Overflow controls target releases that can degrade rivers, estuaries, and fish habitat while utilities continue wipe-focused prevention messaging.",
  },
  {
    title: "Utilities keep warning wipes can persist as debris pressure in waterways and habitat zones",
    url: "https://www.greatbendks.net/CivicAlerts.aspx?AID=377",
    source: "Great Bend Public Utilities",
    sourceUrl: "https://www.greatbendks.net",
    date: "Mar. 22, 2022",
    location: "Kansas, USA",
    snippet:
      "Local utility guidance warns wipes do not break down quickly and can contribute to debris and overflow conditions that impact downstream waters.",
  },
  {
    title: "Tennessee coverage links failing systems, pollution risk, and stronger wipe-control messaging",
    url: "https://tennesseelookout.com/2026/04/07/tennessee-legislature-passes-bill-setting-new-rules-for-failing-wastewater-systems/",
    source: "Tennessee Lookout",
    sourceUrl: "https://tennesseelookout.com",
    date: "Apr. 07, 2026",
    location: "Tennessee, USA",
    snippet:
      "New system rules and public messaging are aimed at reducing polluted runoff and downstream aquatic stress, including wipe-related clog drivers.",
  },
];

const US_STATE_NAMES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
];

export function isUsOnlyStory(title: string, summary: string, location: string): boolean {
  const text = `${title} ${summary} ${location}`;
  const lower = text.toLowerCase();

  if (/(mexico|canada|uk|united kingdom|europe|australia|india|china|tijuana)\b/i.test(lower)) return false;
  if (/\b(united states|u\.s\.|u\.s\.a\.|usa|american)\b/i.test(lower)) return true;
  return US_STATE_NAMES.some((state) => new RegExp(`\\b${state.replace(/\s+/g, "\\s+")}\\b`, "i").test(text));
}

export function isFlushableWipesStory(title: string, summary: string, category = ""): boolean {
  const text = `${title} ${summary} ${category}`.toLowerCase();
  return /(flushable wipe|flushable wipes|wet wipe|wet wipes|do not flush|wipes clog|wipe labeling|wippes act|\bwipe\b)/i.test(text);
}

function storyCategoryFromLane(title: string, summary: string): string {
  const haystack = `${title} ${summary}`;
  for (const lane of newsLanes) {
    if (lane.matcher.test(haystack)) return lane.category;
  }
  return "Public warnings";
}

function formatDate(rawDate: string): string {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "Recent";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function extractSource(link: string): string {
  try {
    const hostname = new URL(link).hostname.replace(/^www\./, "");
    return hostname.split(".")[0]?.toUpperCase() || "Source";
  } catch {
    return "Source";
  }
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAuthor(authorText: string): string | undefined {
  const cleaned = stripHtml(authorText);
  if (!cleaned) return undefined;

  const parentheticalSource = cleaned.match(/\(([^)]+)\)/)?.[1]?.trim();
  if (parentheticalSource) return parentheticalSource;

  if (cleaned.includes("@")) return undefined;
  return cleaned;
}

function extractLocation(title: string, summary: string): string {
  const text = `${title}. ${summary}`;

  const knownPlaces = [
    "Massachusetts",
    "Tennessee",
    "California",
    "South Dakota",
    "Kansas",
    "Tijuana",
    "Mexico",
    "Hawaii",
    "San Diego",
    "New York",
    "Florida",
    "Texas",
    "Ohio",
    "United States",
  ];

  for (const place of knownPlaces) {
    const re = new RegExp(`\\b${place.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(text)) {
      if (place === "Tijuana" && /river/i.test(text)) return "Tijuana River Region";
      if (place === "Massachusetts") return "Massachusetts, USA";
      if (place === "Tennessee") return "Tennessee, USA";
      if (place === "Kansas" && /great bend/i.test(text)) return "Great Bend, Kansas";
      if (place === "South Dakota" && /lennox/i.test(text)) return "Lennox, South Dakota";
      if (place === "United States") return "United States";
      return place;
    }
  }

  const cityStatePattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}),\s([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\b/;
  const cityStateMatch = text.match(cityStatePattern);
  if (cityStateMatch) return `${cityStateMatch[1]}, ${cityStateMatch[2]}`;

  const inPattern = /\bin\s([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\b/;
  const inMatch = text.match(inPattern);
  if (inMatch) return inMatch[1];

  return "";
}

function extractDollarAmount(text: string): string | null {
  const dollarMatch = text.match(/\$\s?\d[\d,]*(?:\.\d+)?\s?(?:[KMBT]|million|billion|trillion)?(?:\/yr|\/year)?/i);
  if (dollarMatch) {
    return dollarMatch[0].replace(/\s+/g, "").replace("million", "M").replace("billion", "B").replace("trillion", "T");
  }

  const plainScaleMatch = text.match(/\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(million|billion|trillion|thousand)\b/i);
  if (plainScaleMatch) {
    const value = plainScaleMatch[1];
    const scaleWord = plainScaleMatch[2].toLowerCase();
    const suffix = scaleWord.startsWith("million") ? "M" : scaleWord.startsWith("billion") ? "B" : scaleWord.startsWith("trillion") ? "T" : "K";
    return `$${value}${suffix}`;
  }

  return null;
}

function weekCacheKey(): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function parseRss(xmlText: string): DailyNewsStory[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const items = Array.from(xml.querySelectorAll("item"));

  return items
    .map((item) => {
      const title = stripHtml(item.querySelector("title")?.textContent?.trim() ?? "");
      const url = item.querySelector("link")?.textContent?.trim() ?? "";
      const pubDate = item.querySelector("pubDate")?.textContent?.trim() ?? "";
      const authorRaw =
        item.querySelector("author")?.textContent?.trim() ??
        item.querySelector("dc\\:creator")?.textContent?.trim() ??
        "";
      const sourceName = stripHtml(item.querySelector("source")?.textContent?.trim() ?? "");
      const sourceUrl = item.querySelector("source")?.getAttribute("url")?.trim() ?? "";
      const description = item.querySelector("description")?.textContent?.trim() ?? "";
      const cleanedSummary = stripHtml(description).slice(0, 280);
      const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedSummary = cleanedSummary.toLowerCase().replace(/[^a-z0-9]/g, "");
      const summary =
        normalizedSummary === normalizedTitle ||
        normalizedSummary.startsWith(normalizedTitle.slice(0, 48))
          ? ""
          : cleanedSummary;
      const location = extractLocation(title, summary);
      const author = normalizeAuthor(authorRaw);

      if (!title || !url) return null;
      if (!isUsOnlyStory(title, summary, location)) return null;

      return {
        title,
        url,
        source: sourceName || extractSource(sourceUrl || url),
        ...(sourceUrl ? { sourceUrl } : {}),
        ...(author ? { author } : {}),
        date: formatDate(pubDate),
        summary,
        category: storyCategoryFromLane(title, summary),
        location,
      } satisfies DailyNewsStory;
    })
    .filter((item): item is DailyNewsStory => Boolean(item));
}

async function fetchFeed(query: string): Promise<DailyNewsStory[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`Failed to fetch RSS for ${query}`);
  const xml = await response.text();
  return parseRss(xml);
}

function laneRank(category: string): number {
  const index = newsLanes.findIndex((lane) => lane.category === category);
  return index === -1 ? 99 : index;
}

function toStoryTimestamp(dateValue: string): number {
  const normalized = dateValue.replace(/\./g, "");
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function curateByLane(stories: DailyNewsStory[]): DailyNewsStory[] {
  const selected: DailyNewsStory[] = [];
  const usedUrls = new Set<string>();

  for (const lane of newsLanes) {
    const laneStories = stories
      .filter((story) => lane.matcher.test(`${story.title} ${story.summary}`))
      .filter((story) => !usedUrls.has(story.url))
      .slice(0, lane.minItems)
      .map((story) => ({ ...story, category: lane.category }));

    laneStories.forEach((story) => {
      usedUrls.add(story.url);
      selected.push(story);
    });
  }

  if (selected.length >= NEWS_LIMIT) return selected.slice(0, NEWS_LIMIT);

  const fill = stories
    .filter((story) => !usedUrls.has(story.url))
    .sort((a, b) => laneRank(a.category) - laneRank(b.category))
    .slice(0, NEWS_LIMIT - selected.length);

  return [...selected, ...fill];
}

function readCache(): DailyNewsStory[] | null {
  const dayKey = dailyScrapeCycleKey();
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { day: string; items: DailyNewsStory[] };
    if (parsed.day !== dayKey || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeCache(items: DailyNewsStory[]): void {
  const dayKey = dailyScrapeCycleKey();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ day: dayKey, items }));
  } catch {
    // Ignore cache write failures.
  }
}

function readWildlifeCache(): WildlifeImpactStory[] | null {
  try {
    const raw = localStorage.getItem(WILDLIFE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { week: string; items: WildlifeImpactStory[] };
    if (parsed.week !== weekCacheKey() || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeWildlifeCache(items: WildlifeImpactStory[]): void {
  try {
    localStorage.setItem(WILDLIFE_CACHE_KEY, JSON.stringify({ week: weekCacheKey(), items }));
  } catch {
    // Ignore cache write failures.
  }
}

type OgImageCacheEntry = {
  imageUrl: string;
  cachedAt: string;
};

function readOgImageCache(): Record<string, OgImageCacheEntry> {
  try {
    const raw = localStorage.getItem(OG_IMAGE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, OgImageCacheEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOgImageCache(cache: Record<string, OgImageCacheEntry>): void {
  try {
    localStorage.setItem(OG_IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write failures.
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

async function isLoadableImage(url: string): Promise<boolean> {
  if (!isHttpUrl(url)) return false;
  return await new Promise<boolean>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => resolve(false), 5000);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };
    image.src = url;
  });
}

async function fetchOgImageUrl(articleUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(articleUrl)}`);
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: { image?: { url?: string } } };
    const imageUrl = payload?.data?.image?.url?.trim();
    if (!imageUrl || !isHttpUrl(imageUrl)) return null;
    const loadable = await isLoadableImage(imageUrl);
    return loadable ? imageUrl : null;
  } catch {
    return null;
  }
}

export async function loadOgImageMap(articleUrls: string[]): Promise<Record<string, string>> {
  const uniqueUrls = Array.from(new Set(articleUrls.filter((url) => isHttpUrl(url))));
  if (uniqueUrls.length === 0) return {};

  const cache = readOgImageCache();
  const result: Record<string, string> = {};

  for (const url of uniqueUrls) {
    const cached = cache[url]?.imageUrl;
    if (cached && isHttpUrl(cached)) {
      result[url] = cached;
    }
  }

  const uncachedUrls = uniqueUrls.filter((url) => !result[url]).slice(0, 12);
  if (uncachedUrls.length === 0) return result;

  const fetched = await Promise.all(
    uncachedUrls.map(async (url) => {
      const imageUrl = await fetchOgImageUrl(url);
      return { url, imageUrl };
    }),
  );

  const now = new Date().toISOString();
  for (const item of fetched) {
    if (!item.imageUrl) continue;
    result[item.url] = item.imageUrl;
    cache[item.url] = { imageUrl: item.imageUrl, cachedAt: now };
  }

  writeOgImageCache(cache);
  return result;
}

export async function loadDailyWastewaterStories(options: { forceLive?: boolean } = {}): Promise<DailyNewsStory[]> {
  const nowIso = new Date().toISOString();
  const dayKey = dailyScrapeCycleKey();
  const cached = options.forceLive ? null : readCache();
  if (cached) {
    updateScrapeStatus("dailyStories", {
      interval: "daily",
      source: "cache",
      itemCount: cached.length,
      intervalKey: dayKey,
      lastAttemptAt: nowIso,
      lastSuccessAt: nowIso,
      note: "Using same-day cached story scrape.",
    });
    return cached;
  }

  try {
    const laneQueries = newsLanes.flatMap((lane) => lane.queries);
    const feedResults = await Promise.all(laneQueries.map((query) => fetchFeed(query)));
    const combined = feedResults.flat();
    const deduped = Array.from(new Map(combined.map((item) => [item.url, item])).values());
    const filtered = deduped.filter((item) =>
      /(wastewater|sewer|flush|wipes|pump|lift station|overflow|treatment|spill|public works|grant|infrastructure|legislation|bill|cost)/i.test(
        `${item.title} ${item.summary} ${item.category}`,
      ),
    );

    const usOnlyStories = filtered.filter((item) => isUsOnlyStory(item.title, item.summary, item.location));
    const wipesOnlyStories = usOnlyStories.filter((item) => isFlushableWipesStory(item.title, item.summary, item.category));
    const topStories = curateByLane(wipesOnlyStories).sort((a, b) => toStoryTimestamp(b.date) - toStoryTimestamp(a.date));
    const accessibleTopStories = await filterAccessibleByUrl(topStories);

    if (accessibleTopStories.length === 0) {
      const accessibleFallback = await filterAccessibleByUrl(fallbackDailyStories);
      updateScrapeStatus("dailyStories", {
        interval: "daily",
        source: "fallback",
        itemCount: accessibleFallback.length,
        intervalKey: dayKey,
        lastAttemptAt: nowIso,
        lastFailureAt: nowIso,
        note: "Live scrape returned no accessible qualifying stories; serving accessible fallback.",
      });
      return accessibleFallback;
    }

    writeCache(accessibleTopStories);
    updateScrapeStatus("dailyStories", {
      interval: "daily",
      source: "live",
      itemCount: accessibleTopStories.length,
      intervalKey: dayKey,
      lastAttemptAt: nowIso,
      lastSuccessAt: nowIso,
      note: "Live scrape succeeded with accessible URLs and cache was refreshed.",
    });
    return accessibleTopStories;
  } catch {
    const accessibleFallback = await filterAccessibleByUrl(fallbackDailyStories);
    updateScrapeStatus("dailyStories", {
      interval: "daily",
      source: "fallback",
      itemCount: accessibleFallback.length,
      intervalKey: dayKey,
      lastAttemptAt: nowIso,
      lastFailureAt: nowIso,
      note: "Live scrape request failed; serving accessible fallback.",
    });
    return accessibleFallback;
  }
}

export async function loadDailyCostSignals(options: { forceLive?: boolean } = {}): Promise<DailyCostSignal[]> {
  const nowIso = new Date().toISOString();
  const dayKey = dailyScrapeCycleKey();
  try {
    const stories = await loadDailyWastewaterStories({ forceLive: options.forceLive });

    const pools = [
      {
        lane: "Pump repairs" as const,
        matcher: /(pump|lift station|repair|clog|equipment|maintenance|debris)/i,
      },
      {
        lane: "Public burden" as const,
        matcher: /(ratepayer|taxpayer|budget|grant|funding|cost|money|utility)/i,
      },
      {
        lane: "Downstream impact" as const,
        matcher: /(downstream|spill|overflow|river|ocean|shore|waterway|contamination)/i,
      },
    ];

    const usedUrls = new Set<string>();
    const signals: DailyCostSignal[] = [];

    for (const pool of pools) {
      const match = stories.find((story) => {
        if (usedUrls.has(story.url)) return false;
        const haystack = `${story.title} ${story.summary} ${story.category} ${story.location}`;
        return pool.matcher.test(haystack) && Boolean(extractDollarAmount(haystack));
      });

      if (match) {
        const haystack = `${match.title} ${match.summary}`;
        signals.push({
          lane: pool.lane,
          amount: extractDollarAmount(haystack) ?? "$—",
          snippet: match.summary,
          source: match.source,
          url: match.url,
          location: match.location,
          title: match.title,
        });
        usedUrls.add(match.url);
      } else {
        const fallback = fallbackCostSignals.find((item) => item.lane === pool.lane);
        if (fallback) signals.push(fallback);
      }
    }

    const finalSignals = signals.length === 3 ? signals : fallbackCostSignals;
    updateScrapeStatus("dailyCostSignals", {
      interval: "derived-daily",
      source: finalSignals === fallbackCostSignals ? "fallback" : "live",
      itemCount: finalSignals.length,
      intervalKey: dayKey,
      lastAttemptAt: nowIso,
      ...(finalSignals === fallbackCostSignals ? { lastFailureAt: nowIso } : { lastSuccessAt: nowIso }),
      note:
        finalSignals === fallbackCostSignals
          ? "Cost signal extraction fell back to defaults."
          : "Cost signals extracted from scraped daily stories.",
    });
    return finalSignals;
  } catch {
    updateScrapeStatus("dailyCostSignals", {
      interval: "derived-daily",
      source: "fallback",
      itemCount: fallbackCostSignals.length,
      intervalKey: dayKey,
      lastAttemptAt: nowIso,
      lastFailureAt: nowIso,
      note: "Daily cost signal generation failed; serving fallback.",
    });
    return fallbackCostSignals;
  }
}

export async function loadWeeklyWildlifeImpactStories(options: { forceLive?: boolean } = {}): Promise<WildlifeImpactStory[]> {
  const nowIso = new Date().toISOString();
  const currentWeekKey = weekCacheKey();
  const cached = options.forceLive ? null : readWildlifeCache();
  if (cached) {
    updateScrapeStatus("weeklyWildlife", {
      interval: "weekly",
      source: "cache",
      itemCount: cached.length,
      intervalKey: currentWeekKey,
      lastAttemptAt: nowIso,
      lastSuccessAt: nowIso,
      note: "Using same-week cached wildlife scrape.",
    });
    return cached;
  }

  try {
    const wildlifeQueries = [
      "flushable wipes sewage spill fish kills archive",
      "wet wipes sewer overflow fish habitat river bay archive",
      "flushable wipes pollution impacts fish habitat",
      "wet wipes wastewater wildlife impacts estuary marine life",
      "do not flush wipes contamination fish advisories historical",
    ];

    const feedResults = await Promise.all(wildlifeQueries.map((query) => fetchFeed(query)));
    const combined = feedResults.flat();
    const deduped = Array.from(new Map(combined.map((item) => [item.url, item])).values());

    const filtered = deduped.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.location}`.toLowerCase();
      const wastewaterMatch = /(wastewater|sewage|overflow|discharge|outfall|spill|treatment|effluent)/.test(haystack);
      const wipesMatch = /(flushable wipe|flushable wipes|wet wipe|wet wipes|do not flush|wipes)/.test(haystack);
      const wildlifeMatch = /(fish|wildlife|aquatic|marine|habitat|river|bay|estuary|coast|salmon|trout)/.test(haystack);
      const usOnlyMatch = isUsOnlyStory(item.title, item.summary, item.location);
      return wastewaterMatch && wipesMatch && wildlifeMatch && usOnlyMatch;
    });

    const sorted = filtered.sort((a, b) => {
      const ad = new Date(a.date).getTime();
      const bd = new Date(b.date).getTime();
      return (Number.isNaN(ad) ? Date.now() : ad) - (Number.isNaN(bd) ? Date.now() : bd);
    });

    const picks = sorted.length >= MIN_WEEKLY_WILDLIFE_STORIES
      ? [sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]]
      : sorted.slice(0, MIN_WEEKLY_WILDLIFE_STORIES);

    const stories = picks.map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      date: item.date,
      location: item.location,
      snippet: item.summary,
    }));

    const byUrl = new Map<string, WildlifeImpactStory>();
    for (const item of stories) byUrl.set(item.url, item);
    for (const item of fallbackWildlifeImpactStories) {
      if (byUrl.size >= MIN_WEEKLY_WILDLIFE_STORIES) break;
      byUrl.set(item.url, item);
    }
    const finalStories = Array.from(byUrl.values()).slice(0, MIN_WEEKLY_WILDLIFE_STORIES);
    const accessibleFinalStories = await filterAccessibleByUrl(finalStories);

    writeWildlifeCache(accessibleFinalStories);
    updateScrapeStatus("weeklyWildlife", {
      interval: "weekly",
      source: "live",
      itemCount: accessibleFinalStories.length,
      intervalKey: currentWeekKey,
      lastAttemptAt: nowIso,
      lastSuccessAt: nowIso,
      note: "Live weekly wildlife scrape succeeded with accessible URLs and cache was refreshed.",
    });
    return accessibleFinalStories;
  } catch {
    const fallback = await filterAccessibleByUrl(
      fallbackWildlifeImpactStories.slice(0, MIN_WEEKLY_WILDLIFE_STORIES),
    );
    updateScrapeStatus("weeklyWildlife", {
      interval: "weekly",
      source: "fallback",
      itemCount: fallback.length,
      intervalKey: currentWeekKey,
      lastAttemptAt: nowIso,
      lastFailureAt: nowIso,
      note: "Weekly wildlife scrape request failed; serving fallback.",
    });
    return fallback;
  }
}

export async function runScrapeDiagnostics(): Promise<{
  dailyStoryCount: number;
  weeklyWildlifeCount: number;
  dailyCostSignalCount: number;
  status: Partial<Record<ScrapeTarget, ScrapeStatusRecord>>;
}> {
  const dailyStories = await loadDailyWastewaterStories({ forceLive: true });
  const wildlifeStories = await loadWeeklyWildlifeImpactStories({ forceLive: true });
  const costSignals = await loadDailyCostSignals({ forceLive: true });

  return {
    dailyStoryCount: dailyStories.length,
    weeklyWildlifeCount: wildlifeStories.length,
    dailyCostSignalCount: costSignals.length,
    status: getScrapeStatusSnapshot(),
  };
}
