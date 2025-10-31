"use client";

import { useMemo } from "react";

import type { SocialChannelDTO } from "@/lib/social/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ChannelSidebarProps = {
  channels: SocialChannelDTO[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
  onToggleMembership: (channelId: string, action?: "join" | "leave" | "toggle") => void;
  pendingChannelId?: string | null;
  onRequestCreateChannel?: () => void;
};

const channelTypeLabels: Record<SocialChannelDTO["type"], string> = {
  topic: "Topic channels",
  project: "Project groups",
};

function ChannelSection({
  title,
  channels,
  selectedChannelId,
  onSelectChannel,
  onToggleMembership,
  pendingChannelId,
}: {
  title: string;
  channels: SocialChannelDTO[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
  onToggleMembership: (channelId: string, action?: "join" | "leave" | "toggle") => void;
  pendingChannelId?: string | null;
}) {
  if (!channels.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-2">
        {channels.map((channel) => {
          const isSelected = selectedChannelId === channel.id;
          return (
            <div
              key={channel.id}
              className={`flex items-start justify-between gap-2 rounded-lg border bg-white p-3 transition hover:border-slate-300 ${
                isSelected ? "border-slate-900 shadow-sm" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">{channel.name}</span>
                  {channel.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                </div>
                {channel.description ? (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{channel.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-400">{channel.memberCount} members</p>
              </button>
              <Button
                size="sm"
                variant={channel.isMember ? "outline" : "default"}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMembership(channel.id, channel.isMember ? "leave" : "join");
                }}
                disabled={pendingChannelId === channel.id}
              >
                {pendingChannelId === channel.id
                  ? "…"
                  : channel.isMember
                  ? "Leave"
                  : "Join"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChannelSidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onToggleMembership,
  pendingChannelId,
  onRequestCreateChannel,
}: ChannelSidebarProps) {
  const grouped = useMemo(() => {
    return channels.reduce(
      (acc, channel) => {
        acc[channel.type].push(channel);
        return acc;
      },
      {
        topic: [] as SocialChannelDTO[],
        project: [] as SocialChannelDTO[],
      }
    );
  }, [channels]);

  const isAllSelected = selectedChannelId === null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base font-semibold text-slate-900">Channels & Groups</CardTitle>
        {onRequestCreateChannel ? (
          <Button size="sm" variant="outline" onClick={onRequestCreateChannel}>
            Create
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <button
            type="button"
            onClick={() => onSelectChannel(null)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition hover:border-slate-300 ${
              isAllSelected ? "border-slate-900 bg-slate-100 shadow-sm" : "border-slate-200"
            }`}
          >
            All updates
          </button>
        </div>

        <ChannelSection
          title={channelTypeLabels.topic}
          channels={grouped.topic}
          selectedChannelId={selectedChannelId}
          onSelectChannel={onSelectChannel}
          onToggleMembership={onToggleMembership}
          pendingChannelId={pendingChannelId}
        />

        <ChannelSection
          title={channelTypeLabels.project}
          channels={grouped.project}
          selectedChannelId={selectedChannelId}
          onSelectChannel={onSelectChannel}
          onToggleMembership={onToggleMembership}
          pendingChannelId={pendingChannelId}
        />

        {!channels.length ? (
          <p className="text-sm text-slate-500">No channels yet. Create one to kick off focused conversations.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
