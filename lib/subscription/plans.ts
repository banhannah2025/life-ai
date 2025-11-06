import type { SubscriptionPlanId } from "@/lib/subscription/types";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  headline: string;
  description: string;
  price: string;
  billingCadence: "free" | "monthly" | "annual";
  features: string[];
  aiDailyLimit: number | null;
  includesLegalResearch: boolean;
  includesCaseManagement: boolean;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Community",
    headline: "Join the Life-AI network",
    description:
      "Build out your profile, collaborate on the social feed, and tap into Synthesis AI for community insights.",
    price: "$0",
    billingCadence: "free",
    features: [
      "Full access to the Life-AI social network",
      "Library browsing with academic-focused Synthesis AI",
      "Ten Synthesis AI requests per day across chat and research",
      "Profile builder with AI writing assistance",
    ],
    aiDailyLimit: 10,
    includesLegalResearch: false,
    includesCaseManagement: false,
  },
  legal_team: {
    id: "legal_team",
    name: "Legal Team",
    headline: "Unlock legal research and drafting",
    description: "Advanced legal intelligence, drafting workspaces, and collaboration controls for legal teams.",
    price: "$249",
    billingCadence: "monthly",
    features: [
      "Unlimited Synthesis AI requests",
      "Full legal research connectors & analytics",
      "Case management workspaces",
      "Document drafting and time tracking",
    ],
    aiDailyLimit: null,
    includesLegalResearch: true,
    includesCaseManagement: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    headline: "Tailored deployments and concierge support",
    description: "Custom integrations, governance controls, and dedicated success teams for large orgs.",
    price: "Talk to us",
    billingCadence: "monthly",
    features: [
      "Dedicated success manager and sandbox environments",
      "Private data connectors and security reviews",
      "Role-based access provisioning & audits",
      "Flexible billing and procurement options",
    ],
    aiDailyLimit: null,
    includesLegalResearch: true,
    includesCaseManagement: true,
  },
};

export function getPlan(planId: SubscriptionPlanId | null | undefined): SubscriptionPlan {
  if (!planId) {
    return SUBSCRIPTION_PLANS.free;
  }
  return SUBSCRIPTION_PLANS[planId] ?? SUBSCRIPTION_PLANS.free;
}
