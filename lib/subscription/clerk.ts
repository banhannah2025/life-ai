import type { SubscriptionPlanId, SubscriptionBillingStatus } from "@/lib/subscription/types";

const CLERK_PLUS_PLAN_ID =
  // Keep server + client plan IDs in sync so webhook mapping always works.
  process.env.CLERK_PLUS_PLAN_ID ?? process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID ?? "plus-monthly";

const CLERK_PLAN_TO_SUBSCRIPTION: Record<string, SubscriptionPlanId> = {};
if (CLERK_PLUS_PLAN_ID) {
  CLERK_PLAN_TO_SUBSCRIPTION[CLERK_PLUS_PLAN_ID] = "plus";
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const CANCELLED_STATUSES = new Set(["canceled", "unpaid", "past_due", "incomplete", "incomplete_expired", "paused"]);

export function mapClerkPlanToSubscription(planId: string | null | undefined): SubscriptionPlanId | null {
  if (!planId) {
    return null;
  }
  return CLERK_PLAN_TO_SUBSCRIPTION[planId] ?? null;
}

export function normalizeClerkStatus(status: string | null | undefined): SubscriptionBillingStatus {
  if (!status) {
    return "unknown";
  }
  const lowered = status.toLowerCase();
  if (ACTIVE_STATUSES.has(lowered)) {
    return lowered as SubscriptionBillingStatus;
  }
  if (CANCELLED_STATUSES.has(lowered)) {
    return lowered as SubscriptionBillingStatus;
  }
  return "unknown";
}

export function isClerkSubscriptionActive(status: string | null | undefined): boolean {
  return ACTIVE_STATUSES.has((status ?? "").toLowerCase());
}

export const CLERK_BILLING_PLAN_IDS = {
  plus: CLERK_PLUS_PLAN_ID,
} as const;
