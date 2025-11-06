import "server-only";

import { formatISO9075 } from "date-fns";

import { getPlan } from "@/lib/subscription/plans";
import type { SubscriptionPlanId, SubscriptionUsageCategory } from "@/lib/subscription/types";
import { resolveUserPlanId, incrementUsageCounter } from "@/lib/subscription/server";
import { UsageLimitReachedError } from "@/lib/subscription/errors";

export type UsageEnforcementResult = {
  planId: SubscriptionPlanId;
  limit: number | null;
};

function formatDateForKey(date: Date): string {
  // Format as YYYY-MM-DD in UTC for consistent rollovers.
  return formatISO9075(date, { representation: "date" });
}

export async function enforceAiDailyLimit(userId: string, category: SubscriptionUsageCategory): Promise<UsageEnforcementResult> {
  const planId = await resolveUserPlanId(userId);
  const plan = getPlan(planId);
  const limit = plan.aiDailyLimit ?? null;

  await incrementUsageCounter({
    userId,
    date: formatDateForKey(new Date()),
    category,
    limit,
  });

  return { planId: plan.id, limit };
}

export { UsageLimitReachedError };
