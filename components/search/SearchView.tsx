"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PostList } from "@/components/social/PostList";
import type { SocialPostDTO } from "@/lib/social/client";
import { fetchRelationships } from "@/lib/social/client";
import { searchDirectory, type ProfileSearchResult } from "@/lib/search/client";
import { FriendshipButton } from "@/components/social/FriendshipButton";
import type { FriendRelationshipStatus } from "@/components/social/PostList";

type SearchResultsState = {
  profiles: ProfileSearchResult[];
  posts: SocialPostDTO[];
};

const initialResults: SearchResultsState = {
  profiles: [],
  posts: [],
};

type SearchViewProps = {
  mode?: "all" | "profiles" | "posts";
  heading?: string;
  placeholder?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

type ProfileCardProps = {
  profile: ProfileSearchResult;
  viewerId?: string | null;
  relationshipStatus?: FriendRelationshipStatus | null;
  isFollower?: boolean;
  onRelationshipChange?: (userId: string, following: boolean) => void;
};

function ProfileResultCard({ profile, viewerId, relationshipStatus = null, isFollower = false, onRelationshipChange }: ProfileCardProps) {
  const initials = useMemo(() => getInitials(profile.fullName), [profile.fullName]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile.avatarUrl || undefined} />
            <AvatarFallback>{initials || "LA"}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">{profile.fullName}</h3>
            {profile.headline ? <p className="text-sm text-slate-600">{profile.headline}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {profile.role ? <Badge variant="outline">{profile.role}</Badge> : null}
              {profile.company ? <Badge variant="outline">{profile.company}</Badge> : null}
              {profile.location ? <span>{profile.location}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {viewerId && viewerId !== profile.id && relationshipStatus ? (
            <FriendshipButton
              targetId={profile.id}
              targetName={profile.fullName}
              targetAvatarUrl={profile.avatarUrl}
              status={relationshipStatus}
              isFollower={isFollower}
              onStatusChange={(_status, following) => onRelationshipChange?.(profile.id, following)}
            />
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/people/${profile.id}`}>View profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchView({ mode = "all", heading = "Search the community", placeholder = "Search for people, posts, or topics…" }: SearchViewProps) {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultsState>(initialResults);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ignore = false;

    async function bootstrapRelationships() {
      try {
        const relationshipData = await fetchRelationships();
        if (ignore) {
          return;
        }
        setFollowingIds(new Set(relationshipData.following.map((user) => user.id)));
        setFollowerIds(new Set(relationshipData.followers.map((user) => user.id)));
      } catch (relationshipError) {
        // Most likely unauthenticated; ignore silently.
        console.error(relationshipError);
      }
    }

    bootstrapRelationships();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setResults(initialResults);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await searchDirectory(query.trim(), mode);
      setResults({
        profiles: mode === "posts" ? [] : response.profiles,
        posts: mode === "profiles" ? [] : response.posts,
      });
    } catch (searchError) {
      console.error(searchError);
      setError(searchError instanceof Error ? searchError.message : "Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function handlePostUpdated(postId: string, updates: Partial<SocialPostDTO>) {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => (post.id === postId ? { ...post, ...updates } : post)),
    }));
  }

  function handleRelationshipChange(authorId: string, following: boolean) {
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

  function relationshipStatusFor(userId: string): FriendRelationshipStatus {
    const viewerFollows = followingIds.has(userId);
    const userFollowsViewer = followerIds.has(userId);
    if (viewerFollows && userFollowsViewer) {
      return "friends";
    }
    if (viewerFollows) {
      return "outgoing";
    }
    if (userFollowsViewer) {
      return "incoming";
    }
    return "none";
  }

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Search className="h-5 w-5 text-slate-500" />
            {heading}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </form>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!error && !isSearching && query && results.profiles.length === 0 && results.posts.length === 0 ? (
            <p className="text-sm text-slate-500">No matches found. Try adjusting your search terms.</p>
          ) : null}
        </CardContent>
      </Card>

      {mode !== "posts" && results.profiles.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">People</h2>
            <span className="text-sm text-slate-500">{results.profiles.length} result{results.profiles.length === 1 ? "" : "s"}</span>
          </div>
          <div className="space-y-4">
            {results.profiles.map((profile) => (
              <ProfileResultCard
                key={profile.id}
                profile={profile}
                viewerId={user?.id}
                relationshipStatus={user ? relationshipStatusFor(profile.id) : null}
                isFollower={followerIds.has(profile.id)}
                onRelationshipChange={handleRelationshipChange}
              />
            ))}
          </div>
        </section>
      ) : null}

      {mode !== "profiles" && results.posts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
            <span className="text-sm text-slate-500">{results.posts.length} result{results.posts.length === 1 ? "" : "s"}</span>
          </div>
          <PostList
            posts={results.posts}
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
