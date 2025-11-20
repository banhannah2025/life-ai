import type { SubscriptionPlanId } from "@/lib/subscription/types";

const STRIPE_PRICE_IDS: Partial<Record<SubscriptionPlanId, string | null>> = {
  plus: process.env.STRIPE_PRICE_ID_PLUS ?? null,
};

const PRICE_TO_PLAN = new Map<string, SubscriptionPlanId>();
for (const [planId, priceId] of Object.entries(STRIPE_PRICE_IDS)) {
  if (priceId) {
    PRICE_TO_PLAN.set(priceId, planId as SubscriptionPlanId);
    PRICE_TO_PLAN.set(priceId.toLowerCase(), planId as SubscriptionPlanId);
  }
}

export function getStripePriceIdForPlan(planId: SubscriptionPlanId): string | null {
  return STRIPE_PRICE_IDS[planId] ?? null;
}

export function resolvePlanFromStripePrice(priceId: string | null | undefined): SubscriptionPlanId | null {
  if (!priceId) {
    return null;
  }
  const normalized = priceId.trim();
  if (!normalized) {
    return null;
  }
  return PRICE_TO_PLAN.get(priceId) ?? PRICE_TO_PLAN.get(normalized.toLowerCase()) ?? null;
}
