import { clerkClient } from "@clerk/nextjs/server";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { DEFAULT_USER_PROFILE, type UserProfile } from "@/lib/profile/schema";
import { isAdminEmail } from "./config";

type TimestampLike = {
  toDate: () => Date;
};

function isTimestampLike(value: unknown): value is TimestampLike {
  return Boolean(
    value &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function",
  );
}

export type AdminDirectoryUser = {
  id: string;
  name: string;
  email: string | null;
  otherEmails: string[];
  profile: UserProfile;
  followerCount: number;
  followingCount: number;
  postCount: number;
  createdAt: Date | null;
  lastActiveAt: Date | null;
  isAdmin: boolean;
};

export async function fetchAdminUserDirectory(): Promise<AdminDirectoryUser[]> {
  const firestore = getAdminFirestore();

  const [profileSnapshot, followSnapshot, postSnapshot] = await Promise.all([
    firestore.collection("profiles").get(),
    firestore.collection("social_follows").get(),
    firestore.collection("social_posts").get(),
  ]);

  const profileMap = new Map<string, UserProfile>();
  profileSnapshot.forEach((doc) => {
    const data = doc.data() as UserProfile & { updatedAt?: TimestampLike | Date | null };
    const updatedAtValue = data.updatedAt;

    const profile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      ...data,
      updatedAt: isTimestampLike(updatedAtValue) ? updatedAtValue.toDate() : updatedAtValue ?? null,
    };
    profileMap.set(doc.id, profile);
  });

  const followerCounts = new Map<string, number>();
  const followingCounts = new Map<string, number>();

  followSnapshot.forEach((doc) => {
    const data = doc.data() as {
      followerId: string;
      followingId: string;
    };
    followerCounts.set(data.followingId, (followerCounts.get(data.followingId) ?? 0) + 1);
    followingCounts.set(data.followerId, (followingCounts.get(data.followerId) ?? 0) + 1);
  });

  const postCounts = new Map<string, number>();
  postSnapshot.forEach((doc) => {
    const data = doc.data() as { authorId: string };
    postCounts.set(data.authorId, (postCounts.get(data.authorId) ?? 0) + 1);
  });

  const client = await clerkClient();
  const clerkUsers = await client.users.getUserList({ limit: 200 });

  const users: AdminDirectoryUser[] = clerkUsers.data.map((user) => {
    const profile = profileMap.get(user.id) ?? DEFAULT_USER_PROFILE;
    const primaryEmail = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress ?? null;
    const otherEmails = user.emailAddresses
      .filter((address) => address.emailAddress && address.emailAddress !== primaryEmail)
      .map((address) => address.emailAddress as string);

    const createdAt = user.createdAt ? new Date(user.createdAt) : null;
    const lastActiveAt = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const fallbackName = `${profile.firstName} ${profile.lastName}`.trim() || primaryEmail || "Life-AI member";

    return {
      id: user.id,
      name: user.fullName ?? fallbackName,
      email: primaryEmail,
      otherEmails,
      profile,
      followerCount: followerCounts.get(user.id) ?? 0,
      followingCount: followingCounts.get(user.id) ?? 0,
      postCount: postCounts.get(user.id) ?? 0,
      createdAt,
      lastActiveAt,
      isAdmin: isAdminEmail(primaryEmail),
    };
  });

  profileMap.forEach((profile, userId) => {
    if (users.some((entry) => entry.id === userId)) {
      return;
    }

    users.push({
      id: userId,
      name: `${profile.firstName} ${profile.lastName}`.trim() || "Life-AI member",
      email: null,
      otherEmails: [],
      profile,
      followerCount: followerCounts.get(userId) ?? 0,
      followingCount: followingCounts.get(userId) ?? 0,
      postCount: postCounts.get(userId) ?? 0,
      createdAt: null,
      lastActiveAt: null,
      isAdmin: false,
    });
  });

  return users.sort((a, b) => {
    const aDate = a.createdAt?.getTime() ?? 0;
    const bDate = b.createdAt?.getTime() ?? 0;
    return bDate - aDate;
  });
}
