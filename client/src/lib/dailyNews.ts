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
  releasedToday?: boolean;
};

export type DailyCostSignal = {
  lane: "Pump repairs" | "Public burden" | "Downstream impact";
  amount: string;
  snippet: string;
  source: string;
  url: string;
  location: string;
  title: string;
  date?: string;
  ogImage?: string;
  releasedToday?: boolean;
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

const CACHE_KEY = "flush-report-daily-news-v9";
const WILDLIFE_CACHE_KEY = "flush-report-weekly-wildlife-archive-v5";
const OG_IMAGE_CACHE_KEY = "flush-report-og-image-cache-v1";
const SCRAPE_STATUS_KEY = "flush-report-scrape-status-v1";
const ACCESS_CHECK_CACHE_KEY = "flush-report-article-access-cache-v2";
const NEWS_LIMIT = 24;

/** Always hunt recent stories across the whole desk before lane fill / standing archive. */
const UMBRELLA_FRESH_QUERIES = [
  '(flushable wipes OR "do not flush" OR nondispersible OR WIPPES) (sewer OR wastewater OR utility OR legislation OR bill OR proposal) when:30d',
  '(wipe labeling OR flushability OR "do not flush") (law OR bill OR proposal OR ordinance OR regulation) when:90d',
  '(wastewater OR sewer) (screening OR grinder OR "solids handling" OR pump OR solution OR pilot) (wipes OR ragging OR nonflushable) when:90d',
  '(Surfrider OR "receiving water" OR estuary OR "sewage spill") (wipes OR flushable OR nondispersible) when:90d',
  '(IWSFG OR "flushability standard" OR dispersibility OR microplastic) (wipes OR flushable) when:1y',
];
export const SITE_REGION_LOCK = "US_ONLY";
const MIN_WEEKLY_WILDLIFE_STORIES = 3;
const DAILY_SCRAPE_TIME_ZONE = "America/New_York";
const DAILY_SCRAPE_CUTOFF_HOUR = 10;
const DAILY_SCRAPE_CUTOFF_MINUTE = 0;

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

function dailyScrapeCycleKey(timeZone = DAILY_SCRAPE_TIME_ZONE): string {
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
    category: "Laws & proposals",
    queries: [
      "flushable wipes legislation bill proposal WIPPES Act do not flush label",
      "wet wipes law ordinance policy proposal regulation do not flush labeling",
      "flushability standard proposal labeling rulemaking wastewater wipes",
    ],
    matcher: /(legislation|bill|law|rule|policy|senate|house|act|regulation|labeling|proposal|ordinance|rulemaking)/i,
    minItems: 2,
  },
  {
    category: "Solutions",
    queries: [
      "wastewater solution screening grinder solids handling pump flushable wipes",
      "pilot project wipe capture non-flushables collection system solution",
      "Do Not Flush education campaign Bin the Wipe solution utility outreach",
    ],
    matcher: /(solution|pilot|innovation|retrofit|upgrade|education campaign|bin the wipe|mitigation|remediation|fix)/i,
    minItems: 2,
  },
  {
    category: "Catastrophes",
    queries: [
      "flushable wipes sewer backup spill emergency overflow clog damage",
      "wet wipes pump failure sewer blockage contamination sewage spill river ocean",
    ],
    matcher: /(catastrophe|disaster|spill|overflow|failure|collapse|contamination|emergency|backup|fatberg|rag ?ball)/i,
    minItems: 2,
  },
  {
    category: "Public warnings",
    queries: [
      "utility warning flushable wipes sewer warning public works alert",
      "do not flush wipes warning wastewater department alert Surfrider",
    ],
    matcher: /(warning|alert|public works|do not flush|utility department|advisory|campaign|outreach)/i,
    minItems: 2,
  },
  {
    category: "Infrastructure money",
    queries: [
      "flushable wipes pump station repair cost sewer maintenance taxpayer",
      "wet wipes infrastructure costs utility repair spending NACWA",
    ],
    matcher: /(funding|grant|bond|budget|cost|investment|repair|upgrades|project|money|ratepayer|taxpayer)/i,
    minItems: 2,
  },
  {
    category: "Technology",
    queries: [
      "wastewater screening system grinder pump ragging flushable wipes technology",
      "solids handling pump cutter plate flushable wipes lift station deragging",
      "Work for Water non-flushables collection system tools screens",
    ],
    matcher: /(technology|screening|screen|grinder|pump|impeller|cutter|deragg|solids handling|porcupine|equipment|innovation)/i,
    minItems: 2,
  },
  {
    category: "Science & standards",
    queries: [
      "IWSFG flushability standard wet wipes scientific study dispersibility",
      "flushable wipes peer reviewed study sewer blockage science materials",
      "INDA EDANA flushability guidelines wastewater microplastics wipes",
    ],
    matcher: /(science|study|research|peer.?reviewed|standard|IWSFG|INDA|EDANA|dispersib|flushability|criteria|microplastic|journal)/i,
    minItems: 2,
  },
  {
    category: "Conservation & waters",
    queries: [
      "Surfrider Foundation sewage spill flushable wipes coastal waterways",
      "flushable wipes river estuary bay ocean receiving water pollution",
      "conservation group wastewater overflow beach water quality wipes",
    ],
    matcher: /(surfrider|conservation|watershed|receiving water|river|estuary|bay|ocean|coast|beach|habitat|fish|marine)/i,
    minItems: 2,
  },
  {
    category: "Field & workforce",
    queries: [
      "Work for Water wastewater operator flushable wipes collections",
      "wastewater operator ragging pump station wipe clog field crew",
      "WEF nondispersibles flushables collections systems professionals",
    ],
    matcher: /(operator|workforce|work for water|WEF|collections|crew|field|labor|staff|deragg|professional)/i,
    minItems: 2,
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
    const response = await fetch(`/api/article-access?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    window.clearTimeout(timeout);

    if (!response.ok) {
      // Do not empty the live drop when the access helper is down.
      cache[url] = { day, accessible: true, checkedAt: new Date().toISOString(), reason: "unverified" };
      writeAccessCheckCache(cache);
      return { accessible: true, reason: "unverified" };
    }

    const payload = (await response.json()) as { accessible?: boolean; reason?: string };
    const accessible = payload.accessible !== false;
    const reason = payload.reason || (accessible ? "ok" : "access_denied_marker");
    cache[url] = { day, accessible, checkedAt: new Date().toISOString(), reason };
    writeAccessCheckCache(cache);
    return { accessible, reason };
  } catch {
    cache[url] = { day, accessible: true, checkedAt: new Date().toISOString(), reason: "unverified" };
    writeAccessCheckCache(cache);
    return { accessible: true, reason: "unverified" };
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
    category: "Catastrophes",
    title: "Wastewater overflow closes Kalama Park after Kihei pump station force-main failure",
    summary:
      "Maui County said a mechanical failure in the force main at Kihei Wastewater Pump Station No. 6 spilled wastewater across Kalama Park, the fire station, and nearby properties. The spill had not reached the ocean. South Maui residents were asked to cut toilet flushing, bathing, laundry, and dishwashing while crews repair the line.",
    source: "Hawaii News Now",
    sourceUrl: "https://www.hawaiinewsnow.com",
    author: "HNN Staff",
    date: "Oct. 22, 2026",
    url: "https://www.hawaiinewsnow.com/2026/10/23/wastewater-overflow-closes-portions-kalama-park-impacts-south-maui-areas/",
    location: "Kihei, Maui",
  },
  {
    category: "Catastrophes",
    title: "Papaikou plant bypass sends treated wastewater with elevated chlorine offshore",
    summary:
      "Hawaii County said a de-chlorination system bypass at the Papaikou Wastewater Treatment Plant discharged about 117,000 gallons of fully treated, fully disinfected wastewater that may have carried elevated residual chlorine into the Pacific. Crews restored the dispenser and notified the state Department of Health.",
    source: "Hawaii Tribune-Herald",
    sourceUrl: "https://www.hawaiitribune-herald.com",
    date: "Oct. 22, 2026",
    url: "https://www.hawaiitribune-herald.com/2026/10/22/hawaii-news/county-unintentional-wastewater-discharge-in-papaikou/",
    location: "Papaikou, Hawaii",
  },
  {
    category: "Laws & proposals",
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
    title: "Great Bend says wipes are clogging mains, lift stations, and pumps",
    summary:
      "Great Bend Public Utilities warned that wipes do not break down fast enough, collect throughout the wastewater system, and combine with grease and debris to create blockages and backups.",
    source: "Great Bend Public Utilities",
    sourceUrl: "https://www.greatbendks.net",
    date: "Apr. 21, 2026",
    url: "https://www.greatbendks.net/CivicAlerts.aspx?AID=377",
    location: "Great Bend, Kansas",
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
    category: "Laws & proposals",
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
    category: "Laws & proposals",
    title: "U.S. House passes the WIPPES Act for Do Not Flush wipe labels",
    summary:
      "The House advanced bipartisan labeling rules so nonflushable wipes carry a clear Do Not Flush notice and symbol, continuing the federal push that started with earlier WIPPES introductions.",
    source: "Congressman Kevin Mullin",
    sourceUrl: "https://kevinmullin.house.gov",
    date: "Jun. 23, 2025",
    url: "https://kevinmullin.house.gov/2025/06/23/wippes-act-passes-through-the-u-s-house/",
    location: "United States",
  },
  {
    category: "Public warnings",
    title: "Las Cruces utilities warn residents: do not flush wipes of any kind",
    summary:
      "Las Cruces Utilities said wipe buildup at lift stations can trigger backups in homes and clog city wastewater facilities, and began door-hanger warnings near affected stations.",
    source: "City of Las Cruces",
    sourceUrl: "https://lascruces.gov",
    date: "Nov. 13, 2024",
    url: "https://lascruces.gov/please-do-not-flush-wipes/",
    location: "Las Cruces, New Mexico",
  },
  {
    category: "Laws & proposals",
    title: "Michigan bans marketing wipes as flushable and requires Do Not Flush labels",
    summary:
      "State officials said so-called flushable wipes clog pumps and screens, citing years of wipe-related station clogs and ratepayer cleanup costs, and welcomed the new labeling law.",
    source: "Michigan EGLE",
    sourceUrl: "https://www.michigan.gov/egle",
    date: "Jul. 10, 2024",
    url: "https://www.michigan.gov/egle/newsroom/mi-environment/2024/07/10/you-can-no-longer-call-wipes-flushable-in-michigan",
    location: "Michigan, USA",
  },
  {
    category: "Catastrophes",
    title: "Rockland County coverage ties fatbergs and sewer clogs to flushed wipes",
    summary:
      "Clarkstown officials described recurring fatbergs of grease and so-called flushable wipes in Rockland sewer systems, warning that ratepayers cover the rising maintenance burden.",
    source: "Town of Clarkstown",
    sourceUrl: "https://www.clarkstown.gov",
    date: "Feb. 28, 2024",
    url: "https://www.clarkstown.gov/weekly-column/not-so-flushable-wipes-wreak-havoc-on-rocklands-sewer-systems/",
    location: "Rockland County, New York",
  },
  {
    category: "Laws & proposals",
    title: "Bipartisan WIPPES Act introduced to require Do Not Flush wipe labels",
    summary:
      "House and Senate sponsors introduced the Wastewater Infrastructure Pollution Prevention and Environmental Safety Act to require clear non-flushable labeling on disposable wipes.",
    source: "Congresswoman Lisa McClain",
    sourceUrl: "https://mcclain.house.gov",
    date: "Apr. 27, 2023",
    url: "https://mcclain.house.gov/2023/4/mcclain-peltola-merkley-collins-introduce-bipartisan-bicameral-wippes-act",
    location: "United States",
  },
  {
    category: "Laws & proposals",
    title: "California AB 818 Do Not Flush wipe-labeling law takes effect",
    summary:
      "California required covered disposable wipes manufactured on or after July 1, 2022 to carry Do Not Flush wording and the industry no-flush symbol, setting the model later copied in federal WIPPES drafts.",
    source: "California Legislature",
    sourceUrl: "https://leginfo.legislature.ca.gov",
    date: "Jul. 01, 2022",
    url: "https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202120220AB818",
    location: "California, USA",
  },
  {
    category: "Catastrophes",
    title: "Macomb and Oakland counties report pandemic surge in wipe-clogged pumps",
    summary:
      "Metro Detroit public-works leaders said weekly wipe loads at one station jumped from about 1,000 pounds to 4,000 pounds during stay-home orders, with a cleanup priced near $450,000.",
    source: "FOX 2 Detroit",
    sourceUrl: "https://www.fox2detroit.com",
    date: "Apr. 01, 2021",
    url: "https://www.fox2detroit.com/news/macomb-oakland-county-disposable-wipes-fatberg",
    location: "Macomb County, Michigan",
  },
  {
    category: "Public warnings",
    title: "Middlesex Borough blames flushable wipes for dual pump-station failure",
    summary:
      "After both Green Brook Road pumps failed, crews found wipe-packed impellers and warned residents that pandemic wipe use was clogging the sanitary system and driving needless expense.",
    source: "Middlesex Borough",
    sourceUrl: "https://www.middlesexboro-nj.gov",
    date: "Jan. 30, 2021",
    url: "https://www.middlesexboro-nj.gov/latest-news/message-from-mayor-madden-discharging-flushable-wipes",
    location: "Middlesex Borough, New Jersey",
  },
  {
    category: "Infrastructure money",
    title: "NACWA estimates flushed wipes cost U.S. utilities about $441 million a year",
    summary:
      "The National Association of Clean Water Agencies studied documented utility costs and estimated about $441 million in added collection-system operating costs from flushed wipes nationwide.",
    source: "NACWA",
    sourceUrl: "https://www.nacwa.org",
    date: "Sep. 01, 2020",
    url: "https://www.nacwa.org/docs/default-source/resources---public/executive-summary_cost_of_wipes.pdf",
    location: "United States",
  },
  {
    category: "Laws & proposals",
    title: "Macomb County sues wipe makers over flushable labeling after fatberg damage",
    summary:
      "Public Works Commissioner Candice Miller filed suit seeking Do Not Flush labeling after wipe-and-grease masses, including the 19-ton Macomb fatberg, forced costly sewer cleanups.",
    source: "Michigan Public",
    sourceUrl: "https://www.michiganpublic.org",
    date: "May. 06, 2020",
    url: "https://www.michiganpublic.org/environment-science/2020-05-06/macomb-county-brings-suit-against-manufacturers-of-fatberg-causing-flushable-wipes",
    location: "Macomb County, Michigan",
  },
  {
    category: "Field & workforce",
    title: "King County operators fight weekly rag-ball clogs at Hidden Lake Pump Station",
    summary:
      "\"This pump station is a frequent flyer,\" operator Isaiah White said after wipe-packed pumps forced overnight callouts that can take five to six hours, putting Puget Sound overflow risk on the line.",
    source: "King County WTD",
    sourceUrl: "https://kingcountywtd.com",
    date: "Aug. 18, 2026",
    url: "https://kingcountywtd.com/2026/08/18/clogged-not-forgotten-the-hidden-reality-when-you-flush-wipes/",
    location: "Shoreline, Washington",
  },
  {
    category: "Solutions",
    title: "Work for Water highlights collections crews inventing tools against non-flushables",
    summary:
      "Work for Water covered operator-built wipe traps and public Bin the Wipe messaging, showing how collections professionals invent field tools when mislabeled flushables keep clogging systems.",
    source: "Work for Water",
    sourceUrl: "https://www.workforwater.org",
    date: "Dec. 01, 2021",
    url: "https://www.workforwater.org/collections-systems-professionals-invent-new-tools-for-battle-against-non-flushables/",
    location: "United States",
  },
  {
    category: "Conservation & waters",
    title: "Surfrider warns wipe clogs drive sewage spills into coastal watersheds",
    summary:
      "Surfrider said flushing wipes and other nondispersibles can fail sewers and septic systems, sending raw or partially treated sewage into coastal waterways and beaches while plastic fibers become microplastics.",
    source: "Surfrider Foundation",
    sourceUrl: "https://www.surfrider.org",
    date: "May. 12, 2020",
    url: "https://www.surfrider.org/news/dont-flush-wipes-down-the-toilet-sewage-spills-on-the-rise",
    location: "United States",
  },
  {
    category: "Conservation & waters",
    title: "Surfrider ties sewage spills and wipe clogs to coastal watershed pollution",
    summary:
      "Surfrider explained how grease, wipes, and failing infrastructure release under-treated sewage into rivers, bays, and surf zones, and urged trash-not-flush disposal even for products labeled flushable.",
    source: "Surfrider Foundation",
    sourceUrl: "https://www.surfrider.org",
    date: "Apr. 22, 2021",
    url: "https://www.surfrider.org/news/how-do-sewage-spills-and-failures-pollute-coastal-watersheds",
    location: "United States",
  },
  {
    category: "Science & standards",
    title: "IWSFG publishes flushability criteria to protect sewers, pumps, and screens",
    summary:
      "The International Water Services Flushability Group set PAS criteria so a product labeled flushable must clear toilets, disintegrate in the slosh-box test, settle, biodisintegrate, and avoid plastics that harm treatment and receiving waters.",
    source: "IWSFG",
    sourceUrl: "https://www.iwsfg.org",
    date: "Jun. 05, 2020",
    url: "https://www.iwsfg.org/wp-content/uploads/2021/06/IWSFG-PAS-1-Criteria-for-Recognition-as-a-Flushable-Product-2.pdf",
    location: "United States",
  },
  {
    category: "Science & standards",
    title: "Scientific Reports: flushable wet wipes lose dispersibility after wet storage",
    summary:
      "Peer-reviewed testing found wetlaid hydroentangled wipes that start dispersible can lose that performance during wet storage, undermining flushable marketing claims once products sit on shelves or in packs.",
    source: "Scientific Reports",
    sourceUrl: "https://www.nature.com",
    date: "Apr. 12, 2021",
    url: "https://www.nature.com/articles/s41598-021-86971-z",
    location: "United States",
  },
  {
    category: "Science & standards",
    title: "IWA study maps how wet wipes snag, accumulate, and persist in sewer pipes",
    summary:
      "Water Science & Technology experiments showed wipe snagging and accumulation vary with defect location and flow, while larger blockages dissipate slowly—evidence that nondispersibles linger in small-diameter sewers.",
    source: "IWA Publishing",
    sourceUrl: "https://iwaponline.com",
    date: "Sep. 01, 2024",
    url: "https://iwaponline.com/wst/article/90/5/1668/104262/Blockage-dynamics-in-sewer-pipes-investigating",
    location: "United States",
  },
  {
    category: "Technology",
    title: "WEF: pandemic flushables surge renews fight over pumps, screens, and labels",
    summary:
      "WEF cited up to $1 billion a year in U.S. nondispersible damage. Executive Director Walt Marlowe warned: \"Do not flush things that should not be flushed,\" as wipes clog pumps, overwhelm screens, and back up sewers.",
    source: "WEF",
    sourceUrl: "https://news.wef.org",
    date: "May. 15, 2020",
    url: "https://news.wef.org/coronavirus-pandemic-renews-interest-in-flushables-issue/",
    location: "United States",
  },
  {
    category: "Field & workforce",
    title: "Work for Water revisits utilities battling the wrath of the unflushables",
    summary:
      "Work for Water profiled humorous public outreach paired with real collections pain, noting flushed wipes and other so-called flushables keep driving costly blockages at water resource recovery facilities.",
    source: "Work for Water",
    sourceUrl: "https://www.workforwater.org",
    date: "May. 15, 2025",
    url: "https://www.workforwater.org/wrath-of-the-unflushables-an-intrepid-utility-battled-a-long-term-foe-and-influenced-flushing-behavior-with-humorous-toilet-talk/",
    location: "United States",
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
    date: "Apr. 07, 2026",
  },
  {
    lane: "Public burden",
    amount: "$441M/yr",
    snippet: "Utility estimate of annual collection-system costs connected to flushable wipes.",
    source: "NACWA",
    url: "https://www.nacwa.org/docs/default-source/resources---public/executive-summary_cost_of_wipes.pdf",
    location: "United States",
    title: "Annual utility burden from flushable wipes",
    date: "Sep. 01, 2020",
  },
  {
    lane: "Downstream impact",
    amount: "$414M",
    snippet: "Marine debris modeling indicates large tourism-spending losses when debris pressure increases.",
    source: "NOAA Marine Debris Program",
    url: "https://marinedebris.noaa.gov/research/economic-impacts-marine-debris-tourism-dependent-communities",
    location: "Great Lakes Region",
    title: "Economic impact from marine debris in tourism communities",
    date: "Jan. 01, 2021",
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

export function isScienceOrStandardsStory(title: string, summary: string, category = ""): boolean {
  const text = `${title} ${summary} ${category}`;
  return /(IWSFG|INDA|EDANA|scientific reports|peer.?reviewed|flushability (standard|criteria|test|guidelines)|dispersibility|water science|slosh box|microplastic)/i.test(
    text,
  );
}

export function isFlushableWipesStory(title: string, summary: string, category = ""): boolean {
  const text = `${title} ${summary} ${category}`.toLowerCase();
  return /(flushable wipe|flushable wipes|wet wipe|wet wipes|do not flush|wipes clog|wipe-?clog|wipe labeling|wippes act|non-?flushables?|unflushables?|\bwipes?\b)/i.test(
    text,
  );
}

/** Broad Flush Report relevance: wipes + solutions, science, receiving waters, orgs, and field tech. */
function isConsumerProductNoise(title: string, summary: string): boolean {
  const text = `${title} ${summary}`;
  return /(best flushable wipes|market to \d{4}|marketing budget|holiday ad|collab|hand butts|fragrance free flushable|sensitive-skin demand|big marketing)/i.test(
    text,
  );
}

export function isFlushReportStory(title: string, summary: string, category = ""): boolean {
  if (isConsumerProductNoise(title, summary)) return false;
  const text = `${title} ${summary} ${category}`;
  if (isScienceOrStandardsStory(title, summary, category)) return true;

  const hasWastewater = /(wastewater|sewer|sewage|lift[ -]?station|pump[ -]?station|collections? system|treatment plant|WRRF|utility|public works)/i.test(
    text,
  );
  const hasProblemOrSolution =
    /(non-?flushables?|nondispersibles?|ragging|deragg|fatberg|screen(?:ing)?|grinder|solids handling|cutter plate|overflow|backup|clog|blockage|bypass|discharge|receiving water|watershed|surfrider|work for water|\bWEF\b|NACWA|CASA|IWSFG|proposal|solution|pilot|labeling|WIPPES|do not flush)/i.test(
      text,
    );

  const hasSectorOrg = /(surfrider|work for water|\bWEF\b|NACWA|CASA|IWSFG)/i.test(text);

  if (hasWastewater && hasProblemOrSolution) return true;
  if (hasSectorOrg && isFlushableWipesStory(title, summary, category)) return true;
  if (isFlushableWipesStory(title, summary, category) && hasWastewater) return true;
  if (isFlushableWipesStory(title, summary, category) && /(law|bill|proposal|legislation|ordinance|standard|study|pump)/i.test(text)) {
    return true;
  }
  return false;
}

function passesGeographyGate(title: string, summary: string, location: string, category = ""): boolean {
  if (isScienceOrStandardsStory(title, summary, category)) return true;
  if (/(surfrider|work for water|nacwa|casa|wef news|iwsfg)/i.test(`${title} ${summary} ${category}`)) return true;
  return isUsOnlyStory(title, summary, location);
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

export function extractDollarAmount(text: string): string | null {
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
  const response = await fetch(`/api/news-rss?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`Failed to fetch RSS for ${query}`);
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  if (contentType.includes("application/json") || body.trimStart().startsWith("{")) {
    throw new Error(`News proxy rejected query: ${query}`);
  }
  return parseRss(body);
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

/** TODAY marks only recent publications in the live drop — not old archive hits Google resurfaces. */
function isRecentPublication(dateValue: string, maxAgeDays = 21): boolean {
  const timestamp = toStoryTimestamp(dateValue);
  if (!timestamp) return false;
  const ageMs = Date.now() - timestamp;
  return ageMs >= -86_400_000 && ageMs <= maxAgeDays * 86_400_000;
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

export function normalizeArticleUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function normalizeArticleTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function sameArticle(a: { url: string; title: string }, b: { url: string; title: string }): boolean {
  const urlA = normalizeArticleUrl(a.url);
  const urlB = normalizeArticleUrl(b.url);
  if (urlA && urlB && urlA === urlB) return true;
  const titleA = normalizeArticleTitle(a.title);
  const titleB = normalizeArticleTitle(b.title);
  return Boolean(titleA && titleB && titleA === titleB);
}

export function takeUniqueArticles<T extends { url: string; title: string }>(
  items: T[],
  seen: { urls: Set<string>; titles: Set<string> } = { urls: new Set(), titles: new Set() },
): T[] {
  const picked: T[] = [];
  for (const item of items) {
    const url = normalizeArticleUrl(item.url);
    const title = normalizeArticleTitle(item.title);
    if ((url && seen.urls.has(url)) || (title && seen.titles.has(title))) continue;
    if (url) seen.urls.add(url);
    if (title) seen.titles.add(title);
    picked.push(item);
  }
  return picked;
}

const moneyLanes: Array<{
  lane: DailyCostSignal["lane"];
  matcher: RegExp;
}> = [
  { lane: "Pump repairs", matcher: /(pump|lift station|repair|clog|equipment|maintenance|debris|backup)/i },
  { lane: "Public burden", matcher: /(ratepayer|taxpayer|budget|grant|funding|cost|money|utility)/i },
  { lane: "Downstream impact", matcher: /(downstream|spill|overflow|river|ocean|shore|waterway|contamination)/i },
];

export function buildTodayCostSignals(stories: DailyNewsStory[]): DailyCostSignal[] {
  const signals: DailyCostSignal[] = [];
  const used: DailyNewsStory[] = [];
  const costTheme = /(cost|costly|expense|expensive|repair|repairs|replacement|maintenance|overtime|budget|funding|grant|ratepayer|taxpayer|burden|financial|money|cleanup|bill|rate)/i;
  // Same umbrella scrape as the news desk, but keep only cost-themed hits with dollar figures.
  const newestFirst = [...stories].sort((a, b) => toStoryTimestamp(b.date) - toStoryTimestamp(a.date));

  for (const lane of moneyLanes) {
    const matches = newestFirst.filter((story) => {
      if (used.some((item) => sameArticle(item, story))) return false;
      const haystack = `${story.title} ${story.summary} ${story.category} ${story.location}`;
      const laneHit =
        lane.matcher.test(haystack) || (lane.lane === "Public burden" && /infrastructure money/i.test(story.category));
      if (!laneHit || !costTheme.test(haystack)) return false;
      return Boolean(extractDollarAmount(haystack));
    });

    for (const match of matches) {
      used.push(match);
      const haystack = `${match.title} ${match.summary}`;
      const amount = extractDollarAmount(haystack);
      if (!amount) continue;
      signals.push({
        lane: lane.lane,
        amount,
        snippet: match.summary,
        source: match.source,
        url: match.url,
        location: match.location,
        title: match.title,
        date: match.date,
        releasedToday: Boolean(match.releasedToday),
      });
    }
  }

  return signals;
}

const MONEY_CARD_BASE_KEY = "flush-report-money-card-base-v1";
const MONEY_CARD_BASE_LIMIT = 24;

export function readMoneyCardArchive(): DailyCostSignal[] {
  try {
    const raw = localStorage.getItem(MONEY_CARD_BASE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyCostSignal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberMoneyCards(incoming: DailyCostSignal[]): DailyCostSignal[] {
  // Archive only cost cards that still carry a dollar figure.
  const withAmount = (card: DailyCostSignal) => Boolean(card.amount);
  const archived = incoming.filter(withAmount).map((card) => ({ ...card, releasedToday: false }));
  const next = takeUniqueArticles([...archived, ...readMoneyCardArchive().filter(withAmount)]).slice(
    0,
    MONEY_CARD_BASE_LIMIT,
  );
  try {
    localStorage.setItem(MONEY_CARD_BASE_KEY, JSON.stringify(next));
  } catch {
    // Ignore archive write failures.
  }
  return next;
}

function withStandingLibrary(released: DailyNewsStory[]): DailyNewsStory[] {
  const fresh = released
    .filter((story) => story.url && !fallbackDailyStories.some((standing) => sameArticle(standing, story)))
    .map((story) => ({ ...story, releasedToday: isRecentPublication(story.date) }))
    .sort((a, b) => toStoryTimestamp(b.date) - toStoryTimestamp(a.date));
  const standing = fallbackDailyStories
    .map((story) => ({ ...story, releasedToday: false }))
    .sort((a, b) => toStoryTimestamp(b.date) - toStoryTimestamp(a.date));
  const mixed: DailyNewsStory[] = [];
  const push = (story?: DailyNewsStory) => {
    if (!story || mixed.some((item) => sameArticle(item, story))) return;
    mixed.push(story);
  };

  // Always lead with newest umbrella finds, then fill gaps from the standing archive.
  for (const story of fresh) push(story);
  for (const story of standing) push(story);
  return mixed;
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
      note: "Using the 10:00am Eastern national drop already saved for this cycle.",
    });
    return withStandingLibrary(cached);
  }

  try {
    // 1) Fresh umbrella hunt first (laws, proposals, solutions, spills, science, waters).
    // 2) Lane queries fill topic gaps after that.
    const laneQueries = newsLanes.flatMap((lane) => lane.queries);
    const orderedQueries = [...UMBRELLA_FRESH_QUERIES, ...laneQueries];
    const feedResults = await Promise.all(orderedQueries.map((query) => fetchFeed(query)));
    const combined = feedResults.flat();
    const deduped = Array.from(new Map(combined.map((item) => [item.url, item])).values());
    const filtered = deduped.filter((item) => isFlushReportStory(item.title, item.summary, item.category));

    const geoStories = filtered.filter((item) =>
      passesGeographyGate(item.title, item.summary, item.location, item.category),
    );
    const from2020On = geoStories.filter((item) => {
      const timestamp = toStoryTimestamp(item.date);
      if (!timestamp) return true;
      return new Date(timestamp).getUTCFullYear() >= 2020;
    });
    // Newest first across the umbrella, then keep a lane minimum so laws/proposals/solutions stay visible.
    const newestFirst = [...from2020On].sort((a, b) => toStoryTimestamp(b.date) - toStoryTimestamp(a.date));
    const laneBalanced = curateByLane(from2020On);
    const merged = Array.from(
      new Map([...newestFirst, ...laneBalanced].map((item) => [item.url, item])).values(),
    )
      .sort((a, b) => toStoryTimestamp(b.date) - toStoryTimestamp(a.date))
      .slice(0, NEWS_LIMIT);
    const accessibleTopStories = await filterAccessibleByUrl(merged);

    if (accessibleTopStories.length === 0) {
      updateScrapeStatus("dailyStories", {
        interval: "daily",
        source: "fallback",
        itemCount: fallbackDailyStories.length,
        intervalKey: dayKey,
        lastAttemptAt: nowIso,
        lastFailureAt: nowIso,
        note: "Fresh umbrella search found no new national stories. Standing articles stay up.",
      });
      return withStandingLibrary([]);
    }

    writeCache(accessibleTopStories);
    updateScrapeStatus("dailyStories", {
      interval: "daily",
      source: "live",
      itemCount: accessibleTopStories.length,
      intervalKey: dayKey,
      lastAttemptAt: nowIso,
      lastSuccessAt: nowIso,
      note: "Fresh umbrella drop (laws, proposals, solutions, and related topics) leads the standing archive.",
    });
    return withStandingLibrary(accessibleTopStories);
  } catch {
    updateScrapeStatus("dailyStories", {
      interval: "daily",
      source: "fallback",
      itemCount: fallbackDailyStories.length,
      intervalKey: dayKey,
      lastAttemptAt: nowIso,
      lastFailureAt: nowIso,
      note: "Fresh umbrella search failed. Standing articles stay up.",
    });
    return withStandingLibrary([]);
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
      const matchesLane = (story: DailyNewsStory, todayOnly: boolean) => {
        if (usedUrls.has(story.url)) return false;
        if (todayOnly && !story.releasedToday) return false;
        const haystack = `${story.title} ${story.summary} ${story.category} ${story.location}`;
        return pool.matcher.test(haystack);
      };
      const match = stories.find((story) => matchesLane(story, true)) ?? stories.find((story) => matchesLane(story, false));

      if (match) {
        const haystack = `${match.title} ${match.summary}`;
        signals.push({
          lane: pool.lane,
          amount: extractDollarAmount(haystack) ?? "",
          snippet: match.summary,
          source: match.source,
          url: match.url,
          location: match.location,
          title: match.title,
          date: match.date,
          releasedToday: Boolean(match.releasedToday),
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
