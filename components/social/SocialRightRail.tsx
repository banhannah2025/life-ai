"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Users, UserPlus } from "lucide-react";

import type { UserSummary } from "@/lib/social/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SocialRightRailProps = {
  friends: UserSummary[];
  followers: UserSummary[];
  following: UserSummary[];
};

function initialsFromName(name: string | undefined) {
  if (!name) {
    return "LA";
  }
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ConnectionList({
  title,
  users,
  emptyLabel,
}: {
  title: string;
  users: UserSummary[];
  emptyLabel: string;
}) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-900">{title}</CardTitle>
        <Badge variant="outline" className="text-xs font-medium text-slate-500">
          {users.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length ? (
          users.slice(0, 6).map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">{user.name}</p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/people/${user.id}`}>View</Link>
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

const spotlightLinks = [
  { label: "Meet new builders", href: "/people", icon: Users },
  { label: "Invite teammates", href: "/profile", icon: UserPlus },
];

export function SocialRightRail({ friends, followers, following }: SocialRightRailProps) {
  const friendSpotlight = useMemo(() => friends.slice(0, 6), [friends]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {spotlightLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Icon className="h-4 w-4 text-slate-500" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <ConnectionList title="Friends" users={friendSpotlight} emptyLabel="You haven't added friends yet." />
      <ConnectionList title="Following" users={following} emptyLabel="Follow someone to see updates here." />
      <ConnectionList title="Followers" users={followers} emptyLabel="No followers yet." />

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Community guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-slate-600">
          <p>Keep conversations respectful, constructive, and focused on helping one another grow.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Share what you&apos;re building and ask for feedback.</li>
            <li>Celebrate wins and give credit generously.</li>
            <li>Keep private data out of public posts.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
