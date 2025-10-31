import type { OpenStatesBill } from "./types";

const OPEN_STATES_BILLS_URL = "https://v3.openstates.org/bills";

type OpenStatesRawBill = {
  id?: string;
  identifier?: string;
  title?: string;
  subject?: string[];
  latest_action_description?: string;
  latest_action_date?: string;
  openstates_url?: string;
  classification?: string[];
  legislative_session?: {
    identifier?: string;
    title?: string;
  };
  jurisdiction?: {
    name?: string;
  };
  from_organization?: {
    name?: string;
  };
  sources?: Array<{ url?: string | null }>;
};

type OpenStatesBillResponse = {
  results?: OpenStatesRawBill[];
};

function getApiKey(): string | null {
  const apiKey = process.env.OPEN_STATES_API ?? "";
  if (!apiKey) {
    return null;
  }
  return apiKey;
}

function toBill(raw: OpenStatesRawBill, index: number): OpenStatesBill {
  const sessionTitle = raw.legislative_session?.title ?? raw.legislative_session?.identifier ?? null;
  const jurisdiction = raw.jurisdiction?.name ?? raw.from_organization?.name ?? null;
  const subjects = Array.isArray(raw.subject) ? raw.subject.filter((value): value is string => Boolean(value)) : [];
  const url =
    raw.openstates_url ??
    raw.sources?.find((source) => typeof source?.url === "string" && source.url.length > 0)?.url ??
    null;

  return {
    id: raw.id ?? `openstates-${index}-${Math.random().toString(36).slice(2, 10)}`,
    identifier: raw.identifier ?? "Unknown bill",
    title: raw.title ?? raw.identifier ?? "Open States bill",
    jurisdiction,
    session: sessionTitle,
    latestAction: raw.latest_action_description ?? null,
    latestActionDate: raw.latest_action_date ?? null,
    subjects,
    url,
  };
}

export async function searchOpenStatesBills(query: string, limit = 5): Promise<OpenStatesBill[]> {
  if (!query.trim()) {
    return [];
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  const url = new URL(OPEN_STATES_BILLS_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", Math.max(1, Math.min(limit, 25)).toString());
  url.searchParams.set("sort", "latest_action_desc");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Open States search request failed", error);
    return [];
  }

  if (!response.ok) {
    console.error(`Open States search failed with status ${response.status}: ${response.statusText ?? "Unknown error"}`);
    return [];
  }

  const data = (await response.json()) as OpenStatesBillResponse;
  const results = Array.isArray(data.results) ? data.results : [];
  return results.slice(0, limit).map(toBill);
}
