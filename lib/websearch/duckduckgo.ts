import type { AssistantWebResult } from "@/lib/ai/schemas";

const DUCKDUCKGO_ENDPOINT = "https://api.duckduckgo.com/";

function normalizeSnippet(snippet?: string | null): string {
  if (!snippet) {
    return "";
  }
  return snippet.replace(/\s+/g, " ").trim();
}

export async function searchDuckDuckGo(query: string, limit = 5): Promise<AssistantWebResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    no_redirect: "1",
    no_html: "1",
    skip_disambig: "1",
  });

  const response = await fetch(`${DUCKDUCKGO_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "LifeAI/1.0 (+https://life.ai)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed with status ${response.status}`);
  }

  const payload = await response.json();
  const items: AssistantWebResult[] = [];

  if (Array.isArray(payload?.Results)) {
    for (const entry of payload.Results) {
      if (!entry?.Text) {
        continue;
      }
      items.push({
        title: entry.Text as string,
        snippet: normalizeSnippet(entry.Abstract ?? entry.Text ?? ""),
        url: typeof entry.FirstURL === "string" ? entry.FirstURL : undefined,
        source: entry.Source || "DuckDuckGo",
      });
    }
  }

  if (Array.isArray(payload?.RelatedTopics)) {
    for (const topic of payload.RelatedTopics) {
      if (topic?.Topics && Array.isArray(topic.Topics)) {
        for (const subTopic of topic.Topics) {
          if (typeof subTopic?.Text === "string") {
            items.push({
              title: subTopic.Text,
              snippet: normalizeSnippet(subTopic.Text),
              url: typeof subTopic.FirstURL === "string" ? subTopic.FirstURL : undefined,
              source: subTopic.Source || "DuckDuckGo",
            });
          }
        }
        continue;
      }
      if (typeof topic?.Text === "string") {
        items.push({
          title: topic.Text,
          snippet: normalizeSnippet(topic.Text),
          url: typeof topic.FirstURL === "string" ? topic.FirstURL : undefined,
          source: topic.Source || "DuckDuckGo",
        });
      }
    }
  }

  if (typeof payload?.AbstractText === "string" && payload.AbstractText.trim()) {
    items.unshift({
      title: payload.Heading || trimmed,
      snippet: normalizeSnippet(payload.AbstractText),
      url: typeof payload?.AbstractURL === "string" ? payload.AbstractURL : undefined,
      source: "DuckDuckGo",
    });
  }

  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = `${item.title}-${item.url ?? "no-url"}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}
