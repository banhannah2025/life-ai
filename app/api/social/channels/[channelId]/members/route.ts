import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { updateChannelMembership } from "@/lib/social/server/channels";
import { resolveUserSummary } from "@/lib/social/server/user-summary";
import { serializeChannel } from "@/lib/social/serialization";
import { channelMembershipSchema } from "@/lib/social/validators";

type RouteContext = {
  params: {
    channelId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const channelId = context.params.channelId;
  if (!channelId) {
    return NextResponse.json({ error: "Missing channel id." }, { status: 400 });
  }

  let parsedBody: unknown = {};
  try {
    parsedBody = await request.json();
  } catch (error) {
    parsedBody = {};
  }

  const parsed = channelMembershipSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload.",
        details: parsed.error.flatten(),
      },
      { status: 422 }
    );
  }

  try {
    const member = await resolveUserSummary(userId);
    const result = await updateChannelMembership({
      channelId,
      member,
      action: parsed.data.action,
    });

    return NextResponse.json({
      channel: serializeChannel(result.channel),
      isMember: result.isMember,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update membership.",
      },
      { status: 500 }
    );
  }
}
