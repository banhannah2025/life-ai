import type { RegulationsDocument } from "./types";

const REGULATIONS_BASE_URL = "https://api.regulations.gov/v4/documents";

type RegulationsRawDocument = {
  id?: string;
  attributes?: {
    title?: string;
    documentId?: string;
    docketId?: string;
    agency?: string;
    postedDate?: string;
    commentDueDate?: string;
    highlights?: {
      title?: string[];
    };
    fileFormats?: Array<{
      format?: string;
      url?: string;
    }>;
    documentType?: string;
  };
  links?: {
    self?: string;
  };
};

type RegulationsResponse = {
  data?: RegulationsRawDocument[];
};

function getApiKey(): string | null {
  const key = process.env.API_DATA_GOV_KEY ?? process.env.GOVINFO_API_KEY ?? "";
  if (!key) {
    return null;
  }
  return key;
}

function extractDocumentUrl(raw: RegulationsRawDocument): string | null {
  const formats = raw.attributes?.fileFormats;
  if (Array.isArray(formats)) {
    const html = formats.find((item) => item?.format === "html" && item.url);
    if (html?.url) {
      return html.url;
    }
    const pdf = formats.find((item) => item?.format === "pdf" && item.url);
    if (pdf?.url) {
      return pdf.url;
    }
    const other = formats.find((item) => item?.url);
    if (other?.url) {
      return other.url;
    }
  }
  return raw.links?.self ?? null;
}

function toRegulationsDocument(raw: RegulationsRawDocument, index: number): RegulationsDocument {
  const attributes = raw.attributes ?? {};
  const highlightsTitle = attributes.highlights?.title?.[0];
  return {
    id: raw.id ?? `regs-${index}-${Math.random().toString(36).slice(2, 10)}`,
    title: highlightsTitle ?? attributes.title ?? "Regulations.gov document",
    docketId: attributes.docketId ?? null,
    documentId: attributes.documentId ?? null,
    agency: attributes.agency ?? null,
    postedDate: attributes.postedDate ?? null,
    commentDueDate: attributes.commentDueDate ?? null,
    url: extractDocumentUrl(raw),
  };
}

export async function searchRegulationsDocuments(query: string, limit = 5): Promise<RegulationsDocument[]> {
  if (!query.trim()) {
    return [];
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  const url = new URL(REGULATIONS_BASE_URL);
  url.searchParams.set("filter[searchTerm]", query);
  url.searchParams.set("page[size]", Math.max(1, Math.min(limit, 20)).toString());
  url.searchParams.set("sort", "-postedDate");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Regulations.gov search request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(
      `Regulations.gov search failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`
    );
    return [];
  }

  const data = (await response.json()) as RegulationsResponse;
  const items = Array.isArray(data.data) ? data.data : [];
  return items.slice(0, limit).map((item, index) => toRegulationsDocument(item, index));
}
