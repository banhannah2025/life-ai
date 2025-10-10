import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { listFollowers, listFollowing, toggleFollow } from "@/lib/social/server/follows";
import { resolveUserSummary } from "@/lib/social/server/user-summary";
import { followSchema } from "@/lib/social/validators";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [following, followers] = await Promise.all([listFollowing(userId), listFollowers(userId)]);

    const followerMap = new Map(followers.map((user) => [user.id, user]));
    const friends = following.filter((user) => followerMap.has(user.id));

    return NextResponse.json({
      following,
      followers,
      friends,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load relationships.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = followSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const follower = await resolveUserSummary(userId);
    const target: Parameters<typeof toggleFollow>[0]["target"] = {
      id: parsed.data.targetUserId,
      name: parsed.data.targetName ?? "Life-AI member",
      avatarUrl: parsed.data.targetAvatarUrl,
    };

    const result = await toggleFollow({ follower, target });

    return NextResponse.json({
      following: result.following,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update relationship.",
      },
      { status: 500 }
    );
  }
}
