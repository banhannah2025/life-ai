import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createGroqChatCompletion } from "@/lib/ai/groq";

const requestSchema = z.object({
  query: z.string().min(1).max(2000),
  researchType: z.enum(["legal", "academic", "ai"]).default("legal"),
  results: z
    .array(
      z.object({
        title: z.string().min(1).max(400),
        snippet: z.string().max(1600).optional().nullable(),
        url: z
          .string()
          .url()
          .optional()
          .nullable(),
        source: z.string().max(120).optional().nullable(),
        date: z.string().max(120).optional().nullable(),
      })
    )
    .min(1)
    .max(12),
});

const SYSTEM_PROMPT = [
  "You are a meticulous legal research analyst for Life-AI.",
  "Using the numbered search results provided, craft a concise natural-language response that addresses the user's query.",
  "Use bracket citations like [1] referencing the numbers of the supporting results.",
  "Focus on primary sources first, then secondary, and highlight elements, standards, or holdings when relevant.",
  "If multiple authorities conflict, note the split.",
  "Respond with strict JSON using the shape:",
  '{ "answer": string, "citations": Array<{ "ref": number, "label": string, "url": string | null }> }',
  "Keep the answer under 180 words. Do not fabricate citations or cite any source not provided.",
].join(" ");

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

  const { query, results } = parsed.data;

  const context = results
    .map((result, index) => {
      const segments: string[] = [`[${index + 1}] ${result.title}`];
      if (result.source) {
        segments.push(`Source: ${result.source}`);
      }
      if (result.date) {
        segments.push(`Date: ${result.date}`);
      }
      if (result.snippet) {
        segments.push(`Summary: ${result.snippet}`);
      }
      if (result.url) {
        segments.push(`URL: ${result.url}`);
      }
      return segments.join(" | ");
    })
    .join("\n");

  try {
    const completion = await createGroqChatCompletion({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `User query: """${query}"""`,
            "Numbered research results:",
            context,
            "Respond only with the JSON structure specified in the instructions.",
          ].join("\n\n"),
        },
      ],
    });

    let parsedContent: { answer?: string; citations?: Array<{ ref?: unknown; label?: unknown; url?: unknown }> };
    try {
      parsedContent = JSON.parse(completion.content.trim());
    } catch {
      throw new Error("Assistant returned non-JSON content.");
    }

    const answer = typeof parsedContent.answer === "string" && parsedContent.answer.trim() ? parsedContent.answer.trim() : null;
    if (!answer) {
      throw new Error("Assistant did not provide an answer.");
    }

    const citations =
      Array.isArray(parsedContent.citations) && parsedContent.citations.length
        ? parsedContent.citations
            .map((entry) => {
              if (
                typeof entry?.ref === "number" &&
                Number.isFinite(entry.ref) &&
                entry.ref >= 1 &&
                typeof entry.label === "string" &&
                entry.label.trim()
              ) {
                const url =
                  typeof entry.url === "string" && entry.url.trim()
                    ? entry.url.trim()
                    : null;
                return {
                  ref: entry.ref,
                  label: entry.label.trim(),
                  url,
                };
              }
              return null;
            })
            .filter((entry): entry is { ref: number; label: string; url: string | null } => entry !== null)
        : [];

    return NextResponse.json({
      answer,
      citations,
    });
  } catch (error) {
    console.error("AI search answer error", error);
    const message = error instanceof Error ? error.message : "AI answer generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
