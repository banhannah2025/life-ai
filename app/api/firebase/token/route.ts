import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createFirebaseCustomToken } from "@/lib/firebase/custom-token";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const token = createFirebaseCustomToken(userId);

  return NextResponse.json({ token });
}
