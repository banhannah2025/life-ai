import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { resolveUserPlanId } from "@/lib/subscription/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ planId: "free" }, { status: 200 });
  }

  try {
    const planId = await resolveUserPlanId(userId);
    return NextResponse.json({ planId });
  } catch (error) {
    console.error("Failed to resolve user plan", error);
    return NextResponse.json({ planId: "free" }, { status: 200 });
  }
}
