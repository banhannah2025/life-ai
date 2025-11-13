"use server";

import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { DEFAULT_SUBSCRIPTION_PLAN_ID } from "@/lib/subscription/types";
import { UsageLimitReachedError } from "@/lib/subscription/errors";
import { mapClerkPlanToSubscription } from "@/lib/subscription/clerk";

const PROFILE_COLLECTION = "profiles";
const USAGE_COLLECTION = "subscription_usage";

type ProfileDoc = {
  planId?: SubscriptionPlanId | null;
  planActivatedAt?: { toDate?: () => Date } | Date | null;
  billing?: {
    providerPlanId?: string | null;
  } | null;
};

type UsageCounters = Partial<Record<string, number>> & {
  total?: number;
  previousDate?: string;
};

type UsageDoc = {
  date: string;
  total: number;
  counters: Record<string, number>;
  updatedAt: Date | { toDate: () => Date };
};

export async function resolveUserPlanId(userId: string): Promise<SubscriptionPlanId> {
  if (!userId) {
    return DEFAULT_SUBSCRIPTION_PLAN_ID;
  }

  const snapshot = await getAdminFirestore().collection(PROFILE_COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    await persistUserPlan(userId, DEFAULT_SUBSCRIPTION_PLAN_ID);
    return DEFAULT_SUBSCRIPTION_PLAN_ID;
  }
  const data = snapshot.data() as ProfileDoc | undefined;
  if (!data) {
    await persistUserPlan(userId, DEFAULT_SUBSCRIPTION_PLAN_ID);
    return DEFAULT_SUBSCRIPTION_PLAN_ID;
  }

  const planId = typeof data.planId === "string" ? (data.planId as SubscriptionPlanId) : null;
  if (planId) {
    return planId;
  }

  const providerPlanId = typeof data.billing?.providerPlanId === "string" ? data.billing.providerPlanId : null;
  const mappedBillingPlan = providerPlanId ? mapClerkPlanToSubscription(providerPlanId) : null;
  if (mappedBillingPlan) {
    await persistUserPlan(userId, mappedBillingPlan);
    return mappedBillingPlan;
  }

  await persistUserPlan(userId, DEFAULT_SUBSCRIPTION_PLAN_ID);
  return DEFAULT_SUBSCRIPTION_PLAN_ID;
}

export async function persistUserPlan(userId: string, planId: SubscriptionPlanId) {
  if (!userId) {
    throw new Error("Cannot persist plan without user id.");
  }

  await getAdminFirestore()
    .collection(PROFILE_COLLECTION)
    .doc(userId)
    .set(
      {
        planId,
        planActivatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function readUsageSnapshot(userId: string): Promise<UsageDoc | null> {
  if (!userId) {
    return null;
  }
  const snapshot = await getAdminFirestore().collection(USAGE_COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data() as UsageDoc | undefined;
  if (!data) {
    return null;
  }
  const date = typeof data.date === "string" ? data.date : "";
  const total = typeof data.total === "number" ? data.total : 0;
  const counters = typeof data.counters === "object" && data.counters ? data.counters : {};
  return {
    date,
    total,
    counters,
    updatedAt: data.updatedAt && "toDate" in data.updatedAt ? data.updatedAt.toDate() : new Date(),
  };
}

export async function resetUsageForDate(userId: string, date: string) {
  await getAdminFirestore()
    .collection(USAGE_COLLECTION)
    .doc(userId)
    .set(
      {
        date,
        total: 0,
        counters: {},
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export type UsageIncrementOptions = {
  userId: string;
  date: string;
  category: string;
  limit: number | null;
};

export async function incrementUsageCounter({ userId, date, category, limit }: UsageIncrementOptions) {
  if (!userId) {
    throw new Error("Cannot increment usage without user id.");
  }

  const docRef = getAdminFirestore().collection(USAGE_COLLECTION).doc(userId);

  await getAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);
    const existing = snapshot.exists ? (snapshot.data() as UsageDoc) : null;

    let counters: UsageCounters = existing?.counters ? { ...existing.counters } : {};
    let total = typeof existing?.total === "number" ? existing.total : 0;
    const currentDate = typeof existing?.date === "string" ? existing.date : null;

    if (currentDate !== date) {
      counters = {};
      total = 0;
    }

    const nextTotal = total + 1;
    const nextCategoryCount = (typeof counters[category] === "number" ? counters[category]! : 0) + 1;

    if (typeof limit === "number" && limit >= 0 && nextTotal > limit) {
      throw new UsageLimitReachedError(limit);
    }

    transaction.set(
      docRef,
      {
        date,
        total: nextTotal,
        counters: {
          ...counters,
          [category]: nextCategoryCount,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}
