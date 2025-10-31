"use client";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { DEFAULT_USER_PROFILE, type UserProfile } from "@/lib/profile/schema";
import { buildProfileSearchKeywords } from "@/lib/search/keywords";

import { firestore } from "./client-app";

const defaultProfile: UserProfile = {
  ...DEFAULT_USER_PROFILE,
};

const COLLECTION = "profiles";

export async function getUserProfile(userId: string) {
  const profileRef = doc(firestore(), COLLECTION, userId);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return defaultProfile;
  }

  const data = snapshot.data() as UserProfile & { updatedAt?: { toDate?: () => Date } };
  return {
    ...defaultProfile,
    ...data,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt ?? null,
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
