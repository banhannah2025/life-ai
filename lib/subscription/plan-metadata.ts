import type { SubscriptionPlanId } from "@/lib/subscription/types";

const VALID_PLAN_IDS = new Set<SubscriptionPlanId>(["free", "plus"]);

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

  if (normalized.includes("plus")) {
    return "plus";
  }
  if (normalized.includes("community") || normalized.includes("free")) {
    return "free";
  }
  return null;
}
