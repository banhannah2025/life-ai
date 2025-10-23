import { NextRequest, NextResponse } from "next/server";

import { getPublicUserProfile } from "@/lib/firebase/server-profile";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter." }, { status: 400 });
  }

  try {
    const profile = await getPublicUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load profile.",
      },
      { status: 500 }
    );
  }
}
