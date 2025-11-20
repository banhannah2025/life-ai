import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { createStripeBillingPortalSession } from "@/lib/stripe/server";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const baseUrl = getBaseUrl();

  try {
    const session = await createStripeBillingPortalSession({
      userId,
      email,
      returnUrl: `${baseUrl}/subscriptions`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create Stripe billing portal session", error);
    return NextResponse.json({ error: "Unable to open billing portal." }, { status: 500 });
  }
}
