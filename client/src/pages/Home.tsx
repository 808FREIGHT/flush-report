// Design philosophy reminder: Coastal Public-Service News for The Flush Report.
// This page should feel brighter, warmer, and more human than the first version: professional white
// editorial surfaces, ocean blue backgrounds, sea-glass accents, calm broadcast structure, and a
// soulful Hawaii-origin mission centered on consumer accountability rather than corporate shaming.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Camera,
  Factory,
  Gauge,
  Landmark,
  Newspaper,
  Recycle,
  ShieldAlert,
  ShoppingBag,
  Zap,
  Waves,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { SiThreads } from "react-icons/si";
import RagPicsCard from "@/components/RagPicsCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DailyNewsStory,
  DailyCostSignal,
  clearScrapeCaches,
  fallbackCostSignals,
  fallbackDailyStories,
  getScrapeStatusSnapshot,
  isUsOnlyStory,
  buildTodayCostSignals,
  loadDailyWastewaterStories,
  readMoneyCardArchive,
  rememberMoneyCards,
  runScrapeDiagnostics,
  takeUniqueArticles,
} from "@/lib/dailyNews";
import { markTaxpayer } from "@/lib/markTaxpayer";
import { lookupRepresentativesByZip, type Representative } from "@/lib/representatives";

const defaultTickerStories = fallbackDailyStories.slice(0, 5).map((story) => ({
  ...story,
}));

const hawaiiHeroStories: DailyNewsStory[] = [
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
    releasedToday: true,
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
    releasedToday: true,
  },
  {
    category: "Public warnings",
    title: "Hawaii County pleads with residents not to flush so-called flushable wipes",
    summary:
      "County environmental officials said wipes stay whole, catch inside pipes and pump stations, and can block the sewer so toilets and drains back up.",
    source: "Hawaii County DEM",
    sourceUrl: "https://hawaiizerowaste.org",
    date: "Mar. 20, 2020",
    url: "https://hawaiizerowaste.org/site-content/uploads/2020-03-20-DEM-Issues-Plea-to-Not-Flush-So-called-Flushable-Wipes-press-release.pdf",
    location: "Hawaii Island",
  },
  {
    category: "Public warnings",
    title: "Honolulu warns flushing wipes can clog pump stations and spill sewage",
    summary:
      "The city's environmental department said only pee, poop, and toilet paper belong in the sewer. Wipes labeled flushable still do not break down and can jam pipes, pump stations, and treatment plants.",
    source: "Honolulu Star-Advertiser",
    sourceUrl: "https://www.staradvertiser.com",
    author: "Nina Wu",
    date: "Mar. 23, 2020",
    url: "https://www.staradvertiser.com/2020/03/23/breaking-news/honolulu-officials-flushing-wipes-down-toilet-could-cause-sewer-backups-and-spills-on-oahu/",
    location: "Honolulu, Hawaii",
  },
  {
    category: "Infrastructure money",
    title: "Hilo operators say flushable wipes foul pumps as the plant needs about $100 million",
    summary:
      "Plant staff told Hawaii News Now that wipes and other flushed trash foul pumps. Hawaii County said the aging Hilo plant needs about $100 million, and a pump short spilled 8,600 gallons offshore of Keaukaha.",
    source: "Hawaii News Now",
    sourceUrl: "https://www.hawaiinewsnow.com",
    author: "Allyson Blair",
    date: "Feb. 09, 2022",
    url: "https://www.hawaiinewsnow.com/2022/02/10/hilos-sewage-plant-danger-complete-failure-could-trigger-environmental-disaster/",
    location: "Hilo, Hawaii",
  },
  {
    category: "Infrastructure money",
    title: "Hawaii County tells lawmakers wipes clog pumps and drive up repair costs",
    summary:
      "The Department of Environmental Management supported do-not-flush labeling, saying wipes block screens, pumps, and lines and force more repairs, replacements, and hands-on cleanouts.",
    source: "Hawaii County DEM",
    sourceUrl: "https://www.capitol.hawaii.gov",
    date: "Feb. 24, 2025",
    url: "https://www.capitol.hawaii.gov/sessions/session2025/Testimony/HB918_HD1_TESTIMONY_JHA_02-25-25_.PDF",
    location: "Hawaii Island",
  },
  {
    category: "Infrastructure money",
    title: "County awards $337 million to rebuild Hilo's wastewater plant and pump stations",
    summary:
      "Hawaii County awarded Nan Inc. a $337 million contract to replace failing Hilo plant equipment, including pumping stations and the headworks that pull out large debris, after years of corrosion and deferred repair.",
    source: "Hawaii County",
    sourceUrl: "https://www.hawaiicounty.gov",
    date: "Feb. 11, 2025",
    url: "https://www.hawaiicounty.gov/Home/Components/News/News/3924/720",
    location: "Hilo, Hawaii",
  },
  {
    category: "Public warnings",
    title: "Star-Advertiser: nearly all material in sewer clogs should never have been flushed",
    summary:
      "A sewage-debris study covered by the Star-Advertiser found wipes and other non-flushable items make up almost all of what crews pull from lines, and utilities spend hundreds of millions a year dealing with it.",
    source: "Honolulu Star-Advertiser",
    sourceUrl: "https://www.staradvertiser.com",
    date: "Jun. 03, 2024",
    url: "https://www.staradvertiser.com/2024/06/03/hawaii-renovation/new-study-shows-99-of-materials-causing-sewage-clogs-should-never-have-been-flushed/",
    location: "Honolulu, Hawaii",
  },
  {
    category: "Catastrophes",
    title: "Pump failure spills about 6,000 gallons at Kauai's Coco Palms station",
    summary:
      "Kauai County said a failed pump controller left the Wailua Coco Palms pumps dead and spilled about 6,000 gallons inside a fenced yard. The sewage did not reach state waters.",
    source: "Honolulu Star-Advertiser",
    sourceUrl: "https://www.staradvertiser.com",
    date: "May 01, 2024",
    url: "https://www.staradvertiser.com/2024/05/01/breaking-news/pump-failure-caused-wastewater-spill-at-kauais-coco-palms-station/",
    location: "Wailua, Kauai",
  },
  {
    category: "Catastrophes",
    title: "EPA investigates wastewater released into Puhi Bay from Hilo's sewage plant",
    summary:
      "Civil Beat reported a large release from the troubled Hilo plant into Puhi Bay, the same shoreline outfall that takes treated wastewater from Keaukaha.",
    source: "Honolulu Civil Beat",
    sourceUrl: "https://www.civilbeat.org",
    date: "Jun. 2024",
    url: "https://www.civilbeat.org/2024/06/epa-is-investigating-wastewater-released-into-puhi-bay-from-troubled-hilo-sewage-plant/",
    location: "Puhi Bay, Hawaii",
  },
];

