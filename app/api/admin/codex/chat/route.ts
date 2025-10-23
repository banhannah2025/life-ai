import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { isAdminUser } from "@/lib/admin/guard";
import {
  codexChatRequestSchema,
  sanitizeMessages,
  type CodexChatRequest,
} from "@/lib/ai/schemas";
import {
  DEFAULT_GROQ_MODEL,
  GroqConfigurationError,
  GroqRequestError,
  createGroqChatCompletion,
} from "@/lib/ai/groq";

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

  try {
    const completion = await createGroqChatCompletion({
      ...parsed,
      model: parsed.model ?? DEFAULT_GROQ_MODEL,
      messages: sanitizeMessages(parsed.messages),
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

