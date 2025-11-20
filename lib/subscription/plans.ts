import type { SubscriptionPlanId } from "@/lib/subscription/types";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  headline: string;
  description: string;
  price: string;
  priceInCents: number | null;
  currency: "USD";
  billingCadence: "free" | "monthly" | "annual";
  billingAnchor: "anniversary" | "calendar" | null;
  isPaidTier: boolean;
  features: string[];
  aiDailyLimit: number | null;
  includesLegalResearch: boolean;
  includesCaseManagement: boolean;
  allowsFileManagement: boolean;
  allowsDocumentWorkspace: boolean;
  allowsMockTrials: boolean;
  libraryAccess: "community" | "full";
  aiProvider: "groq" | "openai";
  aiModelId: string;
  webSearchProvider: "duckduckgo" | "google";
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Community",
    headline: "Join the Life-AI network",
    description:
      "Build out your profile, collaborate on the social feed, and tap into Synthesis AI for community insights.",
    price: "$0",
    priceInCents: 0,
    currency: "USD",
    billingCadence: "free",
    billingAnchor: null,
    isPaidTier: false,
    features: [
      "Full access to the Life-AI social network",
      "Library browsing with academic-focused Synthesis AI",
      "Ten Synthesis AI requests per day across chat and research",
      "Profile builder with AI writing assistance",
    ],
    aiDailyLimit: 10,
    includesLegalResearch: false,
    includesCaseManagement: false,
    allowsFileManagement: false,
    allowsDocumentWorkspace: false,
    allowsMockTrials: false,
    libraryAccess: "community",
    aiProvider: "openai",
    aiModelId: "gpt-4o-mini",
    webSearchProvider: "duckduckgo",
  },
  plus: {
    id: "plus",
    name: "Plus",
    headline: "Pro se legal research & casework",
    description:
      "Unlock GPT-4o Mini powered legal research, drafting tools, and the full Life-AI library.",
    price: "$20",
    priceInCents: 2000,
    currency: "USD",
    billingCadence: "monthly",
    billingAnchor: "anniversary",
    isPaidTier: true,
    features: [
      "Everything in the Community plan",
      "GPT-4o Mini legal and academic assistant",
      "Legal research workspace for pro se litigants",
      "Case management boards for self-represented litigants",
      "Document drafting workspace with AI templates",
      "Mock trial rehearsal and litigation prep tools",
      "File uploads and evidence binder management",
      "Up to 32 GPT-4o Mini prompts per day across chat and research",
      "Full access to curated library collections",
    ],
    aiDailyLimit: 32,
    includesLegalResearch: true,
    includesCaseManagement: true,
    allowsFileManagement: true,
    allowsDocumentWorkspace: true,
    allowsMockTrials: true,
    libraryAccess: "full",
    aiProvider: "openai",
    aiModelId: "gpt-4o-mini",
    webSearchProvider: "google",
  },
};

export function getPlan(planId: SubscriptionPlanId | null | undefined): SubscriptionPlan {
  if (!planId) {
    return SUBSCRIPTION_PLANS.free;
  }
  return SUBSCRIPTION_PLANS[planId] ?? SUBSCRIPTION_PLANS.free;
}
