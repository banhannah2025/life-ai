const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export type ResearchMode = "legal" | "academic" | "ai";

export type AiSearchAssistWebResult = {
  title: string;
  snippet?: string | null;
  url?: string | null;
  source?: string | null;
};

export type AiSearchAssistResponse = {
  searchQuery: string;
  summary?: string | null;
  collections?: string[];
  jurisdictions?: string[];
  webResults?: AiSearchAssistWebResult[];
};

export async function requestAiSearchAssist(query: string, researchType: ResearchMode): Promise<AiSearchAssistResponse> {
  const response = await fetch("/api/search/ai", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ query, researchType }),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => (typeof body?.error === "string" ? body.error : "AI assist request failed."))
      .catch(() => "AI assist request failed.");
    throw new Error(message);
  }

  const payload = (await response.json().catch(() => null)) as AiSearchAssistResponse | null;
  if (!payload || typeof payload.searchQuery !== "string") {
    throw new Error("AI assist returned an unexpected response.");
  }
  return payload;
}
