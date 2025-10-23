import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { addComment, listComments } from "@/lib/social/server/posts";
import { resolveUserSummary } from "@/lib/social/server/user-summary";
import { serializeComment } from "@/lib/social/serialization";
import { addCommentSchema } from "@/lib/social/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { userId } = await auth();
  const { postId } = await params;

  if (!postId) {
    return NextResponse.json({ error: "Missing postId in route parameter." }, { status: 400 });
  }

  try {
    const comments = await listComments(postId, userId ?? null);
    return NextResponse.json({
      comments: comments.map(serializeComment),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch comments.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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
    const json = await request.json();
    const parsed = addCommentSchema.safeParse({
      postId,
      ...json,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const author = await resolveUserSummary(userId);
    const comment = await addComment({
      postId,
      author,
      content: parsed.data.content,
    });

    return NextResponse.json(
      {
        comment: serializeComment(comment),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add comment.",
      },
      { status: 500 }
    );
  }
}
