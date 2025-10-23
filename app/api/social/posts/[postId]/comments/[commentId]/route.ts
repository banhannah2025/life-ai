import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { removeComment } from "@/lib/social/server/posts";
import { removeCommentSchema } from "@/lib/social/validators";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const routeParams = await params;
  const validation = removeCommentSchema.safeParse(routeParams);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid route parameters.",
        details: validation.error.flatten(),
      },
      { status: 422 }
    );
  }

  try {
    await removeComment({
      postId: validation.data.postId,
      commentId: validation.data.commentId,
      requesterId: userId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete comment.",
      },
      { status: 500 }
    );
  }
}
