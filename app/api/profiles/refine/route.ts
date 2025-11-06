import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createGroqChatCompletion } from "@/lib/ai/groq";
import { enforceAiDailyLimit, UsageLimitReachedError } from "@/lib/subscription/usage-limit";
import { getPlan } from "@/lib/subscription/plans";
import type { SubscriptionPlanId } from "@/lib/subscription/types";

const requestSchema = z.object({
  field: z.enum(["headline", "summary"]),
  value: z.string().min(12).max(2000),
});

const FIELD_PROMPTS: Record<"headline" | "summary", string> = {
  headline: [
    "Rewrite the user's tagline so it is concise (<= 140 characters), specific, and inviting.",
    "Highlight how they contribute to the Life-AI community.",
    "Avoid jargon and keep it first-person or descriptive (no third-person bios).",
  ].join(" "),
  summary: [
    "Refine the user's bio into a 3-4 sentence narrative (<= 160 words).",
    "Spotlight their mission, expertise, and the communities they serve.",
    "Keep the tone warm, service-oriented, and inclusive.",
  ].join(" "),
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let planId: SubscriptionPlanId;
  try {
    const usage = await enforceAiDailyLimit(userId, "profile-refine");
    planId = usage.planId;
  } catch (error) {
    if (error instanceof UsageLimitReachedError) {
      return NextResponse.json({ error: "Daily limit reached", details: { message: error.message } }, { status: 429 });
    }
    console.error("Profile refine usage enforcement failed", error);
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

  const { field, value } = parsed.data;
  const plan = getPlan(planId);

  try {
    const completion = await createGroqChatCompletion({
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: [
            "You are Synthesis AI, acting as Life-AI's community writing coach.",
            "Elevate the user's profile content so it reads as authentic, strengths-based, and community-driven.",
            `The user is on the ${plan.name} plan.`,
            "Return only the rewritten text, no preamble or explanation.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            FIELD_PROMPTS[field],
            "",
            "Original content:",
            `"""${value.trim()}"""`,
          ].join("\n"),
        },
      ],
    });

    const suggestion = completion.content.trim();
    if (!suggestion.length) {
      throw new Error("Assistant returned an empty response.");
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Profile refine error", error);
    const message = error instanceof Error ? error.message : "Profile refinement failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
