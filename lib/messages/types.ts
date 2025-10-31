import type { Timestamp } from "firebase-admin/firestore";

import type { UserSummary } from "@/lib/social/types";

export type DirectMessageRecord = {
    senderId: string;
    senderName: string;
    senderAvatarUrl?: string;
    recipientId: string;
    recipientName: string;
    recipientAvatarUrl?: string;
    content: string;
    createdAt: Timestamp;
};

export type DirectMessage = {
    id: string;
    sender: UserSummary;
    recipient: UserSummary;
    content: string;
    createdAt: Date;
};
