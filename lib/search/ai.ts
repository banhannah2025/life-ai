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

export type AiSearchAnswerResultInput = {
  title: string;
  snippet?: string | null;
  url?: string | null;
  source?: string | null;
  date?: string | null;
};

export type AiSearchAnswerCitation = {
  ref: number;
  label: string;
  url: string | null;
};

export type AiSearchAnswerResponse = {
  answer: string;
  citations: AiSearchAnswerCitation[];
};

export async function requestAiSearchAnswer(
  query: string,
  researchType: ResearchMode,
  results: AiSearchAnswerResultInput[]
): Promise<AiSearchAnswerResponse> {
  const response = await fetch("/api/search/ai/answer", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ query, researchType, results }),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => (typeof body?.error === "string" ? body.error : "AI answer request failed."))
      .catch(() => "AI answer request failed.");
    throw new Error(message);
  }

  const payload = (await response.json().catch(() => null)) as AiSearchAnswerResponse | null;
  if (!payload || typeof payload.answer !== "string") {
    throw new Error("AI answer returned an unexpected response.");
  }
  const citations = Array.isArray(payload.citations)
    ? payload.citations.filter(
        (citation): citation is AiSearchAnswerCitation =>
          typeof citation?.ref === "number" &&
          Number.isFinite(citation.ref) &&
          citation.ref >= 1 &&
          typeof citation.label === "string" &&
          (!citation.url || typeof citation.url === "string")
      )
    : [];
  return {
    answer: payload.answer,
    citations,
  };
}
