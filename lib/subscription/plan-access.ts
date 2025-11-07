import "server-only";

import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { getPlan } from "@/lib/subscription/plans";
import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { resolveUserPlanId } from "@/lib/subscription/server";

export type LoadedUserPlan = {
  planId: SubscriptionPlanId;
  plan: SubscriptionPlan;
};

export async function loadUserPlan(userId: string): Promise<LoadedUserPlan> {
  if (!userId) {
    throw new Error("Cannot load subscription plan without a user id.");
  }

  const planId = await resolveUserPlanId(userId);
  return {
    planId,
    plan: getPlan(planId),
  };
}
