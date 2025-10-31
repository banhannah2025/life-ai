import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";

import type { UserSummary } from "../types";

const FOLLOWS_COLLECTION = "social_follows";

function relationshipsCollection() {
  return getAdminFirestore().collection(FOLLOWS_COLLECTION);
}

function followDocumentId(followerId: string, followingId: string) {
  return `${followerId}:${followingId}`;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const docId = followDocumentId(followerId, followingId);
  const snapshot = await relationshipsCollection().doc(docId).get();
  return snapshot.exists;
}

export async function followUser({
  follower,
  target,
}: {
  follower: UserSummary;
  target: UserSummary;
}): Promise<void> {
  const docId = followDocumentId(follower.id, target.id);
  await relationshipsCollection()
    .doc(docId)
    .set({
      followerId: follower.id,
      followerName: follower.name,
      followerAvatarUrl: follower.avatarUrl ?? null,
      followingId: target.id,
      followingName: target.name,
      followingAvatarUrl: target.avatarUrl ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const docId = followDocumentId(followerId, followingId);
  await relationshipsCollection().doc(docId).delete();
}

export async function toggleFollow({
  follower,
  target,
}: {
  follower: UserSummary;
  target: UserSummary;
}): Promise<{ following: boolean }> {
  const docRef = relationshipsCollection().doc(followDocumentId(follower.id, target.id));

  return getAdminFirestore().runTransaction(async (tx) => {
    const snapshot = await tx.get(docRef);
    if (snapshot.exists) {
      tx.delete(docRef);
      return { following: false };
    }

    tx.set(docRef, {
      followerId: follower.id,
      followerName: follower.name,
      followerAvatarUrl: follower.avatarUrl ?? null,
      followingId: target.id,
      followingName: target.name,
      followingAvatarUrl: target.avatarUrl ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { following: true };
  });
}

export async function listFollowing(userId: string): Promise<UserSummary[]> {
  const snapshot = await relationshipsCollection().where("followerId", "==", userId).limit(200).get();
  if (!snapshot.size) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.followingId as string,
      name: (data.followingName as string) ?? "Life-AI member",
      avatarUrl: (data.followingAvatarUrl as string | null) ?? undefined,
    };
  });
}

export async function listFollowers(userId: string): Promise<UserSummary[]> {
  const snapshot = await relationshipsCollection().where("followingId", "==", userId).limit(200).get();
  if (!snapshot.size) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.followerId as string,
      name: (data.followerName as string) ?? "Life-AI member",
      avatarUrl: (data.followerAvatarUrl as string | null) ?? undefined,
    };
  });
}
