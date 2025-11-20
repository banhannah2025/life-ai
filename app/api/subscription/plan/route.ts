import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { resolveUserPlanIdWithSessionHint, extractPlanIdFromMetadata } from "@/lib/subscription/server";

export async function GET() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ planId: "free" }, { status: 200 });
  }

  try {
    const sessionPlanId = extractPlanIdFromMetadata(sessionClaims?.publicMetadata);
    const planId = await resolveUserPlanIdWithSessionHint(userId, sessionPlanId);
    return NextResponse.json({ planId });
  } catch (error) {
    console.error("Failed to resolve user plan", error);
    return NextResponse.json({ planId: "free" }, { status: 200 });
  }
}
