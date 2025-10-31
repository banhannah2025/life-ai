import type { CollectionReference, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { UserSummary } from "@/lib/social/types";
import { resolveUserSummary } from "@/lib/social/server/user-summary";

import type { DirectMessage, DirectMessageRecord } from "./types";

const MESSAGES_COLLECTION = "direct_messages";

function messagesCollection() {
    return getAdminFirestore().collection(MESSAGES_COLLECTION) as CollectionReference<DirectMessageRecord>;
}

function toDirectMessage(
    snapshot: QueryDocumentSnapshot<DirectMessageRecord> | DocumentSnapshot<DirectMessageRecord>
): DirectMessage {
    const data = snapshot.data();
    if (!data) {
        throw new Error("Missing direct message data");
    }

    return {
        id: snapshot.id,
        sender: {
            id: data.senderId,
            name: data.senderName,
            avatarUrl: data.senderAvatarUrl,
        },
        recipient: {
            id: data.recipientId,
            name: data.recipientName,
            avatarUrl: data.recipientAvatarUrl,
        },
        content: data.content,
        createdAt: data.createdAt.toDate(),
    };
}

export async function sendDirectMessage({
    sender,
    recipientId,
    content,
}: {
    sender: UserSummary;
    recipientId: string;
    content: string;
}): Promise<DirectMessage> {
    if (sender.id === recipientId) {
        throw new Error("You cannot send a message to yourself.");
    }

    const recipient = await resolveUserSummary(recipientId);
    const docRef = messagesCollection().doc();

    await docRef.set({
        senderId: sender.id,
        senderName: sender.name,
        ...(sender.avatarUrl ? { senderAvatarUrl: sender.avatarUrl } : {}),
        recipientId: recipient.id,
        recipientName: recipient.name,
        ...(recipient.avatarUrl ? { recipientAvatarUrl: recipient.avatarUrl } : {}),
        content,
        createdAt: FieldValue.serverTimestamp(),
    });

    const snapshot = (await docRef.get()) as DocumentSnapshot<DirectMessageRecord>;
    if (!snapshot.exists) {
        throw new Error("Failed to send message.");
    }

    return toDirectMessage(snapshot);
}

export async function listDirectMessages({
    userId,
    limit = 50,
}: {
    userId: string;
    limit?: number;
}): Promise<DirectMessage[]> {
    const cappedLimit = Math.max(1, Math.min(limit, 100));
    const queryLimit = Math.min(cappedLimit * 2, 200);

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
        messagesCollection().where("senderId", "==", userId).orderBy("createdAt", "desc").limit(queryLimit).get(),
        messagesCollection().where("recipientId", "==", userId).orderBy("createdAt", "desc").limit(queryLimit).get(),
    ]);

    const seen = new Map<string, DirectMessage>();

    for (const doc of sentSnapshot.docs) {
        seen.set(doc.id, toDirectMessage(doc));
    }

    for (const doc of receivedSnapshot.docs) {
        if (!seen.has(doc.id)) {
            seen.set(doc.id, toDirectMessage(doc));
        }
    }

    const messages = Array.from(seen.values());
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return messages.slice(0, cappedLimit);
}

export function serializeDirectMessage(message: DirectMessage) {
    return {
        id: message.id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
    };
}
