import type { UserProfile } from "@/lib/profile/schema";
import type { SubscriptionPlanId, UserBillingProfile } from "@/lib/subscription/types";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/plans";

const VALID_PLAN_IDS = new Set<SubscriptionPlanId>(["free", "plus", "legal_team", "enterprise"]);

const plusPlanCandidates = buildCandidateSet(
  process.env.CLERK_PLUS_PLAN_IDS,
  process.env.CLERK_PLUS_PLAN_ID,
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_IDS,
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID,
);

const PRICE_TO_PLAN_ID = buildPriceIndex();

export function inferProfilePlanId(profile: Pick<UserProfile, "planId" | "billing"> | null | undefined): SubscriptionPlanId {
  if (profile?.planId && VALID_PLAN_IDS.has(profile.planId)) {
    return profile.planId;
  }

  const inferred = resolvePlanFromBillingDetails(profile?.billing);
  if (inferred) {
    return inferred;
  }

  return "free";
}

export function resolvePlanFromBillingDetails(
  billing: Pick<UserBillingProfile, "providerPlanId" | "priceCents" | "currency"> | null | undefined,
): SubscriptionPlanId | null {
  if (!billing) {
    return null;
  }

  const providerPlanId = typeof billing.providerPlanId === "string" ? billing.providerPlanId : null;
  if (providerPlanId && matchesPlusPlan(providerPlanId)) {
    return "plus";
  }

  const normalizedPrice = normalizePrice(billing.priceCents);
  if (normalizedPrice !== null) {
    const currency = (billing.currency ?? "USD").toUpperCase();
    const mapped = PRICE_TO_PLAN_ID.get(`${currency}:${normalizedPrice}`);
    if (mapped) {
      return mapped;
    }
  }

  return null;
}

function matchesPlusPlan(planId: string) {
  const normalized = planId.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (plusPlanCandidates.has(normalized)) {
    return true;
  }
  return normalized.includes("plus");
}

function normalizePrice(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  if (value <= 0) {
    return null;
  }
  if (value < 100 && Number.isInteger(value)) {
    return value * 100;
  }
  return Math.round(value);
}

function buildCandidateSet(...values: Array<string | undefined>) {
  const entries = values
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  // Default heuristics even if env vars are missing.
  entries.push("plus", "plus-monthly");

  return new Set(entries);
}

function buildPriceIndex() {
  const index = new Map<string, SubscriptionPlanId>();
  for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
    if (typeof plan.priceInCents !== "number" || !plan.priceInCents) {
      continue;
    }
    index.set(`${plan.currency}:${plan.priceInCents}`, plan.id);
  }
  return index;
}
