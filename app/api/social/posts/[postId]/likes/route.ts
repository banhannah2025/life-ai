import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { togglePostLike } from "@/lib/social/server/posts";
import { resolveUserSummary } from "@/lib/social/server/user-summary";

type RouteContext = {
  params: {
    postId: string;
  };
};

export async function POST(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const postId = context.params.postId;
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
