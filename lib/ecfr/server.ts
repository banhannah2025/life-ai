import type { EcfrDocument } from "./types";

const ECFR_SEARCH_URL = "https://www.ecfr.gov/api/search/v1/results";

type EcfrSearchHierarchy = {
  title?: string | number | null;
  subtitle?: string | number | null;
  chapter?: string | number | null;
  subchapter?: string | number | null;
  part?: string | number | null;
  subpart?: string | number | null;
  subject_group?: string | number | null;
  section?: string | number | null;
  appendix?: string | number | null;
};

type EcfrSearchHeadings = {
  title?: string | null;
  subtitle?: string | null;
  chapter?: string | null;
  subchapter?: string | null;
  part?: string | null;
  subpart?: string | null;
  subject_group?: string | null;
  section?: string | null;
  appendix?: string | null;
};

type EcfrSearchResult = {
  starts_on?: string | null;
  ends_on?: string | null;
  type?: string | null;
  hierarchy?: EcfrSearchHierarchy | null;
  hierarchy_headings?: EcfrSearchHeadings | null;
  headings?: EcfrSearchHeadings | null;
  full_text_excerpt?: string | null;
  score?: number | null;
  structure_index?: number | null;
  reserved?: boolean | null;
  removed?: boolean | null;
  change_types?: string[] | null;
};

type EcfrSearchResponse = {
  results?: EcfrSearchResult[];
};

const HIERARCHY_SEGMENTS: Array<{ key: keyof EcfrSearchHierarchy; prefix: string }> = [
  { key: "subtitle", prefix: "subtitle" },
  { key: "chapter", prefix: "chapter" },
  { key: "subchapter", prefix: "subchapter" },
  { key: "part", prefix: "part" },
  { key: "subpart", prefix: "subpart" },
  { key: "subject_group", prefix: "subject-group" },
  { key: "section", prefix: "section" },
  { key: "appendix", prefix: "appendix" },
];

function stripHtml(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const text = value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

function toStringOrNull(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = typeof value === "number" ? value.toString() : value;
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildEcfrUrl(hierarchy: EcfrSearchHierarchy | null | undefined): string | null {
  if (!hierarchy) {
    return null;
  }

  const titleValue = toStringOrNull(hierarchy.title);
  if (!titleValue) {
    return null;
  }

  const segments: string[] = [`title-${encodeURIComponent(titleValue)}`];

  for (const { key, prefix } of HIERARCHY_SEGMENTS) {
    const rawValue = toStringOrNull(hierarchy[key]);
    if (!rawValue) {
      continue;
    }
    segments.push(`${prefix}-${encodeURIComponent(rawValue)}`);
  }

  return `https://www.ecfr.gov/current/${segments.join("/")}`;
}

function toEcfrDocument(raw: EcfrSearchResult, fallbackIndex: number): EcfrDocument {
  const titleFromHeadings =
    stripHtml(raw.headings?.section) ??
    stripHtml(raw.headings?.part) ??
    stripHtml(raw.headings?.title) ??
    stripHtml(raw.headings?.subpart) ??
    "eCFR document";

  const citation =
    toStringOrNull(raw.hierarchy_headings?.section) ??
    toStringOrNull(raw.hierarchy_headings?.part) ??
    toStringOrNull(raw.hierarchy_headings?.title) ??
    null;

  const section = toStringOrNull(raw.hierarchy?.section);
  const titleNumber = toStringOrNull(raw.hierarchy?.title);
  const url = buildEcfrUrl(raw.hierarchy);

  return {
    id: raw.structure_index ? raw.structure_index.toString() : `ecfr-doc-${fallbackIndex}-${Math.random().toString(36).slice(2, 10)}`,
    title: titleFromHeadings,
    citation,
    section,
    titleNumber,
    lastModified: toStringOrNull(raw.starts_on),
    url,
  };
}

export async function searchEcfrDocuments(query: string, limit = 5): Promise<EcfrDocument[]> {
  if (!query.trim()) {
    return [];
  }

  const url = new URL(ECFR_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", Math.max(1, Math.min(limit, 20)).toString());

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("eCFR search request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(`eCFR search failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`);
    return [];
  }

  const data = (await response.json()) as EcfrSearchResponse;
  const results = Array.isArray(data.results) ? data.results : [];
  return results.slice(0, limit).map((item, index) => toEcfrDocument(item, index));
}
