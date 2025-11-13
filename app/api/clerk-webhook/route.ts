import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { FieldValue } from "firebase-admin/firestore";

import { createUserDoc } from "@/lib/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { mapClerkPlanToSubscription, isClerkSubscriptionActive, normalizeClerkStatus } from "@/lib/subscription/clerk";
import { persistUserPlan } from "@/lib/subscription/server";
import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { resolvePlanFromBillingDetails } from "@/lib/subscription/profile-plan";

type ClerkUserCreatedData = {
  id: string;
  email_addresses: Array<{ email_address: string | null | undefined }>;
};

type ClerkSubscriptionData = {
  id?: string | null;
  status?: string | null;
  user_id?: string | null;
  plan?: { id?: string | null } | null;
  price?: { amount?: number | null; currency?: string | null } | null;
  next_billing_at?: string | number | null;
  billing_cycle_anchor?: string | number | null;
  cancel_at?: string | number | null;
};

function isUserCreatedData(value: unknown): value is ClerkUserCreatedData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ClerkUserCreatedData>;

  return typeof candidate.id === "string" && Array.isArray(candidate.email_addresses);
}

function isSubscriptionData(value: unknown): value is ClerkSubscriptionData {
  return typeof value === "object" && value !== null && "user_id" in value;
}

function parseDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // assume epoch seconds or milliseconds based on size
    const millis = value > 9999999999 ? value : value * 1000;
    return new Date(millis);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

async function handleSubscriptionEvent(data: ClerkSubscriptionData) {
  const userId = typeof data.user_id === "string" ? data.user_id : null;
  if (!userId) {
    console.warn("Clerk subscription webhook missing user_id", data);
    return;
  }

  const mappedPlanId = mapClerkPlanToSubscription(data.plan?.id ?? null);
  const isActive = isClerkSubscriptionActive(data.status);

  let targetPlanId: SubscriptionPlanId | null = null;
  if (mappedPlanId) {
    targetPlanId = isActive ? mappedPlanId : "free";
  } else if (isActive) {
    const inferredPlan = resolvePlanFromBillingDetails({
      providerPlanId: data.plan?.id ?? null,
      priceCents: normalizeClerkAmount(data.price?.amount),
      currency: typeof data.price?.currency === "string" ? data.price.currency : "USD",
    });
    if (inferredPlan) {
      targetPlanId = inferredPlan;
    }
  }

  if (targetPlanId) {
    await persistUserPlan(userId, targetPlanId);
  }

  const firestore = getAdminFirestore();
  const renewsAt = parseDate(data.next_billing_at ?? data.billing_cycle_anchor);
  const cancelAt = parseDate(data.cancel_at);
  const priceCents = normalizeClerkAmount(data.price?.amount);
  const currency = typeof data.price?.currency === "string" ? data.price.currency : "USD";

  await firestore
    .collection("profiles")
    .doc(userId)
    .set(
      {
        billing: {
          provider: "clerk",
          subscriptionId: data.id ?? null,
          providerPlanId: data.plan?.id ?? null,
          status: normalizeClerkStatus(data.status),
          priceCents,
          currency,
          renewsAt,
          cancelAt,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
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
        await createUserDoc(id, email);
      }
    } else if (evt.type.startsWith("subscription.")) {
      if (!isSubscriptionData(evt.data)) {
        console.warn("Received subscription webhook with unexpected payload shape");
      } else {
        await handleSubscriptionEvent(evt.data);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}

function normalizeClerkAmount(amount: unknown): number | null {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return null;
  }
  if (amount <= 0) {
    return null;
  }
  if (amount < 100 && Number.isInteger(amount)) {
    return amount * 100;
  }
  return Math.round(amount);
}
