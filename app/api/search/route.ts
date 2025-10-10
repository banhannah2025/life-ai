import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { serializePost } from "@/lib/social/serialization";
import { searchPosts } from "@/lib/social/server/posts";
import { searchProfiles } from "@/lib/search/server";

function toProfileResult(response: Awaited<ReturnType<typeof searchProfiles>>[number]) {
  const { id, fullName, profile } = response;
  return {
    id,
    fullName,
    headline: profile.headline ?? "",
    location: profile.location ?? "",
    company: profile.company ?? "",
    role: profile.role ?? "",
    avatarUrl: profile.avatarUrl ?? "",
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type") ?? "all";
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 25) : 10;

  if (!query) {
    return NextResponse.json({ profiles: [], posts: [] });
  }

  const shouldSearchProfiles = type === "all" || type === "profiles";
  const shouldSearchPosts = type === "all" || type === "posts";

  const [profileMatches, postMatches] = await Promise.all([
    shouldSearchProfiles ? searchProfiles(query, limit) : Promise.resolve([]),
    shouldSearchPosts ? searchPosts({ query, limit, viewerId: userId ?? null }) : Promise.resolve([]),
  ]);

  return NextResponse.json({
    profiles: profileMatches.map(toProfileResult),
    posts: postMatches.map(serializePost),
  });
}
