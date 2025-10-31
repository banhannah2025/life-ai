import { findStateCodeInText, STATE_OPTIONS } from "@/lib/location/states";
import { extractSearchTokens } from "@/lib/search/keywords";

import type { CourtJurisdictionCategory, CourtListenerOpinion, CourtListenerRecapDocket } from "./types";

const COURT_LISTENER_BASE_URL = "https://www.courtlistener.com/api/rest/v3";

type CourtListenerOpinionRaw = {
  id?: number;
  absolute_url?: string;
  resource_uri?: string;
  case_name?: string;
  case_name_short?: string;
  docket_number?: string;
  date_filed?: string;
  precedential_status?: string;
  citations?: Array<{ cite?: string | null }>;
};

type CourtListenerDocketRaw = {
  id?: number;
  absolute_url?: string | null;
  case_name?: string | null;
  case_name_short?: string | null;
  docket_number?: string | null;
  date_filed?: string | null;
  docket_entries_url?: string | null;
  court?: string | null;
  court_id?: string | null;
  appeal_from?: string | null;
  assigned_to?: string | null;
  cause?: string | null;
  nature_of_suit?: string | null;
  source?: string | null;
  snippet?: string | null;
};

type CourtMetadata = {
  id: string;
  jurisdiction: string | null;
  fullName: string | null;
  shortName: string | null;
};

type CourtListenerSearchOptions = {
  includeFederal?: boolean;
  includeState?: boolean;
  includeAgency?: boolean;
  stateFilter?: string | null;
  requireAllTokens?: boolean;
};

const courtMetadataCache = new Map<string, CourtMetadata | null>();

function toTitleCase(value: string): string {
  const lowercaseWords = new Set(["and", "or", "of", "the", "in", "for", "on", "at", "vs", "vs."]);
  const segments = value.split(" ");
  return segments
    .map((segment, index) => {
      const lower = segment.toLowerCase();
      if (!segment) {
        return segment;
      }
      if (lower === "v" || lower === "v.") {
        return "v.";
      }
      if (lowercaseWords.has(lower) && index !== 0) {
        return lower === "vs" || lower === "vs." ? "v." : lower;
      }
      if (segment.length === 1) {
        return segment.toUpperCase();
      }
      return segment[0].toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\s+v\.\s+/gi, " v. ");
}

function deriveCaseName(raw: CourtListenerOpinionRaw): { full: string; short: string | null } {
  const providedFull = raw.case_name?.trim();
  const providedShort = raw.case_name_short?.trim();

  if (providedFull) {
    return { full: providedFull, short: providedShort ?? providedFull };
  }

  if (providedShort) {
    return { full: providedShort, short: providedShort };
  }

  const slugSource = raw.absolute_url ?? raw.resource_uri ?? "";
  const slug = slugSource
    .split("/")
    .filter(Boolean)
    .pop();

  if (slug) {
    const words = decodeURIComponent(slug)
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const lower = segment.toLowerCase();
        if (lower === "v" || lower === "vs" || lower === "vs.") {
          return "v.";
        }
        if (lower === "v.") {
          return "v.";
        }
        return segment;
      });

    if (words.length >= 3 && words.includes("v.")) {
      const formatted = toTitleCase(words.join(" "));
      return { full: formatted, short: formatted };
    }

    if (words.length > 0) {
      const formatted = toTitleCase(words.join(" "));
      return { full: formatted, short: formatted };
    }
  }

  const docket = raw.docket_number?.trim();
  if (docket) {
    return { full: `Docket ${docket}`, short: `Docket ${docket}` };
  }

  return { full: "Untitled Matter", short: null };
}

function getAuthHeader(): { header: string; scheme: "token" | "basic" } | null {
  const apiToken = process.env.COURT_LISTENER_API_KEY ?? "";
  if (apiToken) {
    return { header: `Token ${apiToken}`, scheme: "token" };
  }

  const username = process.env.COURT_LISTENER_USERNAME ?? "";
  const password = process.env.COURT_LISTENER_PASSWORD ?? "";
  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    return { header: `Basic ${encoded}`, scheme: "basic" };
  }

  return null;
}

