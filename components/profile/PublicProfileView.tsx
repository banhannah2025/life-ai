"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchRelationships, type SocialPostDTO } from "@/lib/social/client";
import { FriendshipButton } from "@/components/social/FriendshipButton";
import { PostList } from "@/components/social/PostList";

type PublicProfileData = {
  id: string;
  fullName: string;
  headline?: string;
  summary?: string;
  location?: string;
  company?: string;
  role?: string;
  skills?: string[];
  avatarUrl?: string;
  website?: string;
};

type PublicProfileViewProps = {
  profile: PublicProfileData;
  viewerId: string | null;
  initialPosts: SocialPostDTO[];
  showPosts?: boolean;
};

export function PublicProfileView({ profile, viewerId, initialPosts, showPosts = true }: PublicProfileViewProps) {
  const [posts, setPosts] = useState<SocialPostDTO[]>(initialPosts);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());

  const isSelf = viewerId === profile.id;

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    let ignore = false;

    async function loadRelationships() {
      try {
        const relationships = await fetchRelationships();
        if (ignore) {
          return;
        }
        setFollowingIds(new Set(relationships.following.map((user) => user.id)));
        setFollowerIds(new Set(relationships.followers.map((user) => user.id)));
      } catch (error) {
        console.error("Failed to load relationships", error);
      }
    }

    loadRelationships();

    return () => {
      ignore = true;
    };
  }, [viewerId]);

  const relationshipStatus = useMemo(() => {
    if (!viewerId || viewerId === profile.id) {
      return null;
    }
    const isFollowing = followingIds.has(profile.id);
    const isFollower = followerIds.has(profile.id);
    if (isFollowing && isFollower) {
      return "friends";
    }
    if (isFollowing) {
      return "outgoing";
    }
    if (isFollower) {
      return "incoming";
    }
    return "none";
  }, [viewerId, profile.id, followingIds, followerIds]);

  function handlePostUpdated(postId: string, updates: Partial<SocialPostDTO>) {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...updates } : post)));
  }

  function handleRelationshipChange(authorId: string, following: boolean) {
    if (!viewerId) {
      return;
    }
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (following) {
        next.add(authorId);
      } else {
        next.delete(authorId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={`${profile.fullName} avatar`} fill className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-slate-500">
                  {profile.fullName
                    .split(" ")
                    .map((segment) => segment[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "LA"}
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{profile.fullName}</h1>
                {profile.headline ? <p className="text-base text-slate-600">{profile.headline}</p> : null}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                {profile.company ? <span>{profile.company}</span> : null}
                {profile.role ? <span>• {profile.role}</span> : null}
                {profile.location ? <span>• {profile.location}</span> : null}
              </div>
              {profile.website ? (
                <a className="text-sm font-medium text-blue-600 hover:underline" href={profile.website} target="_blank" rel="noreferrer">
                  {profile.website}
                </a>
              ) : null}
            </div>
          </div>
          {relationshipStatus && !isSelf ? (
            <FriendshipButton
              targetId={profile.id}
              targetName={profile.fullName}
              targetAvatarUrl={profile.avatarUrl}
              status={relationshipStatus}
              isFollower={followerIds.has(profile.id)}
              onStatusChange={(_status, following) => handleRelationshipChange(profile.id, following)}
            />
          ) : null}
        </CardHeader>
        {profile.summary ? (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="text-sm leading-6 text-slate-600 whitespace-pre-line">{profile.summary}</p>
            </div>
            {(profile.skills?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      {showPosts ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent posts</h2>
            <span className="text-sm text-slate-500">{posts.length} post{posts.length === 1 ? "" : "s"}</span>
          </div>
          <PostList
            posts={posts}
            followingIds={followingIds}
            followerIds={followerIds}
            onPostUpdated={handlePostUpdated}
            onRelationshipChange={handleRelationshipChange}
          />
        </section>
      ) : null}
    </div>
  );
}
