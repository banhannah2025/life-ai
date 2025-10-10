import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { serializePost } from "@/lib/social/serialization";
import { listPostsByAuthor } from "@/lib/social/server/posts";

type RouteContext = {
  params: {
    userId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  const { userId: viewerId } = await auth();
  const targetUserId = context.params.userId;

  if (!targetUserId) {
    return NextResponse.json({ error: "Missing userId parameter." }, { status: 400 });
  }

  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "25", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 25;

  try {
    const posts = await listPostsByAuthor({
      authorId: targetUserId,
      viewerId: viewerId ?? null,
      limit,
    });

    return NextResponse.json({
      posts: posts.map(serializePost),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch posts for this user.",
      },
      { status: 500 }
    );
  }
}