async function fetchCourtMetadata(courtId: string, authHeader: string): Promise<CourtMetadata | null> {
  const url = `${COURT_LISTENER_BASE_URL}/courts/${courtId}/`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "force-cache",
    });
    if (!response.ok) {
      console.error(`CourtListener court metadata failed for ${courtId}: ${response.status}`);
      return null;
    }
    const payload = (await response.json()) as {
      id?: string;
      jurisdiction?: string | null;
      full_name?: string | null;
      short_name?: string | null;
    };
    return {
      id: payload.id ?? courtId,
      jurisdiction: payload.jurisdiction ?? null,
      fullName: payload.full_name ?? null,
      shortName: payload.short_name ?? null,
    };
  } catch (error) {
    console.error(`CourtListener court metadata request failed for ${courtId}`, error);
    return null;
  }
}

async function hydrateCourtMetadata(courtIds: string[], authHeader: string) {
  const missing = courtIds.filter((courtId) => !courtMetadataCache.has(courtId));
  if (!missing.length) {
    return;
  }
  await Promise.all(
    missing.map(async (courtId) => {
      const metadata = await fetchCourtMetadata(courtId, authHeader);
      courtMetadataCache.set(courtId, metadata);
    })
  );
}

function mapJurisdiction(code: string | null): CourtJurisdictionCategory {
  if (!code) {
    return "mixed";
  }
  const normalized = code.toUpperCase();
  if (normalized.startsWith("F")) {
    return "federal";
  }
  if (normalized.startsWith("S") || normalized.startsWith("T") || normalized.startsWith("M")) {
    return "state";
  }
  if (normalized.startsWith("A") || normalized.startsWith("B")) {
    return "agency";
  }
  return "mixed";
}

function deriveStateCode(
  metadata: CourtMetadata | null,
  courtName: string | null,
  citation: string | null
): string | null {
  const candidates = [metadata?.fullName, metadata?.shortName, courtName, citation];
  for (const candidate of candidates) {
    const detected = findStateCodeInText(candidate ?? null);
    if (detected) {
      return detected;
    }
  }
  return null;
}

function inferStateFromSlug(courtId: string | null): string | null {
  if (!courtId) {
    return null;
  }
  const lowered = courtId.toLowerCase();
  for (const state of STATE_OPTIONS) {
    const prefix = state.code.toLowerCase();
    if (lowered.startsWith(prefix)) {
      return state.code;
    }
  }
  return null;
}

function extractCourtIdFromResource(resource: string | null): string | null {
  if (!resource) {
    return null;
  }
  const trimmed = resource.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.startsWith("http") ? trimmed : `https://www.courtlistener.com${trimmed}`;
  try {
    const url = new URL(normalized);
    const segments = url.pathname.split("/").filter(Boolean);
    const courtsIndex = segments.lastIndexOf("courts");
    if (courtsIndex !== -1 && segments[courtsIndex + 1]) {
      return segments[courtsIndex + 1];
    }
    return segments.pop() ?? null;
  } catch {
    const parts = trimmed.split("/").filter(Boolean);
    const courtsIndex = parts.lastIndexOf("courts");
    if (courtsIndex !== -1 && parts[courtsIndex + 1]) {
      return parts[courtsIndex + 1];
    }
    return parts.pop() ?? null;
  }
}

function normalizeTokenSet(query: string): string[] {
  const tokens = extractSearchTokens(query)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
  return Array.from(new Set(tokens));
}

function matchesTokenThreshold(text: string, tokens: string[], minimumMatches: number): boolean {
  if (!tokens.length || minimumMatches <= 0) {
    return true;
  }

  const haystack = text.toLowerCase();
  let matches = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      matches += 1;
      if (matches >= minimumMatches) {
        return true;
      }
    }
  }

  return matches >= minimumMatches;
}

