"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";

import type { SocialChannelDTO } from "@/lib/social/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelSidebar } from "./ChannelSidebar";

type SocialLeftRailProps = {
  channels: SocialChannelDTO[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
  onToggleMembership: (channelId: string, action?: "join" | "leave" | "toggle") => void;
  pendingChannelId: string | null;
  onRequestCreateChannel: () => void;
  channelsLoading: boolean;
};

export function SocialLeftRail({
  channels,
  selectedChannelId,
  onSelectChannel,
  onToggleMembership,
  pendingChannelId,
  onRequestCreateChannel,
  channelsLoading,
}: SocialLeftRailProps) {
  const { user } = useUser();

  const initials = useMemo(() => {
    if (!user?.fullName) {
      return "LA";
    }
    return user.fullName
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.fullName]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.imageUrl ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              {user?.fullName ?? "Life-AI member"}
            </CardTitle>
            {user?.emailAddresses?.[0]?.emailAddress ? (
              <p className="text-xs text-slate-500">{user.emailAddresses[0].emailAddress}</p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Builder</Badge>
            <Badge variant="outline">Community</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Jump back into your Life-AI spaces or discover new groups to join.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            href="/profile"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>My profile</span>
            <span className="text-xs text-slate-400">›</span>
          </Link>
          <Link
            href="/profile/edit"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>Edit profile</span>
            <span className="text-xs text-slate-400">›</span>
          </Link>
          <Link
            href="/social"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>Social feed</span>
            <span className="text-xs text-slate-400">›</span>
          </Link>
        </CardContent>
      </Card>

      {channelsLoading ? (
        <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
      ) : (
        <ChannelSidebar
          channels={channels}
          selectedChannelId={selectedChannelId}
          onSelectChannel={onSelectChannel}
          onToggleMembership={onToggleMembership}
          pendingChannelId={pendingChannelId}
          onRequestCreateChannel={onRequestCreateChannel}
        />
      )}
    </div>
  );
}
