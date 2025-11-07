import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createGroqChatCompletion } from "@/lib/ai/groq";
import { createOpenAiChatCompletion } from "@/lib/ai/openai";
import { enforceAiDailyLimit, UsageLimitReachedError } from "@/lib/subscription/usage-limit";
import { getPlan } from "@/lib/subscription/plans";
import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { resolveResearchModel } from "@/lib/ai/model-routing";

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
  "You are Life-AI's lead legal analyst.",
  "Use the numbered research results to produce a concise, practice-ready analysis that answers the user's question.",
  "Requirements:",
  "- Prioritize primary authorities (cases, statutes, regulations) before secondary commentary.",
  "- Lay out the controlling rule or element test, cite the leading authority, and summarize the holding or statutory language in plain terms.",
  "- If the question calls for application, briefly map the rule to the issue (IRAC style in 2-3 sentences).",
  "- Flag conflicting authorities or unsettled law when the supplied materials indicate a split.",
  "- Use bracket citations like [1] tied to the numbered results. Never invent citations.",
  "- Cap the response at 180 words.",
  "Respond only with strict JSON shaped as:",
  '{ "answer": string, "citations": Array<{ "ref": number, "label": string, "url": string | null }> }',
].join(" ");

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let planId: SubscriptionPlanId;
  try {
    const usage = await enforceAiDailyLimit(userId, "library-search");
    planId = usage.planId;
  } catch (error) {
    if (error instanceof UsageLimitReachedError) {
      return NextResponse.json({ error: "Daily limit reached", details: { message: error.message } }, { status: 429 });
    }
    console.error("AI search answer usage enforcement failed", error);
    return NextResponse.json({ error: "Unable to verify usage quota. Please try again later." }, { status: 503 });
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

  const { query, results, researchType } = parsed.data;
  const plan = getPlan(planId);
  const aiConfig = resolveResearchModel(plan, researchType);
  if (researchType === "legal" && !plan.includesLegalResearch) {
    return NextResponse.json(
      {
        error: "Legal research is unavailable on your current plan.",
        details: { plan: plan.name, upgradeUrl: "/subscriptions" },
      },
      { status: 403 },
    );
  }

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
    const completion =
      aiConfig.provider === "openai"
        ? await createOpenAiChatCompletion({
            model: aiConfig.model,
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
          })
        : await createGroqChatCompletion({
            model: aiConfig.model,
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