export async function searchCourtListenerOpinions(
  query: string,
  limit = 5,
  options: CourtListenerSearchOptions = {}
): Promise<CourtListenerOpinion[]> {
  const auth = getAuthHeader();
  if (!auth) {
    return [];
  }

  const tokenSet = normalizeTokenSet(query);
  const requireAllTokens = options.requireAllTokens ?? tokenSet.length <= 3;
  const minimumTokenMatches = requireAllTokens
    ? tokenSet.length
    : Math.max(1, Math.ceil(tokenSet.length * 0.6));
  const allowFederal = options.includeFederal !== false;
  const allowState = options.includeState !== false;
  const allowAgency = options.includeAgency !== false;
  const restrictJurisdictions = !allowFederal || !allowState || !allowAgency;
  const stateFilter = options.stateFilter ? options.stateFilter.toUpperCase() : null;

  const url = new URL(`${COURT_LISTENER_BASE_URL}/search/`);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", Math.max(1, Math.min(limit * 4, 80)).toString());
  url.searchParams.set(
    "fields",
    [
      "id",
      "absolute_url",
      "caseName",
      "caseNameShort",
      "dateFiled",
      "docketNumber",
      "citation",
      "court",
      "court_citation_string",
      "court_id",
      "court_exact",
      "status",
    ].join(",")
  );
  url.searchParams.set("highlight", "true");
  url.searchParams.set("highlight_pre_tag", "<mark>");
  url.searchParams.set("highlight_post_tag", "</mark>");
  url.searchParams.set("highlight_fragsize", "220");
  url.searchParams.set("highlight_number", "1");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: auth.header,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("CourtListener search request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(
      `CourtListener search failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`
    );
    return [];
  }

  const data = (await response.json()) as {
    results?: Array<{
      id?: number;
      absolute_url?: string;
      caseName?: string | null;
      caseNameShort?: string | null;
      dateFiled?: string | null;
      docketNumber?: string | null;
      citation?: string | null;
      court?: string | null;
      court_citation_string?: string | null;
      court_id?: string | null;
      court_exact?: string | null;
      status?: string | null;
      snippet?: string | null;
    }>;
  };

  const results = Array.isArray(data.results) ? data.results : [];
  const courtIds = Array.from(
    new Set(
      results
        .map((result) => result?.court_id ?? result?.court_exact ?? null)
        .filter((value): value is string => Boolean(value))
    )
  );
  if (courtIds.length) {
    await hydrateCourtMetadata(courtIds, auth.header);
  }

  const opinions: CourtListenerOpinion[] = [];

  for (const result of results) {
    if (!result?.absolute_url || !result.absolute_url.startsWith("/opinion/")) {
      continue;
    }

    const rawForName: CourtListenerOpinionRaw = {
      case_name: result.caseName ?? undefined,
      case_name_short: result.caseNameShort ?? undefined,
      absolute_url: result.absolute_url,
      resource_uri: result.absolute_url,
      docket_number: result.docketNumber ?? undefined,
    };

    const { full: caseName, short: caseNameShort } = deriveCaseName(rawForName);
    const absoluteUrl = `https://www.courtlistener.com${result.absolute_url}`;
    const snippet = sanitizeSnippet(result.snippet ?? null);
    const year = extractYear(result.dateFiled ?? null);
    const courtId = result.court_id ?? result.court_exact ?? null;
    const metadata = courtId ? courtMetadataCache.get(courtId) ?? null : null;
    const jurisdictionCategory = metadata ? mapJurisdiction(metadata.jurisdiction ?? null) : "mixed";
    const stateCode =
      jurisdictionCategory === "state"
        ? deriveStateCode(metadata ?? null, result.court ?? null, result.court_citation_string ?? null) ??
          inferStateFromSlug(courtId)
        : null;

    if (jurisdictionCategory === "federal" && !allowFederal) {
      continue;
    }
    if (jurisdictionCategory === "state" && !allowState) {
      continue;
    }
    if (jurisdictionCategory === "agency" && !allowAgency) {
      continue;
    }
    if (restrictJurisdictions && jurisdictionCategory === "mixed") {
      continue;
    }
    if (stateFilter && jurisdictionCategory === "state") {
      if (!stateCode || stateCode.toUpperCase() !== stateFilter) {
        continue;
      }
    }

    const searchableText = [
      caseName,
      caseNameShort ?? "",
      snippet.plain ?? "",
      result.citation ?? "",
      result.docketNumber ?? "",
    ].join(" ");

    if (tokenSet.length && !matchesTokenThreshold(searchableText, tokenSet, minimumTokenMatches)) {
      continue;
    }

    opinions.push({
      id: result.id ? result.id.toString() : absoluteUrl,
      caseName,
      caseNameShort,
      docketNumber: result.docketNumber ?? null,
      citation: result.citation ?? null,
      dateFiled: result.dateFiled ?? null,
      precedentialStatus: result.status ?? null,
      absoluteUrl,
      snippet: snippet.plain,
      snippetHighlighted: snippet.html,
      year,
      court: result.court ?? null,
      courtCitation: result.court_citation_string ?? null,
      courtId: courtId ?? null,
      jurisdictionCategory,
      stateCode: stateCode ?? null,
    });

    if (opinions.length >= limit) {
      break;
    }
  }

  return opinions;
}

