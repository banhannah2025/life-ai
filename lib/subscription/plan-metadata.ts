import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { mapClerkPlanToSubscription } from "@/lib/subscription/clerk";

const VALID_PLAN_IDS = new Set<SubscriptionPlanId>(["free", "plus", "legal_team", "enterprise"]);
const VALID_PLAN_ID_LIST: SubscriptionPlanId[] = ["free", "plus", "legal_team", "enterprise"];

export function extractPlanIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const candidate =
    (record.planId as string | null | undefined) ??
    (record.plan_id as string | null | undefined) ??
    (record.plan as string | null | undefined) ??
    null;

  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

export function normalizePlanId(planId: string | null | undefined): SubscriptionPlanId | null {
  if (!planId) {
    return null;
  }

  const normalized = planId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (VALID_PLAN_IDS.has(normalized as SubscriptionPlanId)) {
    return normalized as SubscriptionPlanId;
  }

  const mapped = mapClerkPlanToSubscription(planId) ?? mapClerkPlanToSubscription(normalized);
  if (mapped && VALID_PLAN_ID_LIST.includes(mapped)) {
    return mapped;
  }

  return null;
}
