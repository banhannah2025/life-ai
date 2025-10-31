import type { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { extractSearchTokens } from "@/lib/search/keywords";

import type {
  SocialChannel,
  SocialChannelRecord,
  SocialChannelType,
  SocialChannelWithMembership,
  UserSummary,
} from "../types";

const CHANNELS_COLLECTION = "social_channels";
const CHANNEL_MEMBERS_COLLECTION = "social_channel_members";

function channelsCollection() {
  return getAdminFirestore().collection(CHANNELS_COLLECTION);
}

function channelMembersCollection() {
  return getAdminFirestore().collection(CHANNEL_MEMBERS_COLLECTION);
}

function sanitizeSlugCandidate(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toChannel(snapshot: QueryDocumentSnapshot | DocumentSnapshot): SocialChannel {
  const data = snapshot.data() as SocialChannelRecord | undefined;

  if (!data) {
    throw new Error("Missing channel data");
  }

  return {
    id: snapshot.id,
    name: data.name,
    slug: data.slug,
    type: data.type,
    description: data.description,
    createdBy: data.createdBy,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    memberCount: data.memberCount,
    isDefault: data.isDefault,
  };
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = sanitizeSlugCandidate(name) || `channel-${Math.random().toString(36).slice(2, 6)}`;
  let candidate = base;
  let attempts = 0;

  while (attempts < 5) {
    const existing = await channelsCollection().where("slug", "==", candidate).limit(1).get();
    if (existing.empty) {
      return candidate;
    }
    attempts += 1;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return `${base}-${Date.now()}`;
}

export async function listChannels(viewerId?: string | null): Promise<SocialChannelWithMembership[]> {
  const snapshot = await channelsCollection().orderBy("name", "asc").limit(100).get();

  if (!snapshot.size) {
    return [];
  }

  let membershipIds = new Set<string>();

  if (viewerId) {
    const memberships = await channelMembersCollection().where("userId", "==", viewerId).get();
    membershipIds = new Set(memberships.docs.map((doc) => (doc.data().channelId as string) ?? doc.id.split(":")[0]));
  }

  return snapshot.docs.map((doc) => {
    const channel = toChannel(doc);
    return {
      ...channel,
      isMember: membershipIds.has(channel.id),
    };
  });
}

export async function searchChannels({
  query,
  limit = 25,
  viewerId,
}: {
  query: string;
  limit?: number;
  viewerId?: string | null;
}): Promise<SocialChannelWithMembership[]> {
  const tokens = extractSearchTokens(query).slice(0, 5);
  if (!tokens.length) {
    return [];
  }

  const snapshot = await channelsCollection().limit(200).get();
  if (!snapshot.size) {
    return [];
  }

  let membershipIds = new Set<string>();
  if (viewerId) {
    const memberships = await channelMembersCollection().where("userId", "==", viewerId).get();
    membershipIds = new Set(memberships.docs.map((doc) => (doc.data().channelId as string) ?? doc.id.split(":")[0]));
  }

  const normalizedTokens = tokens.map((token) => token.toLowerCase());

  const matches = snapshot.docs
    .map((doc) => toChannel(doc))
    .filter((channel) => {
      const haystack = [channel.name, channel.description ?? ""].join(" ").toLowerCase();
      return normalizedTokens.every((token) => haystack.includes(token));
    })
    .slice(0, limit);

  return matches.map((channel) => ({
    ...channel,
    isMember: membershipIds.has(channel.id),
  }));
}

type CreateChannelInput = {
  creator: UserSummary;
  name: string;
  type: SocialChannelType;
  description?: string;
};

export async function createChannel({ creator, name, type, description }: CreateChannelInput): Promise<SocialChannelWithMembership> {
  const slug = await generateUniqueSlug(name);
  const channelRef = channelsCollection().doc();
  const membershipRef = channelMembersCollection().doc(`${channelRef.id}:${creator.id}`);

  const now = FieldValue.serverTimestamp();

  await getAdminFirestore().runTransaction(async (tx) => {
    tx.set(channelRef, {
      name,
      slug,
      type,
      description: description ?? null,
      createdBy: creator.id,
      createdAt: now,
      updatedAt: now,
      memberCount: 1,
      isDefault: false,
    });

    tx.set(membershipRef, {
      channelId: channelRef.id,
      userId: creator.id,
      userName: creator.name,
      userAvatarUrl: creator.avatarUrl ?? null,
      joinedAt: now,
    });
  });

  const snapshot = await channelRef.get();
  if (!snapshot.exists) {
    throw new Error("Failed to create channel");
  }

  return {
    ...toChannel(snapshot),
    isMember: true,
  };
}

export async function getChannel(channelId: string): Promise<SocialChannel | null> {
  const snapshot = await channelsCollection().doc(channelId).get();
  if (!snapshot.exists) {
    return null;
  }
  return toChannel(snapshot);
}

export async function assertChannelExists(channelId: string): Promise<SocialChannel> {
  const channel = await getChannel(channelId);
  if (!channel) {
    throw new Error("Channel not found");
  }
  return channel;
}

export async function isChannelMember(channelId: string, userId: string): Promise<boolean> {
  const membershipSnapshot = await channelMembersCollection().doc(`${channelId}:${userId}`).get();
  return membershipSnapshot.exists;
}

type UpdateMembershipInput = {
  channelId: string;
  member: UserSummary;
  action?: "join" | "leave" | "toggle";
};

export async function updateChannelMembership({
  channelId,
  member,
  action = "toggle",
}: UpdateMembershipInput): Promise<{ channel: SocialChannelWithMembership; isMember: boolean }> {
  const channelRef = channelsCollection().doc(channelId);
  const membershipRef = channelMembersCollection().doc(`${channelId}:${member.id}`);

  let nextIsMember = false;

  await getAdminFirestore().runTransaction(async (tx) => {
    const channelSnapshot = await tx.get(channelRef);
    if (!channelSnapshot.exists) {
      throw new Error("Channel not found");
    }

    const membershipSnapshot = await tx.get(membershipRef);
    const currentlyMember = membershipSnapshot.exists;

    if (action === "join") {
      if (currentlyMember) {
        nextIsMember = true;
        return;
      }
      tx.set(membershipRef, {
        channelId,
        userId: member.id,
        userName: member.name,
        userAvatarUrl: member.avatarUrl ?? null,
        joinedAt: FieldValue.serverTimestamp(),
      });
      tx.update(channelRef, {
        memberCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      nextIsMember = true;
      return;
    }

    if (action === "leave") {
      if (!currentlyMember) {
        nextIsMember = false;
        return;
      }
      tx.delete(membershipRef);
      tx.update(channelRef, {
        memberCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      nextIsMember = false;
      return;
    }

    // toggle
    if (currentlyMember) {
      tx.delete(membershipRef);
      tx.update(channelRef, {
        memberCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      nextIsMember = false;
    } else {
      tx.set(membershipRef, {
        channelId,
        userId: member.id,
        userName: member.name,
        userAvatarUrl: member.avatarUrl ?? null,
        joinedAt: FieldValue.serverTimestamp(),
      });
      tx.update(channelRef, {
        memberCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      nextIsMember = true;
    }
  });

  const refreshedSnapshot = await channelRef.get();
  if (!refreshedSnapshot.exists) {
    throw new Error("Failed to refresh channel");
  }

  return {
    channel: {
      ...toChannel(refreshedSnapshot),
      isMember: nextIsMember,
    },
    isMember: nextIsMember,
  };
}
