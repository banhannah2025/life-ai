import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { assistantChatRequestSchema, sanitizeMessages, type AssistantWebResult } from "@/lib/ai/schemas";
import { createGroqChatCompletion, DEFAULT_GROQ_MODEL, type GroqChatMessage } from "@/lib/ai/groq";
import { searchDuckDuckGo } from "@/lib/websearch/duckduckgo";

const SYSTEM_PROMPT = [
  "You are Life-AI Copilot, a multidisciplinary assistant for legal, community, and operational work.",
  "Respond with clear, structured answers that cite web sources using square brackets like [1] where applicable.",
  "When appropriate, outline actionable next steps and reference the shared canvas for brainstorming ideas.",
  "If information is unavailable, be honest and suggest alternative approaches.",
].join(" ");

type ParsedBody = {
  model?: Parameters<typeof createGroqChatCompletion>[0]["model"];
  messages: GroqChatMessage[];
  webResults?: AssistantWebResult[];
  useWebSearch?: boolean;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = assistantChatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const body: ParsedBody = parsed.data;
  const sanitizedMessages = sanitizeMessages(body.messages);
  const lastUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === "user");

  let webResults: AssistantWebResult[] = body.webResults ?? [];
  if ((body.useWebSearch ?? true) && webResults.length === 0 && lastUserMessage) {
    try {
      webResults = await searchDuckDuckGo(lastUserMessage.content, 5);
    } catch (error) {
      console.error("Live web search failed", error);
    }
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
            "Cite sources inline using [number].",
          ].join("\n"),
        },
      ]
    : [];

  const conversation: GroqChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...sanitizedMessages,
    ...searchSummary,
  ];

  try {
    const completion = await createGroqChatCompletion({
      model: body.model ?? DEFAULT_GROQ_MODEL,
      messages: conversation,
      temperature: 0.3,
    });

    return NextResponse.json({
      content: completion.content,
      webResults,
      model: body.model ?? DEFAULT_GROQ_MODEL,
    });
  } catch (error) {
    console.error("Assistant chat error", error);
    const message = error instanceof Error ? error.message : "Assistant request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
