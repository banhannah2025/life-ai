import type { AssistantWebResult } from "@/lib/ai/schemas";

const GOOGLE_SEARCH_ENDPOINT = "https://www.googleapis.com/customsearch/v1";

export class GoogleSearchConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleSearchConfigurationError";
  }
}

type GoogleSearchItem = {
  title?: string;
  snippet?: string;
  link?: string;
  displayLink?: string;
  htmlSnippet?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
  };
};

type GoogleSearchResponse = {
  items?: GoogleSearchItem[];
};

const MAX_RESULTS = 10;

function normalizeSnippet(item: GoogleSearchItem): string {
  if (typeof item.snippet === "string" && item.snippet.trim()) {
    return item.snippet.replace(/\s+/g, " ").trim();
  }
  if (typeof item.htmlSnippet === "string" && item.htmlSnippet.trim()) {
    return item.htmlSnippet.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }
  const metaDescription = item.pagemap?.metatags?.[0]?.description ?? item.pagemap?.metatags?.[0]?.["og:description"];
  if (typeof metaDescription === "string" && metaDescription.trim()) {
    return metaDescription.replace(/\s+/g, " ").trim();
  }
  return "";
}

export async function searchGoogle(query: string, limit = 5): Promise<AssistantWebResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey) {
    throw new GoogleSearchConfigurationError("Missing GOOGLE_SEARCH_API_KEY environment variable.");
  }
  if (!engineId) {
    throw new GoogleSearchConfigurationError("Missing GOOGLE_SEARCH_ENGINE_ID environment variable.");
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: trimmed,
    num: String(Math.min(Math.max(limit, 1), MAX_RESULTS)),
    safe: "off",
    fields: "items(title,snippet,link,displayLink,htmlSnippet,pagemap/metatags)",
  });

  const response = await fetch(`${GOOGLE_SEARCH_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => response.statusText);
    throw new Error(`Google Search API failed (${response.status}): ${errorPayload}`);
  }

  const payload = (await response.json()) as GoogleSearchResponse;
  const results = Array.isArray(payload.items) ? payload.items : [];

  return results.slice(0, limit).map((item) => ({
    title: item.title?.trim() || item.displayLink || trimmed,
    snippet: normalizeSnippet(item),
    url: item.link,
    source: item.displayLink ?? "Google Search",
  }));
}
