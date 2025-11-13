import type { UserProfile } from "@/lib/profile/schema";
import type { SubscriptionPlanId } from "@/lib/subscription/types";

const VALID_PLAN_IDS: SubscriptionPlanId[] = ["free", "plus", "legal_team", "enterprise"];

const plusPlanCandidates = buildCandidateSet(
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_IDS,
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID,
);

export function inferProfilePlanId(profile: Pick<UserProfile, "planId" | "billing"> | null | undefined): SubscriptionPlanId {
  if (profile?.planId && isValidPlan(profile.planId)) {
    return profile.planId;
  }

  const providerPlanId = typeof profile?.billing?.providerPlanId === "string" ? profile.billing.providerPlanId : null;
  if (providerPlanId && matchesPlusPlan(providerPlanId)) {
    return "plus";
  }

  return "free";
}

function isValidPlan(value: unknown): value is SubscriptionPlanId {
  return typeof value === "string" && (VALID_PLAN_IDS as string[]).includes(value);
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

function buildCandidateSet(...values: Array<string | undefined>) {
  const entries = values
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  // Default heuristics for common plan IDs even if env vars are missing.
  entries.push("plus", "plus-monthly");

  return new Set(entries);
}
