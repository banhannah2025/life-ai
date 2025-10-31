import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { isAdminUser } from "@/lib/admin/guard";
import {
  codexChatRequestSchema,
  sanitizeMessages,
  type CodexChatRequest,
  type AssistantWebResult,
} from "@/lib/ai/schemas";
import {
  DEFAULT_GROQ_MODEL,
  GroqConfigurationError,
  GroqRequestError,
  createGroqChatCompletion,
} from "@/lib/ai/groq";
import { searchDuckDuckGo } from "@/lib/websearch/duckduckgo";

type ParsedRequest = CodexChatRequest & Required<Pick<CodexChatRequest, "messages">>;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let parsed: ParsedRequest;
  try {
    const jsonPayload = await request.json();
    const parsedResult = codexChatRequestSchema.safeParse(jsonPayload);
    if (!parsedResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: parsedResult.error.flatten(),
        },
        { status: 422 },
      );
    }
    parsed = parsedResult.data;
  } catch (error) {
    return NextResponse.json(
      {
        error: "Malformed JSON payload.",
        details: error instanceof Error ? error.message : "Unknown parsing error.",
      },
      { status: 400 },
    );
  }

  const sanitizedMessages = sanitizeMessages(parsed.messages);
  const lastUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === "user");

  let webResults: AssistantWebResult[] = parsed.webResults ?? [];
  if ((parsed.useWebSearch ?? true) && webResults.length === 0 && lastUserMessage) {
    try {
      webResults = await searchDuckDuckGo(lastUserMessage.content, 5);
    } catch (error) {
      console.error("Codex live web search failed", error);
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
                const segments = [`[${index + 1}] ${result.title}`];
                if (result.url) {
                  segments.push(result.url);
                }
                if (result.snippet) {
                  segments.push(result.snippet);
                }
                return segments.join(" — ");
              })
              .join("\n"),
            "Ground your answer in repository context but cite web sources inline using [number] when you reference them.",
          ].join("\n"),
        },
      ]
    : [];

  try {
    const completion = await createGroqChatCompletion({
      model: parsed.model ?? DEFAULT_GROQ_MODEL,
      temperature: parsed.temperature,
      maxTokens: parsed.maxTokens,
      messages: [...sanitizedMessages, ...searchSummary],
    });

    const raw = completion.raw as
      | {
          id?: string;
          created?: number;
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          };
        }
      | undefined;

    return NextResponse.json({
      content: completion.content,
      model: parsed.model ?? DEFAULT_GROQ_MODEL,
      webResults,
      usage: raw?.usage ?? null,
      created: raw?.created ?? null,
      id: raw?.id ?? null,
    });
  } catch (error) {
    if (error instanceof GroqConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof GroqRequestError) {
      return NextResponse.json(
        {
          error: error.message,
          response: error.responseBody,
        },
        { status: error.status },
      );
    }

    console.error("Life-AI Codex Groq error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate completion from Groq.",
      },
      { status: 500 },
    );
  }
}
