import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/plans";
import { createStripeCheckoutSession } from "@/lib/stripe/server";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const planId = (payload?.planId as SubscriptionPlanId | undefined) ?? null;

  if (!planId || planId === "free") {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || !plan.isPaidTier) {
    return NextResponse.json({ error: "Unsupported plan." }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const baseUrl = getBaseUrl();

  try {
    const session = await createStripeCheckoutSession({
      userId,
      email,
      planId,
      successUrl: `${baseUrl}/subscriptions?status=success`,
      cancelUrl: `${baseUrl}/subscriptions?status=cancelled`,
    });
    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create Stripe checkout session", error);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
