import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { createUserDoc } from "@/lib/firestore";

type ClerkUserCreatedData = {
  id: string;
  email_addresses: Array<{ email_address: string | null | undefined }>;
};

function isUserCreatedData(value: unknown): value is ClerkUserCreatedData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ClerkUserCreatedData>;

  return (
    typeof candidate.id === "string" &&
    Array.isArray(candidate.email_addresses)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  try {
    const evt = wh.verify(body, headers) as { type: string; data: unknown };

    if (evt.type === "user.created") {
      const data = evt.data;
      if (!isUserCreatedData(data)) {
        console.warn("Received user.created webhook with unexpected payload shape");
      } else {
        const { id, email_addresses } = data;
        const email = email_addresses[0]?.email_address ?? "";
        await createUserDoc(id, email); // ✅ Create Firestore doc automatically
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
