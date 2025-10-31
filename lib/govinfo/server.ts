import type { GovInfoDocument } from "./types";

const GOVINFO_API_BASE_URL = "https://api.govinfo.gov";

type GovInfoSearchResult = {
  citations?: Array<{ type?: string | null; citation?: string | null }>;
  title?: string;
  collectionCode?: string;
  collectionName?: string;
  documentDate?: string;
  congress?: string;
  url?: string;
  packageId?: string;
};

type GovInfoSearchResponse = {
  results?: GovInfoSearchResult[];
};

function getApiKey(): string | null {
  const key = process.env.GOVINFO_API_KEY ?? "";
  if (!key) {
    return null;
  }
  return key;
}

function toDocument(raw: GovInfoSearchResult): GovInfoDocument {
  const citation = raw.citations?.find((entry) => entry?.citation)?.citation ?? null;
  return {
    citation,
    title: raw.title ?? "Government document",
    collectionCode: raw.collectionCode ?? null,
    collectionName: raw.collectionName ?? null,
    documentDate: raw.documentDate ?? null,
    congress: raw.congress ?? null,
    url: raw.url ?? null,
    packageId: raw.packageId ?? crypto.randomUUID(),
  };
}

export async function searchGovInfoDocuments(query: string, limit = 5): Promise<GovInfoDocument[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  const url = new URL(`${GOVINFO_API_BASE_URL}/search`);
  url.searchParams.set("api_key", apiKey);

  const pageSize = Math.max(1, Math.min(limit, 20));
  const payload = {
    query,
    offsetMark: "*",
    pageSize,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("GovInfo search request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(`GovInfo search failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`);
    return [];
  }

  const data = (await response.json()) as GovInfoSearchResponse;
  const results = Array.isArray(data.results) ? data.results : [];
  return results.slice(0, limit).map(toDocument);
}
