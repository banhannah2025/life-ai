import type { SubscriptionPlanId, SubscriptionBillingStatus } from "@/lib/subscription/types";

const PLUS_PLAN_IDS = collectPlanIds(
  process.env.CLERK_PLUS_PLAN_IDS,
  process.env.CLERK_PLUS_PLAN_ID,
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_IDS,
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID,
);

const PRIMARY_PLUS_PLAN_ID = PLUS_PLAN_IDS[0] ?? "plus-monthly";

const CLERK_PLAN_TO_SUBSCRIPTION = new Map<string, SubscriptionPlanId>();
for (const id of PLUS_PLAN_IDS) {
  if (id) {
    CLERK_PLAN_TO_SUBSCRIPTION.set(id, "plus");
    CLERK_PLAN_TO_SUBSCRIPTION.set(id.toLowerCase(), "plus");
  }
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const CANCELLED_STATUSES = new Set(["canceled", "unpaid", "past_due", "incomplete", "incomplete_expired", "paused"]);

export function mapClerkPlanToSubscription(planId: string | null | undefined): SubscriptionPlanId | null {
  if (!planId) {
    return null;
  }
  const normalized = planId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const explicit = CLERK_PLAN_TO_SUBSCRIPTION.get(planId) ?? CLERK_PLAN_TO_SUBSCRIPTION.get(normalized);
  if (explicit) {
    return explicit;
  }
  if (normalized.includes("plus")) {
    return "plus";
  }
  return null;
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
  plus: PRIMARY_PLUS_PLAN_ID,
} as const;

function collectPlanIds(...values: Array<string | undefined>): string[] {
  const entries = values
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim())
    .filter(Boolean);

  if (!entries.length) {
    entries.push("plus", "plus-monthly");
  }

  return Array.from(new Set(entries));
}
