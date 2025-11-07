export type SubscriptionPlanId = "free" | "plus" | "legal_team" | "enterprise";

export type SubscriptionUsageCategory = "chat" | "library-search" | "profile-refine";

export type BillingProviderId = "clerk";

export type SubscriptionBillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused"
  | "unknown";

export type UserBillingProfile = {
  provider: BillingProviderId;
  subscriptionId: string | null;
  providerPlanId: string | null;
  status: SubscriptionBillingStatus;
  priceCents: number | null;
  currency: string;
  renewsAt: Date | null;
  cancelAt: Date | null;
  updatedAt: Date | null;
};

export const DEFAULT_SUBSCRIPTION_PLAN_ID: SubscriptionPlanId = "free";
