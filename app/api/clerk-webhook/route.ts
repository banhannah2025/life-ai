import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { createUserDoc } from "@/lib/firestore";

type ClerkUserCreatedData = {
  id: string;
  email_addresses: Array<{ email_address: string | null | undefined }>;
};

function isUserCreatedEvent(payload: unknown): payload is { type: "user.created"; data: ClerkUserCreatedData } {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const { type, data } = payload as { type?: unknown; data?: unknown };

  if (type !== "user.created" || typeof data !== "object" || data === null) {
    return false;
  }

  const candidate = data as Partial<ClerkUserCreatedData>;

  if (typeof candidate.id !== "string") {
    return false;
  }

  if (!Array.isArray(candidate.email_addresses)) {
    return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const evt = wh.verify(body, headers) as unknown;

    if (isUserCreatedEvent(evt)) {
      const { id, email_addresses } = evt.data;
      const email = email_addresses[0]?.email_address ?? "";
      await createUserDoc(id, email); // ✅ Create Firestore doc automatically
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
