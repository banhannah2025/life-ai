import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";

import { getStripeClient } from "@/lib/stripe/server";
import { resolvePlanFromStripePrice } from "@/lib/subscription/stripe-plan";
import { normalizePlanId } from "@/lib/subscription/plan-metadata";
import { persistUserPlan } from "@/lib/subscription/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Missing Stripe webhook configuration.");
    return NextResponse.json({ error: "Webhook misconfigured" }, { status: 500 });
  }

  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Failed handling Stripe webhook ${event.type}`, error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const userId = extractUserId(subscription);
  if (!userId) {
    console.warn("Stripe subscription event missing user id metadata", subscription.id);
    return;
  }

  const price = subscription.items?.data?.[0]?.price ?? null;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? subscription.customer?.toString?.() ?? null;

  const planFromPrice = resolvePlanFromStripePrice(price?.id ?? null);
  const planFromMetadata = normalizePlanId(subscription.metadata?.planId ?? subscription.metadata?.plan_id ?? null);
  const shouldDowngrade = subscription.status === "canceled" || subscription.status === "unpaid";
  const targetPlanId = shouldDowngrade ? "free" : planFromPrice ?? planFromMetadata;

  if (targetPlanId) {
    await persistUserPlan(userId, targetPlanId);
  } else if (shouldDowngrade) {
    await persistUserPlan(userId, "free");
  }

  const priceCents = typeof price?.unit_amount === "number" ? price.unit_amount : null;
  const currency = typeof price?.currency === "string" ? price.currency.toUpperCase() : "USD";

  await getAdminFirestore()
    .collection("profiles")
    .doc(userId)
    .set(
      {
        billing: {
          provider: "stripe",
          subscriptionId: subscription.id,
          providerPlanId: price?.id ?? null,
          customerId,
          status: subscription.status ?? "unknown",
          priceCents,
          currency,
          renewsAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
          cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
}

function extractUserId(subscription: Stripe.Subscription): string | null {
  const metadataUserId = subscription.metadata?.userId ?? subscription.metadata?.user_id;
  if (metadataUserId && typeof metadataUserId === "string") {
    return metadataUserId;
  }

  const defaultPaymentMethod = subscription.default_payment_method;
  if (defaultPaymentMethod && typeof defaultPaymentMethod === "object") {
    const customer = defaultPaymentMethod.customer;
    if (customer && typeof customer === "object" && "metadata" in customer) {
      const metadata = (customer as Stripe.Customer).metadata ?? {};
      const fallback = metadata.userId ?? metadata.user_id;
      if (fallback && typeof fallback === "string") {
        return fallback;
      }
    }
  }

  return null;
}
