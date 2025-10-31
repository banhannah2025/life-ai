import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createChannel, listChannels } from "@/lib/social/server/channels";
import { resolveUserSummary } from "@/lib/social/server/user-summary";
import { serializeChannel } from "@/lib/social/serialization";
import { createChannelSchema } from "@/lib/social/validators";

export async function GET() {
  try {
    const { userId } = await auth();
    const channels = await listChannels(userId ?? null);
    return NextResponse.json({
      channels: channels.map(serializeChannel),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load channels.",
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
    const parsed = createChannelSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const creator = await resolveUserSummary(userId);
    const channel = await createChannel({
      creator,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description,
    });

    return NextResponse.json(
      {
        channel: serializeChannel(channel),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create channel.",
      },
      { status: 500 }
    );
  }
}