export async function searchCourtListenerRecapDockets(
  query: string,
  limit = 5,
  options: CourtListenerSearchOptions = {}
): Promise<CourtListenerRecapDocket[]> {
  const auth = getAuthHeader();
  if (!auth) {
    return [];
  }

  const tokenSet = normalizeTokenSet(query);
  const requireAllTokens = options.requireAllTokens ?? tokenSet.length <= 3;
  const minimumTokenMatches = requireAllTokens
    ? tokenSet.length
    : Math.max(1, Math.ceil(tokenSet.length * 0.6));
  const allowFederal = options.includeFederal !== false;
  const allowState = options.includeState !== false;
  const allowAgency = options.includeAgency !== false;
  const restrictJurisdictions = !allowFederal || !allowState || !allowAgency;
  const stateFilter = options.stateFilter ? options.stateFilter.toUpperCase() : null;

  const url = new URL(`${COURT_LISTENER_BASE_URL}/dockets/`);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", Math.max(1, Math.min(limit * 4, 80)).toString());
  url.searchParams.set("order_by", "-date_filed");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: auth.header,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("CourtListener RECAP docket request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(
      `CourtListener RECAP docket request failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`
    );
    return [];
  }

  const data = (await response.json()) as { results?: CourtListenerDocketRaw[] };
  const results = Array.isArray(data.results) ? data.results : [];
  const courtIds = Array.from(
    new Set(
      results
        .map((result) => extractCourtIdFromResource(result?.court ?? null) ?? result?.court_id ?? null)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (courtIds.length) {
    await hydrateCourtMetadata(courtIds, auth.header);
  }

  const dockets: CourtListenerRecapDocket[] = [];

  for (const result of results) {
    const rawForName: CourtListenerOpinionRaw = {
      case_name: result.case_name ?? undefined,
      case_name_short: result.case_name_short ?? undefined,
      absolute_url: result.absolute_url ?? undefined,
      docket_number: result.docket_number ?? undefined,
    };

    const { full: caseName, short: caseNameShort } = deriveCaseName(rawForName);
    const absoluteUrl = result.absolute_url
      ? result.absolute_url.startsWith("http")
        ? result.absolute_url
        : `https://www.courtlistener.com${result.absolute_url}`
      : null;
    const docketEntriesUrl = result.docket_entries_url
      ? result.docket_entries_url.startsWith("http")
        ? result.docket_entries_url
        : `https://www.courtlistener.com${result.docket_entries_url}`
      : null;
    const courtId = extractCourtIdFromResource(result.court ?? null) ?? result.court_id ?? null;
    const metadata = courtId ? courtMetadataCache.get(courtId) ?? null : null;
    const jurisdictionCategory = metadata ? mapJurisdiction(metadata.jurisdiction ?? null) : "mixed";
    const stateCode =
      jurisdictionCategory === "state"
        ? deriveStateCode(metadata ?? null, metadata?.fullName ?? result.case_name ?? null, metadata?.shortName ?? null) ??
          inferStateFromSlug(courtId)
        : null;

    if (jurisdictionCategory === "federal" && !allowFederal) {
      continue;
    }
    if (jurisdictionCategory === "state" && !allowState) {
      continue;
    }
    if (jurisdictionCategory === "agency" && !allowAgency) {
      continue;
    }
    if (restrictJurisdictions && jurisdictionCategory === "mixed") {
      continue;
    }
    if (stateFilter && jurisdictionCategory === "state") {
      if (!stateCode || stateCode.toUpperCase() !== stateFilter) {
        continue;
      }
    }

    const searchableText = [
      caseName,
      caseNameShort ?? "",
      result.docket_number ?? "",
      result.nature_of_suit ?? "",
      result.cause ?? "",
      result.appeal_from ?? "",
      result.assigned_to ?? "",
      metadata?.fullName ?? "",
      metadata?.shortName ?? "",
    ].join(" ");

    if (tokenSet.length && !matchesTokenThreshold(searchableText, tokenSet, minimumTokenMatches)) {
      continue;
    }

    const snippetCandidate = result.snippet ?? result.nature_of_suit ?? result.cause ?? null;
    const snippet = snippetCandidate ? sanitizeSnippet(snippetCandidate, 200) : { plain: null, html: null };

    dockets.push({
      id: result.id ? result.id.toString() : absoluteUrl ?? caseName,
      caseName,
      caseNameShort,
      docketNumber: result.docket_number ?? null,
      absoluteUrl,
      docketEntriesUrl,
      dateFiled: result.date_filed ?? null,
      courtId: courtId ?? null,
      courtName: metadata?.fullName ?? metadata?.shortName ?? null,
      jurisdictionCategory,
      stateCode: stateCode ?? null,
      assignedTo: result.assigned_to ?? null,
      natureOfSuit: result.nature_of_suit ?? null,
      cause: result.cause ?? null,
      appealFrom: result.appeal_from ?? null,
      recapSource: result.source ?? null,
      snippet: snippet.plain,
    });

    if (dockets.length >= limit) {
      break;
    }
  }

  return dockets;
}

function extractYear(dateString: string | null): string | null {
  if (!dateString) {
    return null;
  }
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.getFullYear().toString();
}

function sanitizeSnippet(snippet: string | null, maxLength = 220): { plain: string | null; html: string | null } {
  if (!snippet) {
    return { plain: null, html: null };
  }
  const normalized = snippet.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return { plain: null, html: null };
  }
  const html = truncateHighlightedHtml(normalized, maxLength);
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { plain: plain || null, html };
}

function truncateHighlightedHtml(input: string, maxLength: number): string {
  let textCount = 0;
  let index = 0;
  let output = "";

  while (index < input.length && textCount < maxLength) {
    const char = input[index];
    if (char === "<") {
      const closeIndex = input.indexOf(">", index);
      if (closeIndex === -1) {
        break;
      }
      output += input.slice(index, closeIndex + 1);
      index = closeIndex + 1;
      continue;
    }

    output += char;
    textCount += 1;
    index += 1;
  }

  if (index < input.length) {
    output = output.trimEnd();
    if (!output.endsWith("…")) {
      output += "…";
    }
  }

  const openMarks = (output.match(/<mark>/gi) ?? []).length;
  const closeMarks = (output.match(/<\/mark>/gi) ?? []).length;
  if (openMarks > closeMarks) {
    output += "</mark>".repeat(openMarks - closeMarks);
  }

  return output;
}
