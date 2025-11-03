import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createGroqChatCompletion, type GroqModelId } from "@/lib/ai/groq";
import { searchDuckDuckGo } from "@/lib/websearch/duckduckgo";

const requestSchema = z.object({
  query: z.string().min(1).max(2000),
  researchType: z.enum(["legal", "academic", "ai"]).default("legal"),
});

const MODEL_MAP: Record<"legal" | "academic" | "ai", GroqModelId> = {
  legal: "llama-3.3-70b-versatile",
  academic: "openai/gpt-oss-20b",
  ai: "llama-3.1-8b-instant",
};

const SYSTEM_PROMPT = [
  "You are the senior legal research librarian for Life-AI.",
  "Task: translate the user's plain-language request into a focused legal research strategy that surfaces controlling authority first.",
  "Available collections include: primary-law, secondary, litigation, knowledge, internet. Prefer primary-law unless the user only needs commentary.",
  "Jurisdiction hints should reference slugs like 'federal:supreme', 'state:all:supreme', or agency shortcuts when helpful.",
  "Respond with strict JSON using this exact shape:",
  '{ "searchQuery": string, "summary": string, "collections": string[], "jurisdictions": string[] }',
  "Requirements:",
  "- searchQuery must stay under 160 characters and use legal search syntax (AND, OR, quotes, proximity) to capture the controlling issue, doctrines, and elements.",
  "- summary (<=140 characters) must explain how you reframed the question (e.g., key tort, element test, statute, timeframe).",
  "- collections/jurisdictions arrays may be empty, but when populated should only contain valid slugs.",
  "- Always consider both internal data sources (CourtListener, RCWs, US Code, WA opinions, dockets) and external web connectors; do not exclude relevant connectors without justification.",
  "- Incorporate live web snippets (if provided) when they reinforce the legal test or cite additional authorities.",
].join(" ");

function sanitizeList(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<string>();
  for (const entry of value) {
    if (typeof entry === "string") {
      const trimmed = entry.trim();
      if (trimmed) {
        unique.add(trimmed.slice(0, 64));
        if (unique.size >= max) {
          break;
        }
      }
    }
  }
  return Array.from(unique);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { query, researchType } = parsed.data;
  const model = MODEL_MAP[researchType] ?? MODEL_MAP.legal;

  let webResults: Awaited<ReturnType<typeof searchDuckDuckGo>> = [];
  try {
    webResults = await searchDuckDuckGo(query, 5);
  } catch (error) {
    console.error("AI search assist web search failed", error);
  }

  const searchSummary = webResults.length
    ? [
        {
          role: "system" as const,
          content: [
            "Live web search results:",
            webResults
              .map((result, index) => {
                const parts = [`[${index + 1}] ${result.title}`];
                if (result.url) {
                  parts.push(result.url);
                }
                if (result.snippet) {
                  parts.push(result.snippet);
                }
                return parts.join(" — ");
              })
              .join("\n"),
            "Incorporate relevant insights when refining the query. Keep citations aligned with the numbering when referenced.",
          ].join("\n"),
        },
      ]
    : [];

  try {
    const completion = await createGroqChatCompletion({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...searchSummary,
        {
          role: "user",
          content: [
            `Research type: ${researchType}`,
            "Respond only with JSON.",
            `User query: """${query}"""`,
          ].join("\n"),
        },
      ],
    });

    let parsedContent: {
      searchQuery?: string;
      summary?: string;
      collections?: string[];
      jurisdictions?: string[];
    };
    try {
      parsedContent = JSON.parse(completion.content.trim());
    } catch {
      throw new Error("Assistant returned non-JSON content.");
    }

    const searchQuery =
      typeof parsedContent.searchQuery === "string" && parsedContent.searchQuery.trim()
        ? parsedContent.searchQuery.trim()
        : query;

    return NextResponse.json({
      searchQuery,
      summary:
        typeof parsedContent.summary === "string" && parsedContent.summary.trim()
          ? parsedContent.summary.trim()
          : null,
      collections: sanitizeList(parsedContent.collections),
      jurisdictions: sanitizeList(parsedContent.jurisdictions),
      webResults,
    });
  } catch (error) {
    console.error("AI search assist error", error);
    const message = error instanceof Error ? error.message : "AI search assist failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
