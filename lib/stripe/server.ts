import Stripe from "stripe";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { getStripePriceIdForPlan } from "@/lib/subscription/stripe-plan";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });
  return stripeClient;
}

export async function getOrCreateStripeCustomerId(userId: string, email: string | null): Promise<string> {
  if (!userId) {
    throw new Error("Cannot resolve Stripe customer without user id.");
  }

  const profileRef = getAdminFirestore().collection("profiles").doc(userId);
  const snapshot = await profileRef.get();
  const existing = snapshot.exists ? snapshot.data() : null;
  const existingCustomerId = existing?.billing?.customerId;
  if (existingCustomerId && typeof existingCustomerId === "string") {
    return existingCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: {
      userId,
    },
  });

  await profileRef.set(
    {
      billing: {
        customerId: customer.id,
      },
    },
    { merge: true },
  );

  return customer.id;
}

type CheckoutSessionOptions = {
  userId: string;
  email: string | null;
  planId: SubscriptionPlanId;
  successUrl: string;
  cancelUrl: string;
};

export async function createStripeCheckoutSession({
  userId,
  email,
  planId,
  successUrl,
  cancelUrl,
}: CheckoutSessionOptions) {
  const priceId = getStripePriceIdForPlan(planId);
  if (!priceId) {
    throw new Error(`Stripe price id not configured for plan ${planId}`);
  }

  const customerId = await getOrCreateStripeCustomerId(userId, email);
  const stripe = getStripeClient();

  return stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: customerId,
    allow_promotion_codes: true,
    metadata: {
      userId,
      planId,
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  });
}

type BillingPortalOptions = {
  userId: string;
  email: string | null;
  returnUrl: string;
};

export async function createStripeBillingPortalSession({ userId, email, returnUrl }: BillingPortalOptions) {
  const customerId = await getOrCreateStripeCustomerId(userId, email);
  const stripe = getStripeClient();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
