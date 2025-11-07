"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { DEFAULT_USER_PROFILE, type UserProfile } from "@/lib/profile/schema";
import type { UserBillingProfile } from "@/lib/subscription/types";
import { buildProfileSearchKeywords } from "@/lib/search/keywords";

import { firestore } from "./client-app";

const defaultProfile: UserProfile = {
  ...DEFAULT_USER_PROFILE,
};

const COLLECTION = "profiles";

function normalizeDateValue(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "object" && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function normalizeBilling(billing: unknown): UserBillingProfile | null {
  if (!billing || typeof billing !== "object") {
    return null;
  }

  const candidate = billing as Partial<UserBillingProfile> & {
    renewsAt?: unknown;
    cancelAt?: unknown;
    updatedAt?: unknown;
  };

  const provider = typeof candidate.provider === "string" ? candidate.provider : null;
  if (!provider) {
    return null;
  }

  return {
    provider,
    subscriptionId: typeof candidate.subscriptionId === "string" ? candidate.subscriptionId : null,
    providerPlanId: typeof candidate.providerPlanId === "string" ? candidate.providerPlanId : null,
    status: typeof candidate.status === "string" ? candidate.status : "unknown",
    priceCents: typeof candidate.priceCents === "number" ? candidate.priceCents : null,
    currency: typeof candidate.currency === "string" ? candidate.currency : "USD",
    renewsAt: normalizeDateValue(candidate.renewsAt),
    cancelAt: normalizeDateValue(candidate.cancelAt),
    updatedAt: normalizeDateValue(candidate.updatedAt),
  };
}

export async function getUserProfile(userId: string) {
  const profileRef = doc(firestore(), COLLECTION, userId);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return defaultProfile;
  }

  const data = snapshot.data() as UserProfile & {
    updatedAt?: { toDate?: () => Date } | Date | null;
    billing?: unknown;
  };
  const normalizedUpdatedAt = normalizeDateValue(data.updatedAt);

  return {
    ...defaultProfile,
    ...data,
    updatedAt: normalizedUpdatedAt,
    billing: normalizeBilling(data.billing),
  } satisfies UserProfile;
}

export async function saveUserProfile(userId: string, profile: UserProfile) {
  const profileRef = doc(firestore(), COLLECTION, userId);
  const searchKeywords = buildProfileSearchKeywords(profile);

  await setDoc(
    profileRef,
    {
      ...profile,
      searchKeywords,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export type { UserProfile };
