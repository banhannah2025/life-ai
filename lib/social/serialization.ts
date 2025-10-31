import type { SocialChannelWithMembership, SocialComment, SocialPost } from "./types";

export function serializePost(post: SocialPost) {
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function serializeComment(comment: SocialComment) {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export function serializeChannel(channel: SocialChannelWithMembership) {
  return {
    ...channel,
    createdAt: channel.createdAt.toISOString(),
    updatedAt: channel.updatedAt.toISOString(),
  };
}
