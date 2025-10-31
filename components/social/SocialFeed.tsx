"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  fetchChannels,
  fetchPosts,
  fetchRelationships,
  updateChannelMembership,
  type SocialChannelDTO,
  type SocialPostDTO,
} from "@/lib/social/client";
import { Button } from "@/components/ui/button";
import { PostComposer } from "./PostComposer";
import { PostList } from "./PostList";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { SocialLeftRail } from "./SocialLeftRail";
import { SocialRightRail } from "./SocialRightRail";
import type { UserSummary } from "@/lib/social/types";

type SocialFeedProps = {
  initialPosts?: SocialPostDTO[];
  initialChannelId?: string | null;
};

const channelOrder: Record<SocialChannelDTO["type"], number> = {
  topic: 0,
  project: 1,
};

function sortChannels(channels: SocialChannelDTO[]) {
  return [...channels].sort((a, b) => {
    if (a.type !== b.type) {
      return channelOrder[a.type] - channelOrder[b.type];
    }
    return a.name.localeCompare(b.name);
  });
}

export function SocialFeed({ initialPosts = [], initialChannelId = null }: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPostDTO[]>(initialPosts);
  const [channels, setChannels] = useState<SocialChannelDTO[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(initialChannelId);
  const [followingAuthorIds, setFollowingAuthorIds] = useState<Set<string>>(new Set());
  const [followerAuthorIds, setFollowerAuthorIds] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<UserSummary[]>([]);
  const [followerUsers, setFollowerUsers] = useState<UserSummary[]>([]);
  const [friendUsers, setFriendUsers] = useState<UserSummary[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(!initialPosts.length);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [pendingChannelId, setPendingChannelId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const selectedChannelRef = useRef<string | null>(selectedChannelId);

  const loadRelationships = useCallback(async () => {
    try {
      const relationships = await fetchRelationships();
      setFollowingAuthorIds(new Set(relationships.following.map((user) => user.id)));
      setFollowerAuthorIds(new Set(relationships.followers.map((user) => user.id)));
      setFollowingUsers(relationships.following);
      setFollowerUsers(relationships.followers);
      setFriendUsers(relationships.friends);
    } catch (error) {
      if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 401) {
        toast.error(error instanceof Error ? error.message : "Unable to load your connections.");
      }
    }
  }, []);

  const loadPostsForChannel = useCallback(
    async (channelId: string | null, options: { silent?: boolean } = {}): Promise<boolean> => {
      let success = false;
      if (!options.silent) {
        setIsLoadingPosts(true);
      }

      try {
        const postData = await fetchPosts({ channelId: channelId ?? undefined });
        if (selectedChannelRef.current === channelId) {
          setPosts(postData);
          success = true;
        }
      } catch (error) {
        if (selectedChannelRef.current === channelId) {
          toast.error(error instanceof Error ? error.message : "Unable to load posts for this channel.");
        }
      } finally {
        if (!options.silent) {
          setIsLoadingPosts(false);
        }
      }

      return success;
    },
    [],
  );

  useEffect(() => {
    selectedChannelRef.current = selectedChannelId;
  }, [selectedChannelId]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoadingPosts(true);
      setChannelsLoading(true);
      try {
        const [channelData, postData] = await Promise.all([
          fetchChannels(),
          fetchPosts({ channelId: initialChannelId ?? null }),
        ]);

        if (!active) {
          return;
        }

        setChannels(sortChannels(channelData));
        setPosts(postData);
        await loadRelationships();
      } catch (error) {
        if (!active) {
          return;
        }
        toast.error(error instanceof Error ? error.message : "Unable to load your community feed.");
      } finally {
        if (active) {
          setIsLoadingPosts(false);
          setChannelsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [initialChannelId, loadRelationships]);

  useEffect(() => {
    if (!initialChannelId) {
      return;
    }

    selectedChannelRef.current = initialChannelId;
    setSelectedChannelId(initialChannelId);
    void loadPostsForChannel(initialChannelId, { silent: true });
  }, [initialChannelId, loadPostsForChannel]);

  function handlePostCreated(post: SocialPostDTO) {
    const currentChannel = selectedChannelRef.current;
    if (currentChannel && post.channelId !== currentChannel) {
      return;
    }
    setPosts((prev) => [post, ...prev]);
  }

  function handlePostUpdated(postId: string, updates: Partial<SocialPostDTO>) {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...updates } : post)));
  }

  function handleRelationshipChange(authorId: string, following: boolean) {
    setFollowingAuthorIds((prev) => {
      const next = new Set(prev);
      if (following) {
        next.add(authorId);
      } else {
        next.delete(authorId);
      }
      return next;
    });
  }

  function handleSelectChannel(channelId: string | null) {
    selectedChannelRef.current = channelId;
    setSelectedChannelId(channelId);
    void loadPostsForChannel(channelId);
  }

  function handleChannelCreated(channel: SocialChannelDTO) {
    setChannels((prev) => sortChannels([...prev.filter((item) => item.id !== channel.id), channel]));
    selectedChannelRef.current = channel.id;
    setSelectedChannelId(channel.id);
    void loadPostsForChannel(channel.id);
  }

  function handleToggleChannelMembership(channelId: string, action: "join" | "leave" | "toggle" = "toggle") {
    setPendingChannelId(channelId);
    updateChannelMembership(channelId, action)
      .then(({ channel }) => {
        setChannels((prev) => sortChannels([...prev.filter((item) => item.id !== channel.id), channel]));

        if (!channel.isMember && selectedChannelRef.current === channel.id) {
          selectedChannelRef.current = null;
          setSelectedChannelId(null);
          void loadPostsForChannel(null);
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to update membership.");
      })
      .finally(() => {
        setPendingChannelId(null);
      });
  }

  function handleRefresh() {
    startRefreshTransition(async () => {
      const success = await loadPostsForChannel(selectedChannelRef.current, { silent: true });
      if (success) {
        toast.success("Feed updated.");
      }
    });
  }

  return (
    <>
      <CreateChannelDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleChannelCreated}
      />
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="hidden xl:block">
          <SocialLeftRail
            channels={channels}
            selectedChannelId={selectedChannelId}
            onSelectChannel={handleSelectChannel}
            onToggleMembership={handleToggleChannelMembership}
            pendingChannelId={pendingChannelId}
            onRequestCreateChannel={() => setIsCreateDialogOpen(true)}
            channelsLoading={channelsLoading}
          />
        </aside>

        <div className="space-y-6">
          <header className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Social Feed</h1>
                <p className="text-sm text-slate-500">See updates from everyone across Life-AI.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  New channel
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-3 sm:hidden">
            <Button variant="outline" size="sm" className="justify-start" onClick={() => setIsCreateDialogOpen(true)}>
              Browse channels
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <Link href="/library">Explore resources</Link>
            </Button>
          </div>

          <PostComposer
            onPostCreated={handlePostCreated}
            channels={channels}
            activeChannelId={selectedChannelId}
          />

          {isLoadingPosts ? (
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
              <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            </div>
          ) : (
            <PostList
              posts={posts}
              followingIds={followingAuthorIds}
              followerIds={followerAuthorIds}
              onPostUpdated={handlePostUpdated}
              onRelationshipChange={handleRelationshipChange}
            />
          )}
        </div>

        <aside className="hidden lg:block">
          <SocialRightRail friends={friendUsers} followers={followerUsers} following={followingUsers} />
        </aside>
      </div>
    </>
  );
}
