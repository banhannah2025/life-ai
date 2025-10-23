import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createUserDoc } from "@/lib/firestore";

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    email_addresses: Array<{ email_address: string | null | undefined }>;
  };
};

type ClerkWebhookEvent = ClerkUserCreatedEvent | { type: string; data: unknown };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const evt = wh.verify(body, headers) as ClerkWebhookEvent;

    if (evt.type === "user.created") {
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
