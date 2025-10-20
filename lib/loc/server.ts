import type { LibraryOfCongressItem } from "./types";

const LIBRARY_OF_CONGRESS_BASE_URL = "https://www.loc.gov/search";

type LibraryOfCongressRawItem = {
  id?: string;
  title?: string;
  description?: string;
  date?: string;
  subject?: Array<string | null>;
  url?: string;
};

type LibraryOfCongressResponse = {
  results?: LibraryOfCongressRawItem[];
};

function getApiKey(): string | null {
  const key = process.env.LOC_API_KEY ?? process.env.GOVINFO_API_KEY ?? "";
  if (!key) {
    return null;
  }
  return key;
}

function toLibraryItem(raw: LibraryOfCongressRawItem, index: number): LibraryOfCongressItem {
  return {
    id: raw.id ?? raw.url ?? `loc-item-${index}-${Math.random().toString(36).slice(2, 10)}`,
    title: raw.title ?? "Library of Congress item",
    description: raw.description ?? null,
    date: raw.date ?? null,
    subjects: Array.isArray(raw.subject) ? raw.subject.filter((value): value is string => Boolean(value)) : [],
    url: raw.url ?? raw.id ?? null,
  };
}

export async function searchLibraryOfCongress(query: string, limit = 5): Promise<LibraryOfCongressItem[]> {
  if (!query.trim()) {
    return [];
  }

  const url = new URL(LIBRARY_OF_CONGRESS_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("fo", "json");
  url.searchParams.set("c", Math.max(1, Math.min(limit, 20)).toString());

  const apiKey = getApiKey();
  if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Library of Congress search request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(
      `Library of Congress search failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`
    );
    return [];
  }

  const data = (await response.json()) as LibraryOfCongressResponse;
  const items = Array.isArray(data.results) ? data.results : [];
  return items.slice(0, limit).map((item, index) => toLibraryItem(item, index));
}
