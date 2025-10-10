import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createPost, listRecentPosts } from "@/lib/social/server/posts";
import { resolveUserSummary } from "@/lib/social/server/user-summary";
import { serializePost } from "@/lib/social/serialization";
import { createPostSchema } from "@/lib/social/validators";

function handleZodError(error: unknown) {
  if (error && typeof error === "object" && "flatten" in error) {
    return NextResponse.json(
      {
        error: "Invalid request payload.",
        details: (error as { flatten: () => unknown }).flatten(),
      },
      { status: 422 }
    );
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Unexpected error." },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(Number.parseInt(limitParam, 10) || 0, 1), 50) : 25;
    const channelId = url.searchParams.get("channelId");

    const posts = await listRecentPosts({
      limit,
      viewerId: userId ?? null,
      channelId: channelId || null,
    });

    return NextResponse.json({
      posts: posts.map(serializePost),
    });
  } catch (error) {
    return handleZodError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const parsed = createPostSchema.safeParse(json);
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
    const post = await createPost({
      author,
      content: parsed.data.content,
      attachments: parsed.data.attachments,
      tags: parsed.data.tags,
      visibility: parsed.data.visibility,
      channelId: parsed.data.channelId,
    });

    return NextResponse.json(
      {
        post: serializePost(post),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleZodError(error);
  }
}
