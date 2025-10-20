import { clerkClient } from "@clerk/nextjs/server";

import { getAdminFirestore } from "@/lib/firebase/admin";

import type { UserSummary } from "../types";

const PROFILE_COLLECTION = "profiles";

type ProfileRecord = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export async function resolveUserSummary(userId: string): Promise<UserSummary> {
  const client = await clerkClient();
  const [clerkUser, profileSnapshot] = await Promise.all([
    client.users.getUser(userId).catch(() => null),
    getAdminFirestore().collection(PROFILE_COLLECTION).doc(userId).get(),
  ]);

  const profile = profileSnapshot.exists ? (profileSnapshot.data() as ProfileRecord) : null;

  const firstName = profile?.firstName ?? clerkUser?.firstName ?? "";
  const lastName = profile?.lastName ?? clerkUser?.lastName ?? "";
  const nameFromProfile = `${firstName} ${lastName}`.trim();

  const name =
    nameFromProfile ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "Life-AI member";

  const avatarUrl = profile?.avatarUrl ?? clerkUser?.imageUrl ?? undefined;

  return {
    id: userId,
    name,
    avatarUrl: avatarUrl || undefined,
  };
}