function mixHeroStories(national: DailyNewsStory[], hawaii: DailyNewsStory[]): DailyNewsStory[] {
  const mixed: DailyNewsStory[] = [];
  const seen = new Set<string>();
  const push = (story?: DailyNewsStory) => {
    if (!story) return;
    const key = `${story.url}::${story.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    mixed.push(story);
  };
  const length = Math.max(national.length, hawaii.length);
  for (let index = 0; index < length; index += 1) {
    push(hawaii[index]);
    push(national[index]);
  }
  return mixed;
}

function mixFlaggedWithStanding<T extends { url: string; releasedToday?: boolean }>(fresh: T[], standing: T[]): T[] {
  const mixed: T[] = [];
  const seen = new Set<string>();
  const push = (item?: T) => {
    if (!item || seen.has(item.url)) return;
    seen.add(item.url);
    mixed.push(item);
  };
  const length = Math.max(fresh.length, standing.length);
  for (let index = 0; index < length; index += 1) {
    push(fresh[index]);
    push(standing[index]);
  }
  return mixed;
}

const timeZoneOptions = [
  { label: "Hawaii-Aleutian", value: "Pacific/Honolulu" },
  { label: "Alaska", value: "America/Anchorage" },
  { label: "Pacific", value: "America/Los_Angeles" },
  { label: "Mountain", value: "America/Denver" },
  { label: "Central", value: "America/Chicago" },
  { label: "Eastern", value: "America/New_York" },
];

// Social Media and Merch stay parked until those lanes are live. Set parked to false to show them again.
const featurePills = [
  {
    title: "Daily News",
    eyebrow: "Latest coverage",
    copy: "Source-backed wastewater news, laws, system failures, and public warnings.",
    href: "/news",
    action: "Read the latest",
    icon: Newspaper,
    neonTitle: true,
    parked: false,
  },
  {
    title: "Social Media",
    eyebrow: "The Flush Report",
    copy: "Video features open soon.",
    href: null,
    action: "Coming soon",
    icon: Camera,
    showSocialIcons: true,
    parked: true,
  },
  {
    title: "Merch",
    eyebrow: "Latest gear",
    copy: "Shirts, hats, and stickers are on the way.",
    href: null,
    action: "Coming soon",
    icon: ShoppingBag,
    parked: true,
  },
];

const adPlacements = {
  awareness: {
    label: "BECOME A SPONSOR!",
    title: "Support public education",
    copy: "This space supports organizations committed to clean water, public infrastructure, and consumer awareness.",
    slot: "Awareness partner",
  },
  field: {
    label: "BECOME A SPONSOR!",
    title: "Equipment & field gear",
    copy: "Built for the operators and crews who keep systems running. Featured partners serve the wastewater and infrastructure industry.",
    slot: "Industry partner",
  },
  community: {
    label: "BECOME A SPONSOR!",
    title: "Industry partners",
    copy: "Utilities, manufacturers, and service providers supporting public education and infrastructure awareness.",
    slot: "Industry partner",
  },
  closing: {
    label: "BECOME A SPONSOR!",
    title: "Closing sponsor",
    copy: "A final word from partners who believe in clean water and informed communities.",
    slot: "Partner",
  },
};

const socialApps = [
  { label: "Instagram", key: "instagram", Icon: FaInstagram },
  { label: "TikTok", key: "tiktok", Icon: FaTiktok },
  { label: "Facebook", key: "facebook", Icon: FaFacebookF },
  { label: "YouTube", key: "youtube", Icon: FaYoutube },
  { label: "X", key: "x", Icon: FaXTwitter },
  { label: "Threads", key: "threads", Icon: SiThreads },
];


const thinkBeforeImages = [
  { src: "/think-before/01.png", alt: "Heavy rag ball pulled from wastewater intake" },
  { src: "/think-before/02.png", alt: "Large wipe clog removed by wastewater crew" },
  { src: "/think-before/03.png", alt: "Wet wipe mass caught on plant screen" },
  { src: "/think-before/04.png", alt: "Soggy wipe and debris buildup from line cleanup" },
  { src: "/think-before/05.png", alt: "Dark sludge and wipes packed in channel" },
  { src: "/think-before/06.png", alt: "Wipe debris mound removed from drain opening" },
  { src: "/think-before/07.png", alt: "Clogged wipe mass with organic debris on platform" },
  { src: "/think-before/08.png", alt: "Rag-heavy clog pulled from wastewater lane" },
  { src: "/think-before/09.png", alt: "Light-colored debris pile beside storm channel" },
  { src: "/think-before/10.png", alt: "Wipes tangled around nozzle and cleanup wand" },
  { src: "/think-before/11.png", alt: "Trash-laden wipe debris pile from field response" },
  { src: "/think-before/12.png", alt: "Close-up of mixed trash and wipes during removal" },
  { src: "/think-before/13.png", alt: "Dark fibrous blockage with cable in runoff" },
  { src: "/think-before/14.png", alt: "Large pale clog pile removed from trench" },
  { src: "/think-before/15.png", alt: "Truck bin full of extracted wipes and sludge" },
  { src: "/think-before/16.jpg", alt: "Shovel lifting a tan rag mass off a wet pad" },
  { src: "/think-before/17.jpg", alt: "Pale wipe pile pulled against a curb" },
  { src: "/think-before/18.jpg", alt: "Mixed rags and trash sitting in muddy water" },
  { src: "/think-before/19.jpg", alt: "Black rag pile raked up in the rain" },
  { src: "/think-before/20.jpg", alt: "Plastics and bottles stranded along a treatment channel" },
  { src: "/think-before/21.jpg", alt: "Red dumpster packed with black rag debris" },
  { src: "/think-before/22.jpg", alt: "Wipes and bottles washed onto a channel bank" },
  { src: "/think-before/23.jpg", alt: "Debris bank beside a channel with washdown pipes" },
  { src: "/think-before/24.jpg", alt: "Hopper full of wipes, gloves, and mixed trash" },
  { src: "/think-before/25.jpg", alt: "Screenings chute dropping rags into a hopper" },
  { src: "/think-before/26.jpg", alt: "Close view of plastics and wipes on a channel edge" },
  { src: "/think-before/27.jpg", alt: "Bin of wipes, bottles, and gloves from a cleanup" },
  { src: "/think-before/28.jpg", alt: "Rag pile with bottles beside a crew member" },
  { src: "/think-before/29.jpg", alt: "Tan rag mass pulled behind concrete blocks" },
  { src: "/think-before/30.jpg", alt: "Rag pile with a rake at the edge of the pad" },
  { src: "/think-before/31.jpg", alt: "Rake buried in a brown rag mound" },
  { src: "/think-before/32.jpg", alt: "Wet rag mass piled against a concrete wall" },
  { src: "/think-before/33.jpg", alt: "Close view of a dark compacted rag clog" },
  { src: "/think-before/34.jpg", alt: "Clogged nozzle and wand pulled from the line" },
  { src: "/think-before/35.jpg", alt: "Rake standing in a rag pile next to a bottle" },
  { src: "/think-before/36.jpg", alt: "Grease chunks cleared beside an open channel" },
  { src: "/think-before/37.jpg", alt: "Rake resting on a fresh rag pile" },
  { src: "/think-before/38.jpg", alt: "Perforated screen wrapped in flushed wipes" },
  { src: "/think-before/39.jpg", alt: "Wipes wrapped tight around a pipe" },
  { src: "/think-before/40.jpg", alt: "Street pile of wipes and plastic debris" },
  { src: "/think-before/41.jpg", alt: "Large tan rag mound on the wet pad" },
  { src: "/think-before/42.jpg", alt: "Close view of a fibrous tan rag mass" },
  { src: "/think-before/43.jpg", alt: "Rag mass bagged after removal" },
  { src: "/think-before/44.jpg", alt: "Dumpster of rags, a mask, and a bottle" },
  { src: "/think-before/45.jpg", alt: "Dumpster loaded with rags and a trash bag" },
  { src: "/think-before/46.jpg", alt: "Rags spread across diamond plate" },
  { src: "/think-before/47.jpg", alt: "Basket full of dark rag debris" },
  { src: "/think-before/48.jpg", alt: "Wipes and debris laid out on diamond plate" },
  { src: "/think-before/49.jpg", alt: "Rag pile with leaves pulled from the flow" },
  { src: "/think-before/50.jpg", alt: "Rags draped over a bar screen" },
  { src: "/think-before/51.jpg", alt: "Bar screen covered in a sheet of rags" },
  { src: "/think-before/52.jpg", alt: "Large rag mass with a leaf on the deck" },
  { src: "/think-before/53.jpg", alt: "Rag mound sitting in a treatment channel" },
  { src: "/think-before/54.jpg", alt: "Rain-soaked rag mound along the curb" },
  { src: "/think-before/55.jpg", alt: "Wide view of a rain-soaked rag mound" },
  { src: "/think-before/56.jpg", alt: "Pitchfork lifting a rag mass out of a wet channel" },
  { src: "/think-before/57.jpg", alt: "Rake pulling wipes and leaves off the wet curb" },
  { src: "/think-before/58.jpg", alt: "Rake lifting a pile of wipes beside a trash bin" },
];

const costSlideshowImages = [
  { src: "/cost-slideshow/01.png", alt: "Wipe debris pulled from a wastewater pump intake" },
  { src: "/cost-slideshow/02.png", alt: "Large wipe mass dropping into a wastewater disposal bin" },
  { src: "/cost-slideshow/03.png", alt: "Compressed block of flushed wipe debris collected at treatment operations" },
  { src: "/cost-slideshow/04.png", alt: "Pump housing opened to reveal flushable wipe clog buildup" },
  { src: "/cost-slideshow/05.png", alt: "Industrial pump chamber packed with wet wipe debris" },
  { src: "/cost-slideshow/06.png", alt: "Rows of treatment screens overloaded with wipe debris and strands" },
  { src: "/cost-slideshow/07.png", alt: "Large dark rope-like wipe clog removed from wastewater equipment" },
];

const impactStats = [
  {
    label: "Pump repairs",
    value: "$100–$100K+",
    copy: "Preventable clogs can turn routine maintenance into expensive emergency work.",
    icon: Gauge,
  },
  {
    label: "Public burden",
    value: "Taxpayers pay",
    copy: "Money spent clearing bad flushes is money not going toward stronger community needs.",
    icon: Landmark,
  },
  {
    label: "Downstream impact",
    value: "Water + landfill",
    copy: "What disappears from a toilet can reappear as operator labor, hauled debris, or water-quality strain.",
    icon: Waves,
  },
];

const evidenceBoard = [
  {
    title: "Pump repairs",
    items: [
      {
        stat: "$50K+",
        copy: "A city reported spending over $50,000 to replace one lift-station pump after wipe clogs pushed it beyond repair.",
        source: "Cordova Times (2026)",
        url: "https://thecordovatimes.com/2026/04/07/50k-city-sewer-pump-replacement-attributed-to-un-flushable-wipes/",
      },
      {
        stat: "$25K-$60K",
        copy: "Utility notice reports pump replacements can cost $25,000-$60,000 each before overtime and disposal costs.",
        source: "City of Lennox (2026)",
        url: "https://www.cityoflennoxsd.com/article/2816312",
      },
      {
        stat: "$4K-$8K",
        copy: "A municipal utility manager cited pump repair costs of $4,000-$8,000 per pump from wipe-related failures.",
        source: "KRIS report / San Diego MUD #1",
        url: "https://www.kristv.com/news/local-news/in-your-neighborhood/jim-wells-county/san-diego/flushable-wipes-damaging-san-diego-city-sewer-pumps",
      },
    ],
  },
  {
    title: "Public burden",
    items: [
      {
        stat: "$441M/yr",
        copy: "National utility estimate: wipes add about $441 million per year in collection-system operating costs.",
        source: "NACWA Executive Summary",
        url: "https://www.nacwa.org/docs/default-source/resources---public/executive-summary_cost_of_wipes.pdf",
      },
      {
        stat: "$30,467/yr",
        copy: "Average additional cost burden per utility, with some states near $100,000 per utility each year.",
        source: "NACWA Executive Summary",
        url: "https://www.nacwa.org/docs/default-source/resources---public/executive-summary_cost_of_wipes.pdf",
      },
      {
        stat: "$130K + $370,695.75",
        copy: "One town cited rising wipe jams while approving major maintenance and sewer cleaning contract costs.",
        source: "Lockport coverage (2026)",
        url: "https://www.yahoo.com/news/articles/flushing-wet-wipes-costs-town-131600152.html",
      },
    ],
  },
  {
    title: "Downstream impact",
    items: [
      {
        stat: "$414M + 4,300 jobs",
        copy: "NOAA estimates doubling marine debris can cut tourism spending by $414 million and nearly 4,300 jobs in one region.",
        source: "NOAA Marine Debris Program",
        url: "https://marinedebris.noaa.gov/research/economic-impacts-marine-debris-tourism-dependent-communities",
      },
      {
        stat: "$217M + 3,700 jobs",
        copy: "NOAA also estimates near-elimination of debris could add $217 million and over 3,700 jobs in coastal Ohio.",
        source: "NOAA Marine Debris Program",
        url: "https://marinedebris.noaa.gov/research/economic-impacts-marine-debris-tourism-dependent-communities",
      },
      {
        stat: "$11.5B/yr",
        copy: "EPA cites U.S. litter cleanup spending near $11.5 billion per year, a broad burden carried by communities.",
        source: "EPA Trash Free Waters",
        url: "https://www.epa.gov/trash-free-waters/learn-about-aquatic-trash",
      },
    ],
  },
];

const flowSteps = [
  {
    step: "01",
    title: "The FLUSH",
    copy: "When you flush wipes, rags, grease, and trash, they do not simply disappear. It is the start of what can become an expensive repair or environmental catastrophe, leaving taxpayers to pick up the unexpected bill. DO NOT FLUSH FLUSHABLE WIPES!!!",
    icon: ShieldAlert,
  },
  {
    step: "02",
    title: "THE STRESS ON SEWER SYSTEMS",
    copy: "After you flush, so-called flushable wipes and other non-toilet items enter the sewer system, also called the collection system. This system includes sewer lines and pump stations that move wastewater to treatment plants. When anything other than the 3 Ps (pee, poop, and toilet paper) is flushed, it puts serious stress on pumps and sewer lines. That stress can lead to clogs, equipment damage, and expensive repairs. DO NOT FLUSH FLUSHABLE WIPES!!!",
    icon: Factory,
  },
  {
    step: "03",
    title: "THE REPAIR.",
    copy: "Millions of taxpayer dollars have already been invested into wastewater systems. Flushable wipes are a leading cause of costly repairs, overtime labor, emergency response, and hazardous-condition work. Some pumps become irreparable and can cost from $100 to $100,000+ to replace. Burst sewer lines can run into the millions to reroute, excavate, install, and reconnect system infrastructure. DO NOT FLUSH FLUSHABLE WIPES!!!",
    icon: BadgeDollarSign,
  },
  {
    step: "04",
    title: "THE LANDFILL",
    copy: "Flushable wipes and other non-flushable items do not simply disappear. After operators remove clogs from pumps and debris screening systems, they must then collect, store, and transport that material to THE LANDFILL. This adds more stress to systems that are already environmentally stressed. The extra tonnage increases financial burdens on taxpayers through heavier loads and more landfill trips at taxpayer expense. DO NOT FLUSH FLUSHABLE WIPES!!!",
    icon: Recycle,
  },
];

type CostSectionArticle = {
  category: string;
  title: string;
  source: string;
  sourceUrl?: string;
  blurb: string;
  url: string;
  costAmount: string;
  releasedToday?: boolean;
};

const HERO_WARNING_FALLBACK =
  fallbackDailyStories.find((story) => /warning|alert|flushable wipes|wipes|do not flush/i.test(`${story.category} ${story.title} ${story.summary}`)) ??
  fallbackDailyStories[0];

function pickHeroWarningStory(stories: DailyNewsStory[]): DailyNewsStory {
  const byRiskSignal = stories.find((story) =>
    /(flushable wipes|wipes|do not flush|clog|sewer damage|utility warning|public works alert)/i.test(
      `${story.category} ${story.title} ${story.summary}`,
    ),
  );
  return byRiskSignal ?? HERO_WARNING_FALLBACK;
}

function toCostSectionArticles(stories: DailyNewsStory[]): CostSectionArticle[] {
  const extractCostAmount = (text: string): string | null => {
    const dollarMatch = text.match(/\$\s?\d[\d,]*(?:\.\d+)?\s?(?:[KMBT]|million|billion|thousand)?(?:\/yr|\/year)?/i);
    if (dollarMatch) {
      return dollarMatch[0]
        .replace(/\s+/g, "")
        .replace(/million/i, "M")
        .replace(/billion/i, "B")
        .replace(/thousand/i, "K");
    }
    const scaledMatch = text.match(/\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(million|billion|thousand)\b/i);
    if (scaledMatch) {
      const suffix = scaledMatch[2].toLowerCase().startsWith("million")
        ? "M"
        : scaledMatch[2].toLowerCase().startsWith("billion")
          ? "B"
          : "K";
      return `$${scaledMatch[1]}${suffix}`;
    }
    return null;
  };

  const hasDollarSignal = (text: string) =>
    /\$\s?\d[\d,]*(?:\.\d+)?|\b\d+(?:\.\d+)?\s?(million|billion|thousand|m|b|k)\b/i.test(text);

  const costRepairScore = (story: DailyNewsStory): number => {
    const haystack = `${story.title} ${story.summary} ${story.category} ${story.location}`;
    let score = 0;

    if (hasDollarSignal(haystack)) score += 5;
    if (/(cost|costly|expense|expensive|repair|repairs|replacement|maintenance|overtime|budget|funding|grant|ratepayer|taxpayer|burden|financial|money)/i.test(haystack)) score += 4;
    if (/(pump|lift station|sewer line|infrastructure|damage|failure)/i.test(haystack)) score += 2;
    if (/infrastructure money/i.test(story.category)) score += 2;

    return score;
  };

  return stories
    .map((story) => {
      const costAmount = extractCostAmount(`${story.title} ${story.summary}`);
      const score = costRepairScore(story) + (costAmount ? 8 : 0);
      return { story, score, costAmount };
    })
    .filter((entry) => entry.score >= 8 && Boolean(entry.costAmount))
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({
      story: entry.story,
      costAmount: entry.costAmount || "$—",
    }))
    .map(({ story, costAmount }) => ({
      category: story.category,
      title: story.title,
      source: story.source,
      sourceUrl: story.sourceUrl,
      blurb: story.summary || "Source-backed reporting on flushable-wipes system and cost impacts.",
      url: story.url,
      costAmount,
      releasedToday: Boolean(story.releasedToday),
    }));
}

function ensureSentence(value: string): string {
  const text = value.trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function moneyLaneForText(text: string): DailyCostSignal["lane"] {
  if (/(downstream|spill|overflow|river|ocean|shore|waterway|contamination)/i.test(text)) return "Downstream impact";
  if (/(pump|lift station|repair|clog|equipment|maintenance|debris|backup)/i.test(text)) return "Pump repairs";
  return "Public burden";
}

function costArticleToMoneyCard(article: CostSectionArticle): DailyCostSignal {
  return {
    lane: moneyLaneForText(`${article.category} ${article.title} ${article.blurb}`),
    amount: article.costAmount,
    snippet: article.blurb,
    source: article.source,
    url: article.url,
    location: "",
    title: article.title,
    releasedToday: Boolean(article.releasedToday),
  };
}

function renderMoneyFigures(amount: string) {
  const parts = amount.split(/(\d[\d,]*(?:\.\d+)?)/);
  return parts.map((part, index) =>
    /^\d/.test(part) ? (
      <span key={`${part}-${index}`} className="flush-accent-word">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function sourceLogoUrl(sourceUrl?: string): string | null {
  if (!sourceUrl) return null;
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
  } catch {
    return null;
  }
}

const fallbackCostSectionArticles: CostSectionArticle[] = [
  {
    category: "Utility warning",
    title: "City warns 'flushable' wipes are causing sewer damage and taxpayer costs",
    source: "City of Lennox",
    sourceUrl: "https://www.cityoflennoxsd.com",
    blurb: "A local utility warning that directly ties wipe misuse to repairs and ratepayer burden.",
    url: "https://www.cityoflennoxsd.com/article/2816312",
    costAmount: "$25K-$60K",
  },
  {
    category: "Operations alert",
    title: "Public utilities report wipes clogging mains, lift stations, and pumps",
    source: "Great Bend Public Utilities",
    sourceUrl: "https://www.greatbendks.net",
    blurb: "Explains how crews repeatedly deal with avoidable blockages across core wastewater infrastructure.",
    url: "https://www.greatbendks.net/CivicAlerts.aspx?AID=377",
    costAmount: "$50K+",
  },
  {
    category: "Cost signal",
    title: "Flushing wipes adds major maintenance and sewer cleaning costs",
    source: "Lockport coverage",
    sourceUrl: "https://www.yahoo.com",
    blurb: "Documents real budget impacts connected to persistent wipe-related system jams.",
    url: "https://www.yahoo.com/news/articles/flushing-wet-wipes-costs-town-131600152.html",
    costAmount: "$130K+",
  },
  {
    category: "Industry research",
    title: "Executive summary: annual utility burden from flushable wipes",
    source: "NACWA",
    sourceUrl: "https://www.nacwa.org",
    blurb: "High-impact utility data showing recurring national cost pressure from wipe disposal behavior.",
    url: "https://www.nacwa.org/docs/default-source/resources---public/executive-summary_cost_of_wipes.pdf",
    costAmount: "$441M/yr",
  },
  {
    category: "Legislation",
    title: "Senate advances 'Do Not Flush' wipe labeling legislation",
    source: "CASA",
    sourceUrl: "https://casaweb.org",
    blurb: "Tracks policy response to widespread cleanup, maintenance, and education costs.",
    url: "https://casaweb.org/federal-legislative-update-4-13-26/",
    costAmount: "$441M/yr",
  },
];

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  const [timeZone, setTimeZone] = useState("Pacific/Honolulu");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dateLine = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "2-digit",
  }).format(now);
  const timeLine = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(now);

  return (
    <div className="live-clock ml-auto flex w-max max-w-full min-w-0 flex-col items-end gap-1 sm:gap-1.5" aria-label="Live local date and time">
      <Select value={timeZone} onValueChange={setTimeZone}>
        <SelectTrigger
          size="sm"
          className="h-8 w-auto min-w-0 shrink border-[#6f95c4] bg-white px-2 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#87ceeb] shadow-sm hover:border-[#87ceeb] sm:tracking-[0.12em] xl:h-9 xl:px-3"
          aria-label="Select timezone for live clock"
        >
          <SelectValue placeholder="Time zone" />
        </SelectTrigger>
        <SelectContent align="end" className="border-[#c7d8eb] bg-white text-[#102a43]">
          {timeZoneOptions.map((zone) => (
            <SelectItem key={zone.value} value={zone.value} className="font-mono text-xs uppercase tracking-[0.08em]">
              {zone.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <time
        dateTime={now.toISOString()}
        className="flex min-w-0 flex-col items-end text-right font-display text-[0.72rem] font-black uppercase leading-none tracking-[0.03em] text-[#87ceeb] sm:text-sm sm:tracking-[0.05em] xl:flex-row xl:items-baseline xl:text-xl xl:tracking-[0.08em]"
      >
        <span className="whitespace-nowrap">{dateLine}</span>
        <span className="hidden xl:inline" aria-hidden="true">, </span>
        <span className="whitespace-nowrap">{timeLine}</span>
      </time>
    </div>
  );
}

function formatTermEnd(value: string | null): string {
  if (!value) return "Current term";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Current term";
  return `Term ends ${parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`;
}

export default function Home() {
  const [costSlideIndex, setCostSlideIndex] = useState(0);
  const [costPhotoSlideIndex, setCostPhotoSlideIndex] = useState(0);
  const [thinkSlideIndex, setThinkSlideIndex] = useState(0);
  const [officeImages, setOfficeImages] = useState<{ src: string; alt: string }[]>([]);
  const fieldImages = useMemo(() => [...thinkBeforeImages, ...officeImages], [officeImages]);
  const [heroStoryIndex, setHeroStoryIndex] = useState(0);
  const [tickerStories, setTickerStories] = useState(defaultTickerStories);
  const [moneyArchive, setMoneyArchive] = useState<DailyCostSignal[]>(() => readMoneyCardArchive());
  const [moneyCardIndex, setMoneyCardIndex] = useState(0);
  const [zipCodeInput, setZipCodeInput] = useState("");
  const [repLookupError, setRepLookupError] = useState<string | null>(null);
  const [isRepLookupLoading, setIsRepLookupLoading] = useState(false);
  const [repLookupUpdatedAt, setRepLookupUpdatedAt] = useState<string | null>(null);
  const [isAmbiguousZipLookup, setIsAmbiguousZipLookup] = useState(false);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty("--site-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  const { moneyCardBase } = useMemo(() => {
    const ticker = takeUniqueArticles(tickerStories);
    const todaySignals = buildTodayCostSignals(ticker);
    const libraryCards = [
      ...fallbackCostSectionArticles.filter((article) => isUsOnlyStory(article.title, article.blurb, "United States")),
      ...toCostSectionArticles(ticker),
    ].map(costArticleToMoneyCard);
    const moneyCardBase = takeUniqueArticles([
      ...todaySignals,
      ...fallbackCostSignals,
      ...moneyArchive,
      ...libraryCards,
    ]);

    return { moneyCardBase };
  }, [tickerStories, moneyArchive]);

  const visibleMoneyCards = useMemo(() => {
    if (moneyCardBase.length === 0) return [];
    const width = Math.min(3, moneyCardBase.length);
    return Array.from({ length: width }, (_, offset) => moneyCardBase[(moneyCardIndex + offset) % moneyCardBase.length]);
  }, [moneyCardBase, moneyCardIndex]);

  const {
    uniqueTickerStories,
    uniqueCostSectionArticles,
  } = useMemo(() => {
    const seen = { urls: new Set<string>(), titles: new Set<string>() };
    takeUniqueArticles(visibleMoneyCards, seen);
    const ticker = takeUniqueArticles(tickerStories);

    const scrapedCostArticles = toCostSectionArticles(ticker);
    const standingCostArticles = fallbackCostSectionArticles.filter((article) =>
      isUsOnlyStory(article.title, article.blurb, "United States"),
    );
    const combinedCostArticles = takeUniqueArticles(
      mixFlaggedWithStanding(
        scrapedCostArticles.filter((article) => article.releasedToday),
        [...scrapedCostArticles.filter((article) => !article.releasedToday), ...standingCostArticles],
      ),
      seen,
    );

    const heroStories = takeUniqueArticles(mixHeroStories(ticker, hawaiiHeroStories), seen);

    return {
      uniqueTickerStories: heroStories.length > 0 ? heroStories : takeUniqueArticles(mixHeroStories(defaultTickerStories, hawaiiHeroStories), seen),
      uniqueCostSectionArticles: combinedCostArticles,
    };
  }, [tickerStories, visibleMoneyCards]);

  const costArticleCount = uniqueCostSectionArticles.length;
  const activeHeroStory = uniqueTickerStories[heroStoryIndex] ?? HERO_WARNING_FALLBACK;
  const heroSourceLogo = useMemo(
    () => sourceLogoUrl(activeHeroStory.sourceUrl),
    [activeHeroStory.sourceUrl],
  );

  useEffect(() => {
    const fresh = buildTodayCostSignals(tickerStories);
    if (fresh.length === 0) return;
    setMoneyArchive(rememberMoneyCards(fresh));
  }, [tickerStories]);

  const moneyCountRef = useRef(moneyCardBase.length);
  moneyCountRef.current = moneyCardBase.length;
  const leadMoneyCard = moneyCardBase.length > 0 ? moneyCardBase[moneyCardIndex % moneyCardBase.length] : undefined;
  const leadMoneyKey = leadMoneyCard ? `${leadMoneyCard.url}::${leadMoneyCard.title}` : "";
  const leadMoneyIsToday = Boolean(leadMoneyCard?.releasedToday);

  useEffect(() => {
    if (moneyCountRef.current <= 3) return;
    const delay = leadMoneyIsToday ? 17000 : 10000;
    const timer = window.setTimeout(() => {
      setMoneyCardIndex((index) => (index + 1) % Math.max(moneyCountRef.current, 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [leadMoneyKey, leadMoneyIsToday]);

  useEffect(() => {
    setMoneyCardIndex((index) => (moneyCardBase.length === 0 ? 0 : Math.min(index, moneyCardBase.length - 1)));
  }, [moneyCardBase.length]);

  useEffect(() => {
    if (costArticleCount === 0) return;

    const timer = window.setInterval(() => {
      setCostSlideIndex((index) => (index + 1) % costArticleCount);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [costArticleCount]);

  useEffect(() => {
    setCostSlideIndex(0);
  }, [costArticleCount]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCostPhotoSlideIndex((index) => (index + 1) % costSlideshowImages.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/rag-ticker")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { images?: { src: string; alt: string }[] } | null) => {
        if (active && payload?.images) setOfficeImages(payload.images);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (fieldImages.length === 0) return;
    const timer = window.setInterval(() => {
      setThinkSlideIndex((index) => (index + 1) % fieldImages.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [fieldImages.length]);

  const heroCountRef = useRef(uniqueTickerStories.length);
  heroCountRef.current = uniqueTickerStories.length;
  const activeHeroKey = `${activeHeroStory.url}::${activeHeroStory.title}`;
  const heroIsToday = Boolean(activeHeroStory.releasedToday);

  useEffect(() => {
    if (heroCountRef.current <= 1) return;
    const delay = heroIsToday ? 17000 : 10000;
    const timer = window.setTimeout(() => {
      setHeroStoryIndex((index) => (index + 1) % Math.max(heroCountRef.current, 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [activeHeroKey, heroIsToday]);

  useEffect(() => {
    setHeroStoryIndex((index) => (uniqueTickerStories.length === 0 ? 0 : Math.min(index, uniqueTickerStories.length - 1)));
  }, [uniqueTickerStories.length]);

  useEffect(() => {
    (window as Window & {
      __flushReportScrape?: {
        getStatus: typeof getScrapeStatusSnapshot;
        clearCaches: typeof clearScrapeCaches;
        runLiveCheck: typeof runScrapeDiagnostics;
      };
    }).__flushReportScrape = {
      getStatus: getScrapeStatusSnapshot,
      clearCaches: clearScrapeCaches,
      runLiveCheck: runScrapeDiagnostics,
    };

    let active = true;

    loadDailyWastewaterStories().then((stories) => {
      if (!active) return;
      setTickerStories(stories);
      console.info("[Flush Report] scrape status", getScrapeStatusSnapshot());
    });

    return () => {
      active = false;
    };
  }, []);

  const handleRepresentativeLookup = async () => {
    setRepLookupError(null);
    setIsRepLookupLoading(true);

    try {
      const result = await lookupRepresentativesByZip(zipCodeInput);
      setRepresentatives(result.representatives);
      setZipCodeInput(result.zip);
      setRepLookupUpdatedAt(result.fetchedAt);
      setIsAmbiguousZipLookup(result.isAmbiguousZip);
    } catch (error) {
      setRepresentatives([]);
      setRepLookupUpdatedAt(null);
      setIsAmbiguousZipLookup(false);
      setRepLookupError(error instanceof Error ? error.message : "Unable to look up representatives right now.");
    } finally {
      setIsRepLookupLoading(false);
    }
  };

  return (
      <main className="min-h-screen overflow-hidden bg-white text-[#102a43] selection:bg-[#0b6fa4] selection:text-white dark:bg-[#111827] dark:text-[#e5edf7]">
      <header ref={headerRef} className="site-header fixed inset-x-0 top-0 z-50 border-b border-[#c7d8eb]/80 bg-white/92 shadow-[0_8px_30px_rgba(12,49,92,0.1)] backdrop-blur-xl dark:border-[#2b3950] dark:bg-[#0f172a]/92">
          <div className="site-header__bar flex flex-col items-stretch gap-1.5 px-4 py-2.5 sm:gap-2 sm:px-6 lg:px-8 xl:min-h-16 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
          <a href="#top" className="site-header__brand group flex w-full min-w-0 flex-none items-center gap-3 xl:w-auto" aria-label="The Flush Report home">
            <div className="retro-news-logo">
              <span className="retro-news-logo__channel" aria-label="TFR LIVE channel badge">
                <img src="/tfr-logo-transparent-v1.png" alt="" className="retro-news-logo__exact" aria-hidden="true" />
              </span>
              <span className="retro-news-logo__title">
                THE <span className="flush-accent-word">FLUSH</span> REPORT
              </span>
            </div>
          </a>

          <div className="site-header__clock flex w-full min-w-0 flex-none items-center xl:ml-auto xl:w-auto">
            <LiveClock />
          </div>
        </div>
      </header>

      <div className="site-header-spacer" aria-hidden="true" />

      <section aria-label="About The Flush Report" className="site-intro px-4 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-7xl py-4 text-lg font-semibold leading-snug text-[#102a43] sm:py-5 sm:text-xl lg:text-[1.45rem]">
          The <span className="flush-accent-word">Flush</span>{markTaxpayer(" Report is a public news site about what happens after a bad flush. We cover the clogs, spills, and taxpayer bills that start when ")}
          <span className="flush-accent-word">flushable</span>
          {markTaxpayer(" wipes, rags, grease, and trash go down the toilet.")}
        </p>
      </section>

      <section aria-label="Quick access to Flush Report features" className="quick-access-shell relative z-20 border-b border-[#cdeaf5] bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl pb-2 pt-2">
          <div className="quick-cards">
            {featurePills.filter((feature) => !feature.parked).map((feature) => {
              const content = (
                <div className="flex h-full flex-col">
                  <h3
                    className={`${
                      "neonTitle" in feature && feature.neonTitle
                        ? "font-display text-[1.15rem] font-black uppercase leading-none tracking-[-0.03em]"
                        : "font-display text-[1.02rem] font-black uppercase leading-none tracking-[-0.02em] text-[#102a43]"
                    }`}
                  >
                    <span className={"neonTitle" in feature && feature.neonTitle ? "live-flash-text" : undefined}>{markTaxpayer(feature.title)}</span>
                    {"neonTitle" in feature && feature.neonTitle ? (
                      <Zap className="live-bolt live-bolt--card ml-1 hidden align-middle lg:inline-block" aria-hidden="true" />
                    ) : null}
                  </h3>
                  <p className={"neonTitle" in feature && feature.neonTitle ? "mt-1 text-[0.82rem] font-extrabold leading-snug text-[#526d82]" : "mt-1 text-[0.73rem] font-extrabold leading-4 text-[#526d82] sm:text-[0.76rem]"}>{markTaxpayer(feature.copy)}</p>
                  {"showSocialIcons" in feature && feature.showSocialIcons ? (
                    <div className="mt-1.5 flex flex-wrap gap-1" aria-label="FRTV social app emblems">
                      {socialApps.map((app) => (
                        <span key={app.label} className={`social-icon social-icon-${app.key}`} title={app.label} aria-label={app.label}>
                          <app.Icon />
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <span className="feature-cta-action mt-auto pt-1">
                    {feature.action}
                    {feature.href ? <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /> : null}
                  </span>
                </div>
              );

              const pillClass = `feature-pill group${"neonTitle" in feature && feature.neonTitle ? " feature-pill--daily" : ""}`;

              return feature.href ? (
                <a key={feature.title} href={feature.href} className={pillClass} aria-label={`${feature.title}: ${feature.copy}`}>
                  {content}
                </a>
              ) : (
                <div key={feature.title} className={pillClass}>
                  {content}
                </div>
              );
            })}
            <RagPicsCard />
          </div>
        </div>
      </section>

      <section id="top" className="hero-scroll-stage relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(116,200,214,0.24),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ffffff_48%,#f4fbff_100%)]" aria-hidden="true" />
        <div className="coastal-grid absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="relative z-10 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
          <div className="hero-feature mx-auto max-w-7xl">
            <div className="hero-feature__title animate-rise-in">
              <h1 className="font-display text-[clamp(2.85rem,8.2vw,7.8rem)] font-black uppercase leading-[0.8] tracking-[-0.072em] text-[#102a43]">
                <span className="block">Think</span>
                <span className="mt-[0.05em] block tracking-[-0.05em] text-outline">Before</span>
                <span className="mt-[0.05em] block">You</span>
                <span className="flush-accent-word mt-[0.05em] block">Flush.</span>
              </h1>
            </div>
            <aside className="hero-feature__photos relative overflow-hidden" aria-label="Think before you flush field slideshow">
              <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#eef5fc] shadow-[0_16px_36px_rgba(16,42,67,0.14)]">
                {fieldImages.map((image, index) => (
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === thinkSlideIndex ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
              </div>
            </aside>
            <div className="hero-feature__story feature-pill">
                <div className="flex items-start gap-3">
                  {heroSourceLogo ? (
                    <img
                      src={heroSourceLogo}
                      alt={`${activeHeroStory.source} logo`}
                      className="mt-0.5 h-8 w-8 rounded-md border border-[#d6eaf2] bg-white object-contain p-1"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <h3 className="font-display text-2xl font-black uppercase leading-[0.95] tracking-[-0.02em] text-[#102a43]">
                    {markTaxpayer(activeHeroStory.title)}
                  </h3>
                </div>
                <p className="mt-3 font-mono text-[11px] font-black uppercase tracking-[0.11em] text-[#64748b]">
                  Article: {markTaxpayer(activeHeroStory.title)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {activeHeroStory.releasedToday ? <span className="today-mark">TODAY</span> : null}
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.11em] text-[#64748b]">
                    {`By ${activeHeroStory.author || activeHeroStory.source} · ${activeHeroStory.date}`}
                  </p>
                  <a href={activeHeroStory.url} target="_blank" rel="noreferrer" className="article-read-button">
                    READ ARTICLE <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-4 pt-2 sm:px-6 lg:px-8" aria-label="Think Before You Flush message">
        <div className="mx-auto max-w-7xl">
          <p className="max-w-6xl text-xl leading-8 text-[#334e68] sm:text-2xl">
            The Flush Report is a movement focused on educating the general public and, more importantly, the youth about the major problems that flushing anything other than pee, poop, and toilet paper can cause. The rise in the use of flushable wipes continues to be one of the leading causes of wastewater and collection system failures here in Hawaii, the United States, and across the globe. So much so that states have enacted laws to label, ban, and enforce flushable wipes that destroy wastewater systems.
          </p>
          <p className="mt-5 max-w-6xl text-xl leading-8 text-[#334e68] sm:text-2xl">
            The Flush Report encourages all to think before you flush. All wastewater systems discharge into a local waterway. Whether a stream, river, or ocean coastline, we ALL feed these waterways every day with what we flush.
          </p>
        </div>
      </section>

      <section id="mission" className="relative border-y border-[#cdeaf5] bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full">
          <h2 className="mt-3 font-display text-[clamp(2.85rem,8.2vw,7.8rem)] font-black uppercase leading-[0.8] tracking-[-0.072em] text-[#102a43]">
            From <span className="flush-accent-word">Flush</span> to Fish.
          </h2>
          <p className="mt-6 max-w-6xl text-xl leading-8 text-[#334e68] sm:text-2xl">
            The Flush Report exists to give the public clear, source-backed facts about what happens after a bad flush. This is not abstract infrastructure talk: wipes and trash jam pumps, strain treatment systems, increase hauling, and push pressure downstream to the waters where we live, eat, and play.
          </p>
          <p className="mt-5 max-w-6xl text-xl leading-8 text-[#334e68] sm:text-2xl">
            {markTaxpayer("Our local story starts in Keaukaha and extends nationwide. What we flush does not disappear; it becomes worker labor, taxpayer cost, landfill tonnage, and environmental stress. Better flushing habits protect crews, infrastructure, and the ecosystems downstream.")}
          </p>
          <div className="mt-10 space-y-3" aria-label="Flush-to-system process steps">
            {flowSteps.map((step) => {
              const titleMatch = step.title.match(/^THE\s+(.+)$/i);
              return (
                <article key={step.step} className="flow-card flow-card--stacked w-full">
                  <h3 className="font-display text-3xl font-black uppercase leading-none">
                    {titleMatch ? (
                      <>
                        <span className="text-white">THE </span>
                        <span className="flush-accent-word">{titleMatch[1]}</span>
                      </>
                    ) : (
                      <span className="text-white">{step.title}</span>
                    )}
                  </h3>
                  <p className="mt-3 text-xl leading-8 text-[#334e68] sm:text-2xl">{markTaxpayer(step.copy)}</p>
                </article>
              );
            })}
          </div>

        </div>
      </section>

      <section className="bg-white px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 border-b border-[#d6eaf2] pb-4">
            <p className="live-flash-badge">
              <span className="live-flash-text">FLUSH REPORT LIVE</span>
              <Zap className="live-bolt" aria-hidden="true" />
            </p>
            <h2 className="mt-2 font-mono text-[1.4rem] font-black uppercase tracking-[0.12em] text-[#102a43]">
              Daily Nationwide Coverage Updates
            </h2>
          </div>
          <div className="grid grid-cols-3 items-start gap-2 sm:gap-4">
            {visibleMoneyCards.map((signal) => (
              <article key={`${signal.lane}-${signal.url}-${signal.title}`} className="stat-card stat-card--money group">
                <p className="money-lane font-mono font-bold uppercase text-[#64748b]">
                  {signal.releasedToday ? <span className="today-mark mr-1">TODAY</span> : null}
                  {signal.lane}
                </p>
                {signal.amount ? (
                  <h3 className="money-figure mt-1 font-display font-black uppercase text-white">{renderMoneyFigures(signal.amount)}</h3>
                ) : (
                  <h3 className="money-snippet font-display font-black uppercase text-white">{markTaxpayer(signal.title)}</h3>
                )}
                {signal.snippet &&
                !signal.title.toLowerCase().includes(signal.snippet.toLowerCase()) &&
                !signal.snippet.toLowerCase().includes(signal.title.toLowerCase()) ? (
                  <p className="money-snippet text-[#526d82]">{markTaxpayer(signal.snippet)}</p>
                ) : null}
                <div className="money-card-foot border-t border-[#d6eaf2]">
                  {signal.location && !signal.title.toLowerCase().includes(signal.location.toLowerCase()) ? (
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#64748b]">{signal.location}</p>
                  ) : null}
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="article-read-button mt-2"
                  >
                    READ ARTICLE <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cost" className="relative overflow-hidden bg-white px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h2 className="headline-section mt-3">
                That <span className="flush-accent-word">repair</span> money could be doing something{" "}
                <span className="flush-accent-word">better.</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#334e68]">
                Every preventable clog pulls public money into emergency response, equipment repair, hauling, overtime, and replacement parts. That is money that could support better infrastructure, safer facilities, parks, roads, schools, shoreline protection, or community programs.
              </p>
            </div>
            <div className="flex h-full flex-col justify-end gap-3 lg:items-end">
              <div className="relative aspect-[16/8] w-full max-w-[40rem] overflow-hidden rounded-[0.95rem] border border-[#d6eaf2] bg-[#0f2a46]">
                {costSlideshowImages.map((image, index) => (
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-1000 ${index === costPhotoSlideIndex ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
              </div>
              <div className="relative min-h-[12.25rem] w-full max-w-[40rem] overflow-hidden rounded-[0.95rem] border border-[#d6eaf2] bg-transparent">
                {uniqueCostSectionArticles.map((article, index) => (
                  <a
                    key={`${article.url}-${article.title}`}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`absolute inset-0 flex h-full w-full flex-col justify-between bg-[#1b3b5d] p-4 text-white transition-opacity duration-1000 ${index === costSlideIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    aria-label={`${article.title}. Opens source from ${article.source} in a new tab.`}
                  >
                    <div>
                      <div className="relative">
                        <span className="absolute right-0 top-0 font-display text-3xl font-black uppercase leading-none tracking-[-0.02em] text-[#87ceeb]">
                          {article.costAmount}
                        </span>
                        <div className="flex items-start gap-2 pr-28">
                          {sourceLogoUrl(article.sourceUrl) ? (
                            <img
                              src={sourceLogoUrl(article.sourceUrl) || ""}
                              alt={`${article.source} logo`}
                              className="mt-1 h-8 w-8 shrink-0 rounded border border-white/35 bg-white object-contain p-1"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                          <div>
                            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#bfe4f5]">
                              {article.releasedToday ? <span className="today-mark mr-2">TODAY</span> : null}
                              {article.category}
                            </p>
                            <h3 className="mt-2 max-w-xl font-display text-2xl font-black uppercase leading-[0.92] tracking-[-0.02em] text-white">
                              {markTaxpayer(article.title)}
                            </h3>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/90">{markTaxpayer(article.blurb)}</p>
                    </div>
                    <div className="inline-flex items-center justify-between border-t border-white/30 pt-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#dbeef7]">
                      <span>Source: {article.source}</span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-white/40 bg-[#0f2a46] px-2 py-1 text-white">
                        READ ARTICLE <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8" aria-label="Sponsor placement after education block">
        <div className="ad-placement mx-auto max-w-7xl">
          <div>
            <p className="ad-placement-label">{adPlacements.awareness.label}</p>
            <h2>{adPlacements.awareness.title}</h2>
            <p>{adPlacements.awareness.copy}</p>
          </div>
          <div className="ad-placement-slot">
            <span>{adPlacements.awareness.slot}</span>
            <a href="/contact">Sponsorships open soon</a>
          </div>
        </div>
      </section>

      <section className="border-y border-[#cdeaf5] bg-[#f8fbff] px-4 py-6 sm:px-6 lg:px-8" aria-label="Daily visual reminder">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden">
            <div className="ick-ticker-track" style={{ animationDuration: `${Math.round((348 / 55) * fieldImages.length)}s` }}>
              {[...fieldImages, ...fieldImages].map((image, index) => (
                <figure key={`bottom-${image.src}-${index}`} className="ick-ticker-item relative">
                  <img src={image.src} alt={image.alt} className="h-48 w-52 object-cover sm:h-56 sm:w-60" />
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8" aria-label="Sponsor placement between evidence and action">
        <div className="ad-placement mx-auto max-w-7xl">
          <div>
            <p className="ad-placement-label">{adPlacements.field.label}</p>
            <h2>{adPlacements.field.title}</h2>
            <p>{adPlacements.field.copy}</p>
          </div>
          <div className="ad-placement-slot">
            <span>{adPlacements.field.slot}</span>
            <a href="/contact">Sponsorships open soon</a>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8" aria-label="Take action and contact your representative">
        <div className="news-card mx-auto max-w-7xl p-7 sm:p-10">
          <p className="eyebrow">Take action</p>
          <h2 className="headline-section mt-3">Contact your representative</h2>
          <p className="mt-5 max-w-4xl text-base leading-7 text-[#526d82]">
            Find your local and state representatives and tell them to support flushable wipes labeling laws. It takes five minutes.
          </p>
          <form
            className="mt-6 flex flex-col gap-3 sm:max-w-xl sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRepresentativeLookup();
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="Enter your ZIP code"
              className="field-input mt-0 sm:flex-1"
              aria-label="Enter your ZIP code"
              value={zipCodeInput}
              onChange={(event) => setZipCodeInput(event.target.value)}
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[#6f95c4] bg-[#0f2a46] px-5 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#184166]"
              disabled={isRepLookupLoading}
            >
              {isRepLookupLoading ? "Loading..." : "Find my rep"}
            </button>
          </form>
          {repLookupError ? (
            <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#f87171]">{repLookupError}</p>
          ) : null}
          {repLookupUpdatedAt ? (
            <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
              Live lookup refreshed {new Date(repLookupUpdatedAt).toLocaleString("en-US")}
            </p>
          ) : null}
          {isAmbiguousZipLookup ? (
            <p className="mt-2 text-sm leading-6 text-[#526d82]">
              Your ZIP code spans multiple districts. Verify your street address for exact House representation.
            </p>
          ) : null}
          {representatives.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {representatives.map((rep) => (
                <article key={rep.id} className="rounded-xl border border-[#d6eaf2] bg-[#0f2a46] p-4 text-white">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#bfe4f5]">
                    {rep.chamber === "senate" ? "U.S. Senate" : `U.S. House · District ${rep.district ?? "Unknown"}`}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-black uppercase leading-[0.95] tracking-[-0.02em]">
                    {rep.firstName} {rep.lastName}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/90">
                    {rep.party} · {rep.state} · {formatTermEnd(rep.termEnd)}
                  </p>
                  {rep.phone ? <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]">Phone: {rep.phone}</p> : null}
                  {rep.office ? <p className="mt-2 text-sm leading-6 text-white/80">{rep.office}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rep.website ? (
                      <a
                        href={rep.website}
                        target="_blank"
                        rel="noreferrer"
                        className="article-read-button"
                      >
                        Website <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {rep.contactForm ? (
                      <a
                        href={rep.contactForm}
                        target="_blank"
                        rel="noreferrer"
                        className="article-read-button"
                      >
                        Contact <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#526d82]">
            <a
              href="https://www.house.gov/representatives/find-your-representative"
              target="_blank"
              rel="noreferrer"
              className="article-read-button"
            >
              Official House lookup <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://www.senate.gov/senators/senators-contact.htm"
              target="_blank"
              rel="noreferrer"
              className="article-read-button"
            >
              Official Senate directory <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8" aria-label="Sponsor placement after take action">
        <div className="ad-placement mx-auto max-w-7xl">
          <div>
            <p className="ad-placement-label">{adPlacements.community.label}</p>
            <h2>{adPlacements.community.title}</h2>
            <p>{adPlacements.community.copy}</p>
          </div>
          <div className="ad-placement-slot">
            <span>{adPlacements.community.slot}</span>
            <a href="/contact">Sponsorships open soon</a>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8" aria-label="Closing sponsor placement before footer">
        <div className="ad-placement mx-auto max-w-7xl">
          <div>
            <p className="ad-placement-label">{adPlacements.closing.label}</p>
            <h2>{adPlacements.closing.title}</h2>
            <p>{adPlacements.closing.copy}</p>
          </div>
          <div className="ad-placement-slot">
            <span>{adPlacements.closing.slot}</span>
            <a href="/contact">Sponsorships open soon</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#cdeaf5] bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center">
          <p className="font-display text-2xl font-black uppercase tracking-[0.08em] text-[#102a43]">
            The <span className="flush-accent-word">Flush</span> Report
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#64748b]">
            <a href="/privacy" className="hover:text-[#0b6fa4]">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms" className="hover:text-[#0b6fa4]">Terms &amp; Conditions</a>
            <span aria-hidden="true">·</span>
            <a href="/contact" className="hover:text-[#0b6fa4]">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="/admin" className="hover:text-[#0b6fa4]">Office</a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3" aria-label="Social profiles open soon">
            {socialApps.map((app) => (
              <span key={`footer-${app.label}`} className={`social-icon social-icon-${app.key}`} title={`${app.label} coming soon`} aria-label={`${app.label} coming soon`}>
                <app.Icon />
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
