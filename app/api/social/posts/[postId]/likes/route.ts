import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { togglePostLike } from "@/lib/social/server/posts";
import { resolveUserSummary } from "@/lib/social/server/user-summary";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { postId } = await params;
  if (!postId) {
    return NextResponse.json({ error: "Missing postId in route parameter." }, { status: 400 });
  }

  try {
    const user = await resolveUserSummary(userId);
    const result = await togglePostLike(postId, user);

    return NextResponse.json({
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to toggle like." },
      { status: 500 }
    );
  }
}
