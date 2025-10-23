"use client";

import { useMemo, useState } from "react";
import { differenceInDays } from "date-fns";
import Link from "next/link";

import type { AdminDirectoryUser } from "@/lib/admin/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

type AdminDashboardProps = {
  users: AdminDirectoryUser[];
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "—";
  }
  return value.toLocaleString();
}

function getStatusBadge(user: AdminDirectoryUser) {
  if (user.isAdmin) {
    return <Badge className="bg-slate-900 text-white hover:bg-slate-800">Admin</Badge>;
  }
  return <Badge variant="secondary">Member</Badge>;
}

export function AdminDashboard({ users }: AdminDashboardProps) {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!query.trim()) {
      return users;
    }
    const needle = query.toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(needle) ||
        (user.email ? user.email.toLowerCase().includes(needle) : false) ||
        user.otherEmails.some((email) => email.toLowerCase().includes(needle)) ||
        (user.profile.company ?? "").toLowerCase().includes(needle) ||
        (user.profile.role ?? "").toLowerCase().includes(needle)
      );
    });
  }, [users, query]);

  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const totalPosts = users.reduce((sum, user) => sum + user.postCount, 0);
    const adminCount = users.filter((user) => user.isAdmin).length;
    const activeLast7Days = users.filter((user) => {
      if (!user.lastActiveAt) {
        return false;
      }
      return differenceInDays(new Date(), user.lastActiveAt) <= 7;
    }).length;

    return {
      totalUsers,
      totalPosts,
      adminCount,
      activeLast7Days,
    };
  }, [users]);

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Life-AI Codex</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Pair Groq&apos;s coding models with repository context to plan refactors, draft patches, and review diffs
              directly inside the admin workspace.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/codex">Open Codex</Link>
          </Button>
        </CardHeader>
        <CardContent className="text-xs text-slate-500">
          <ul className="grid gap-2 sm:grid-cols-3">
            <li>Generate patch proposals grounded in our Next.js + TypeScript stack.</li>
            <li>Review Groq usage to stay within free-tier quotas before running CI.</li>
            <li>Capture design notes and risks before opening GitHub pull requests.</li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Members</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{metrics.totalUsers}</CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Posts</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{metrics.totalPosts}</CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Admins</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{metrics.adminCount}</CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active (7d)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{metrics.activeLast7Days}</CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">User Directory</CardTitle>
            <p className="text-sm text-slate-500">Full visibility into member profiles, activity, and roles.</p>
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, company, or role…"
            className="w-full sm:w-72"
          />
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead className="text-right">Following</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        {user.profile.headline ? (
                          <span className="text-xs text-slate-500">{user.profile.headline}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{user.email ?? "—"}</span>
                        {user.otherEmails.length ? (
                          <span className="text-xs text-slate-400">{user.otherEmails.join(", ")}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{user.profile.company || "—"}</TableCell>
                    <TableCell>{user.profile.role || "—"}</TableCell>
                    <TableCell className="text-right">{user.followerCount}</TableCell>
                    <TableCell className="text-right">{user.followingCount}</TableCell>
                    <TableCell className="text-right">{user.postCount}</TableCell>
                    <TableCell>{formatDate(user.lastActiveAt)}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      <Link href={`/people/${user.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredUsers.length ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-sm text-slate-500">
                      No members match your search.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
