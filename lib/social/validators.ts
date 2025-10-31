import { z } from "zod";

import type { SocialAttachmentType, SocialVisibility } from "./types";
import { MAX_COMMENT_LENGTH, MAX_POST_LENGTH } from "./types";

const visibilityValues: readonly SocialVisibility[] = ["public", "workspace", "private"] as const;
const attachmentTypes: readonly SocialAttachmentType[] = ["document", "image", "link"] as const;

export const socialAttachmentSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(attachmentTypes),
  url: z.string().url(),
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(240).optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Say something to post.")
    .max(MAX_POST_LENGTH, `Posts can not exceed ${MAX_POST_LENGTH} characters.`),
  attachments: z.array(socialAttachmentSchema).max(4).optional(),
  tags: z
    .array(z.string().trim().min(1).max(32))
    .max(8)
    .optional()
    .default([]),
  visibility: z.enum(visibilityValues).optional().default("workspace"),
  channelId: z.string().min(1).optional(),
});

export const updatePostSchema = createPostSchema.extend({
  postId: z.string().min(1),
});

export const postIdSchema = z.object({
  postId: z.string().min(1),
});

export const toggleLikeSchema = z.object({
  postId: z.string().min(1),
});

export const addCommentSchema = z.object({
  postId: z.string().min(1),
  content: z
    .string()
    .trim()
    .min(1, "Comments can not be empty.")
    .max(MAX_COMMENT_LENGTH, `Comments can not exceed ${MAX_COMMENT_LENGTH} characters.`),
});

export const removeCommentSchema = z.object({
  postId: z.string().min(1),
  commentId: z.string().min(1),
});

export const followSchema = z.object({
  targetUserId: z.string().min(1),
  targetName: z.string().optional(),
  targetAvatarUrl: z.string().url().optional(),
});

export const createChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Channel names must be at least 3 characters.")
    .max(60, "Channel names must be 60 characters or less."),
  description: z
    .string()
    .trim()
    .max(240, "Descriptions should be 240 characters or less.")
    .optional(),
  type: z.enum(["topic", "project"]),
});

export const channelMembershipSchema = z.object({
  action: z.enum(["join", "leave", "toggle"]).optional().default("toggle"),
});
