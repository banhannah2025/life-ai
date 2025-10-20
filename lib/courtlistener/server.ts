import type { CourtListenerOpinion } from "./types";

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

export async function searchCourtListenerOpinions(query: string, limit = 5): Promise<CourtListenerOpinion[]> {
  const auth = getAuthHeader();
  if (!auth) {
    return [];
  }

  const url = new URL(`${COURT_LISTENER_BASE_URL}/search/`);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", Math.max(1, Math.min(limit * 3, 50)).toString());
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
      status?: string | null;
      snippet?: string | null;
    }>;
  };

  const results = Array.isArray(data.results) ? data.results : [];
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
    });

    if (opinions.length >= limit) {
      break;
    }
  }

  return opinions;
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
