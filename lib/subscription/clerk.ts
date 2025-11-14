import type { SubscriptionPlanId, SubscriptionBillingStatus } from "@/lib/subscription/types";
import { resolvePlanFromBillingDetails } from "@/lib/subscription/profile-plan";

const PLUS_PLAN_IDS = collectPlanIds(
  process.env.CLERK_PLUS_PLAN_IDS,
  process.env.CLERK_PLUS_PLAN_ID,
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_IDS,
  process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID,
);

const PRIMARY_PLUS_PLAN_ID = PLUS_PLAN_IDS[0] ?? "plus-monthly";

const CLERK_PLAN_TO_SUBSCRIPTION = new Map<string, SubscriptionPlanId>();
for (const id of PLUS_PLAN_IDS) {
  if (id) {
    CLERK_PLAN_TO_SUBSCRIPTION.set(id, "plus");
    CLERK_PLAN_TO_SUBSCRIPTION.set(id.toLowerCase(), "plus");
  }
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const CANCELLED_STATUSES = new Set(["canceled", "unpaid", "past_due", "incomplete", "incomplete_expired", "paused"]);

const CLERK_PLAN_CACHE_TTL_MS = 60 * 1000;
const clerkPlanCache = new Map<
  string,
  {
    planId: SubscriptionPlanId | null;
    expiresAt: number;
  }
>();

export function mapClerkPlanToSubscription(planId: string | null | undefined): SubscriptionPlanId | null {
  if (!planId) {
    return null;
  }
  const normalized = planId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const explicit = CLERK_PLAN_TO_SUBSCRIPTION.get(planId) ?? CLERK_PLAN_TO_SUBSCRIPTION.get(normalized);
  if (explicit) {
    return explicit;
  }
  if (normalized.includes("plus")) {
    return "plus";
  }
  return null;
}

export function normalizeClerkStatus(status: string | null | undefined): SubscriptionBillingStatus {
  if (!status) {
    return "unknown";
  }
  const lowered = status.toLowerCase();
  if (ACTIVE_STATUSES.has(lowered)) {
    return lowered as SubscriptionBillingStatus;
  }
  if (CANCELLED_STATUSES.has(lowered)) {
    return lowered as SubscriptionBillingStatus;
  }
  return "unknown";
}

export function isClerkSubscriptionActive(status: string | null | undefined): boolean {
  return ACTIVE_STATUSES.has((status ?? "").toLowerCase());
}

export const CLERK_BILLING_PLAN_IDS = {
  plus: PRIMARY_PLUS_PLAN_ID,
} as const;

const DEFAULT_CLERK_API_BASE_URL = "https://api.clerk.com";
const DEFAULT_CLERK_TEST_API_BASE_URL = "https://api.clerk.dev";

function resolveClerkApiBaseUrl() {
  const configured = process.env.CLERK_API_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const secretKey = process.env.CLERK_SECRET_KEY ?? "";
  if (secretKey.startsWith("sk_live") || secretKey.startsWith("sk_prod")) {
    return DEFAULT_CLERK_API_BASE_URL;
  }
  if (secretKey.startsWith("sk_test") || secretKey.startsWith("test_")) {
    return DEFAULT_CLERK_TEST_API_BASE_URL;
  }
  // Default to production host if we can't infer environment.
  return DEFAULT_CLERK_API_BASE_URL;
}

const CLERK_API_BASE_URL = resolveClerkApiBaseUrl();

type ClerkApiSubscription = {
  id?: string | null;
  status?: string | null;
  plan?: { id?: string | null } | null;
  price?: { amount?: number | null; currency?: string | null } | null;
};

export async function resolvePlanFromClerkSubscriptions(userId: string): Promise<SubscriptionPlanId | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey || !userId) {
    return null;
  }

  const cached = clerkPlanCache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.planId;
  }

  try {
    const url = `${CLERK_API_BASE_URL}/v1/users/${userId}/subscriptions`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("Failed to fetch Clerk subscriptions", { status: response.status, statusText: response.statusText });
      return null;
    }

    const payload = await response.json().catch(() => null);
    const subscriptions: ClerkApiSubscription[] = parseClerkSubscriptionPayload(payload);
    if (!subscriptions.length) {
      clerkPlanCache.set(userId, { planId: null, expiresAt: now + CLERK_PLAN_CACHE_TTL_MS });
      return null;
    }

    const activeSubscription = subscriptions.find((subscription) => isClerkSubscriptionActive(subscription.status));
    if (!activeSubscription) {
      clerkPlanCache.set(userId, { planId: null, expiresAt: now + CLERK_PLAN_CACHE_TTL_MS });
      return null;
    }

    const mapped = mapClerkPlanToSubscription(activeSubscription.plan?.id ?? null);
    if (mapped) {
      clerkPlanCache.set(userId, { planId: mapped, expiresAt: now + CLERK_PLAN_CACHE_TTL_MS });
      return mapped;
    }

    const inferred = resolvePlanFromBillingDetails({
      providerPlanId: activeSubscription.plan?.id ?? null,
      priceCents: normalizeClerkAmount(activeSubscription.price?.amount),
      currency: typeof activeSubscription.price?.currency === "string" ? activeSubscription.price?.currency : "USD",
    });
    if (inferred) {
      clerkPlanCache.set(userId, { planId: inferred, expiresAt: now + CLERK_PLAN_CACHE_TTL_MS });
      return inferred;
    }

    // Default to plus for any active paid subscription we can't map explicitly.
    clerkPlanCache.set(userId, { planId: "plus", expiresAt: now + CLERK_PLAN_CACHE_TTL_MS });
    return "plus";
  } catch (error) {
    console.error("Unable to resolve plan from Clerk subscriptions", error);
    clerkPlanCache.set(userId, { planId: null, expiresAt: now + CLERK_PLAN_CACHE_TTL_MS });
    return null;
  }
}

function parseClerkSubscriptionPayload(payload: unknown): ClerkApiSubscription[] {
  if (Array.isArray(payload)) {
    return payload as ClerkApiSubscription[];
  }
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return ((payload as { data?: ClerkApiSubscription[] }).data ?? []).filter(Boolean);
  }
  return [];
}

export function normalizeClerkAmount(amount: unknown): number | null {
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

function collectPlanIds(...values: Array<string | undefined>): string[] {
  const entries = values
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim())
    .filter(Boolean);

  if (!entries.length) {
    entries.push("plus", "plus-monthly");
  }

  return Array.from(new Set(entries));
}
