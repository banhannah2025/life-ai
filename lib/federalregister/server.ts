import type { FederalRegisterDocument } from "./types";

const FEDERAL_REGISTER_BASE_URL = "https://www.federalregister.gov/api/v1/documents.json";

type FederalRegisterRawDocument = {
  id?: string | number;
  document_number?: string;
  title?: string;
  abstract?: string;
  document_type?: string;
  agencies?: Array<{ name?: string | null }> | null;
  publication_date?: string;
  html_url?: string;
  pdf_url?: string;
};

type FederalRegisterResponse = {
  results?: FederalRegisterRawDocument[];
};

function toDocument(raw: FederalRegisterRawDocument, index: number): FederalRegisterDocument {
  const primaryId =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw.id === "number"
        ? raw.id.toString()
        : raw.document_number ?? `fr-doc-${index}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: primaryId,
    title: raw.title ?? "Federal Register document",
    abstract: raw.abstract ?? null,
    documentType: raw.document_type ?? null,
    agencies: Array.isArray(raw.agencies) ? raw.agencies.map((agency) => agency?.name).filter(Boolean) as string[] : [],
    publicationDate: raw.publication_date ?? null,
    htmlUrl: raw.html_url ?? null,
    pdfUrl: raw.pdf_url ?? null,
  };
}

export async function searchFederalRegisterDocuments(query: string, limit = 5): Promise<FederalRegisterDocument[]> {
  if (!query.trim()) {
    return [];
  }

  const url = new URL(FEDERAL_REGISTER_BASE_URL);
  url.searchParams.set("per_page", Math.max(1, Math.min(limit, 20)).toString());
  url.searchParams.set("order", "newest");
  url.searchParams.set("search", query);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Federal Register search request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(
      `Federal Register search failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`
    );
    return [];
  }

  const data = (await response.json()) as FederalRegisterResponse;
  const results = Array.isArray(data.results) ? data.results : [];
  return results.slice(0, limit).map((result, index) => toDocument(result, index));
}
