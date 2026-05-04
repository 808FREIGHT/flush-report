export type Representative = {
  id: string;
  chamber: "senate" | "house";
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  district: number | null;
  phone: string | null;
  website: string | null;
  contactForm: string | null;
  office: string | null;
  termStart: string | null;
  termEnd: string | null;
  photoUrl: string | null;
};

type RepsApiResponse = {
  zip?: string;
  representatives?: Array<{
    bioguide_id?: string;
    type?: string;
    first_name?: string;
    last_name?: string;
    party?: string;
    state?: string;
    district?: number | null;
    phone?: string | null;
    url?: string | null;
    contact_form?: string | null;
    office?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    photo_url?: string | null;
  }>;
  ambiguous?: boolean;
};

type RepresentativeLookupResult = {
  zip: string;
  representatives: Representative[];
  isAmbiguousZip: boolean;
  fetchedAt: string;
};

const CACHE_KEY = "flush-report-representatives-v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

function normalizeZip(value: string): string | null {
  const cleaned = value.trim();
  const zip5Match = cleaned.match(/^(\d{5})(?:-\d{4})?$/);
  if (!zip5Match) return null;
  return zip5Match[1];
}

function chamberFromApiType(value: string | undefined): "senate" | "house" {
  return value === "sen" ? "senate" : "house";
}

function readCache(): Record<string, RepresentativeLookupResult> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RepresentativeLookupResult>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, RepresentativeLookupResult>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write failures.
  }
}

function toRepresentative(item: NonNullable<RepsApiResponse["representatives"]>[number]): Representative {
  return {
    id: item.bioguide_id?.trim() || `${item.first_name ?? "rep"}-${item.last_name ?? "unknown"}`,
    chamber: chamberFromApiType(item.type),
    firstName: item.first_name?.trim() || "",
    lastName: item.last_name?.trim() || "",
    party: item.party?.trim() || "Unknown",
    state: item.state?.trim() || "",
    district: typeof item.district === "number" ? item.district : null,
    phone: item.phone?.trim() || null,
    website: item.url?.trim() || null,
    contactForm: item.contact_form?.trim() || null,
    office: item.office?.trim() || null,
    termStart: item.start_date?.trim() || null,
    termEnd: item.end_date?.trim() || null,
    photoUrl: item.photo_url?.trim() || null,
  };
}

function rankRepresentative(rep: Representative): number {
  return rep.chamber === "senate" ? 0 : 1;
}

function isFresh(fetchedAt: string): boolean {
  const timestamp = Date.parse(fetchedAt);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp < CACHE_TTL_MS;
}

export async function lookupRepresentativesByZip(rawZip: string): Promise<RepresentativeLookupResult> {
  const zip = normalizeZip(rawZip);
  if (!zip) {
    throw new Error("Enter a valid U.S. ZIP code (5 digits).");
  }

  const cache = readCache();
  const cached = cache[zip];
  if (cached && cached.representatives.length > 0 && isFresh(cached.fetchedAt)) {
    return cached;
  }

  const response = await fetch(`https://repscontact.com/api/reps?zip=${zip}`);
  if (!response.ok) {
    throw new Error("Representative lookup is temporarily unavailable. Please try again.");
  }

  const payload = (await response.json()) as RepsApiResponse;
  const representatives = (payload.representatives ?? []).map(toRepresentative).filter((rep) => rep.lastName.length > 0);

  if (representatives.length === 0) {
    throw new Error("No representatives were returned for that ZIP code.");
  }

  const result: RepresentativeLookupResult = {
    zip,
    representatives: representatives.sort((a, b) => rankRepresentative(a) - rankRepresentative(b)),
    isAmbiguousZip: Boolean(payload.ambiguous),
    fetchedAt: new Date().toISOString(),
  };

  cache[zip] = result;
  writeCache(cache);
  return result;
}
