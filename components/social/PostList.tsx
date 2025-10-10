"use client";

import { useMemo } from "react";

import type { SocialPostDTO } from "@/lib/social/client";
import { PostCard } from "./PostCard";

type PostListProps = {
  posts: SocialPostDTO[];
  followingIds?: Set<string>;
  followerIds?: Set<string>;
  onPostUpdated?: (postId: string, updates: Partial<SocialPostDTO>) => void;
  onRelationshipChange?: (authorId: string, following: boolean) => void;
};

export type FriendRelationshipStatus = "friends" | "outgoing" | "incoming" | "none";

export function PostList({ posts, followingIds, followerIds, onPostUpdated, onRelationshipChange }: PostListProps) {
  const following = useMemo(() => followingIds ?? new Set<string>(), [followingIds]);
  const followers = useMemo(() => followerIds ?? new Set<string>(), [followerIds]);

  if (!posts.length) {
    return <p className="text-sm text-slate-500">No posts yet. Be the first to start the conversation.</p>;
  }

  function relationshipStatus(authorId: string): FriendRelationshipStatus {
    const viewerFollowsAuthor = following.has(authorId);
    const authorFollowsViewer = followers.has(authorId);
    if (viewerFollowsAuthor && authorFollowsViewer) {
      return "friends";
    }
    if (viewerFollowsAuthor) {
      return "outgoing";
    }
    if (authorFollowsViewer) {
      return "incoming";
    }
    return "none";
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          relationshipStatus={relationshipStatus(post.author.id)}
          authorIsFollower={followers.has(post.author.id)}
          onPostUpdated={onPostUpdated}
          onRelationshipChange={onRelationshipChange}
        />
      ))}
    </div>
  );
}
