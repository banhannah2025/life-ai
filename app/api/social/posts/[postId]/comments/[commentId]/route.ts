import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { removeComment } from "@/lib/social/server/posts";
import { removeCommentSchema } from "@/lib/social/validators";

type RouteContext = {
  params: {
    postId: string;
    commentId: string;
  };
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const validation = removeCommentSchema.safeParse(context.params);
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
