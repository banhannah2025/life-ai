import type { Timestamp } from "firebase-admin/firestore";

export type SocialVisibility = "public" | "workspace" | "private";
export type SocialChannelType = "topic" | "project";

export type SocialAttachmentType = "document" | "image" | "link";

export type SocialAttachment = {
  id: string;
  type: SocialAttachmentType;
  url: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
};

export type UserSummary = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type SocialPostRecord = {
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  attachments?: SocialAttachment[];
  tags?: string[];
  visibility: SocialVisibility;
  channelId?: string;
  channelName?: string;
  channelType?: SocialChannelType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likeCount: number;
  commentCount: number;
  recentLikerIds?: string[];
  recentCommenterIds?: string[];
  searchTerms?: string[];
};

export type SocialCommentRecord = {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type SocialPost = {
  id: string;
  author: UserSummary;
  content: string;
  attachments: SocialAttachment[];
  tags: string[];
  visibility: SocialVisibility;
  channelId?: string;
  channelName?: string;
  channelType?: SocialChannelType;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  commentCount: number;
  recentLikerIds: string[];
  recentCommenterIds: string[];
  viewerHasLiked?: boolean;
};

export type SocialComment = {
  id: string;
  postId: string;
  author: UserSummary;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  viewerCanEdit: boolean;
};

export type FollowRelationship = {
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
};

export type SocialChannelRecord = {
  name: string;
  slug: string;
  type: SocialChannelType;
  description?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  memberCount: number;
  isDefault?: boolean;
};

export type SocialChannel = {
  id: string;
  name: string;
  slug: string;
  type: SocialChannelType;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  isDefault?: boolean;
};

export type SocialChannelWithMembership = SocialChannel & {
  isMember: boolean;
};

export type SocialChannelMembershipRecord = {
  channelId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  joinedAt: Timestamp;
};

export const MAX_POST_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 600;
