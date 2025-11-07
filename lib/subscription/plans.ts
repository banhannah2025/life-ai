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
    aiProvider: "groq",
    aiModelId: "llama-3.3-70b-versatile",
    webSearchProvider: "duckduckgo",
  },
  plus: {
    id: "plus",
    name: "Plus",
    headline: "Pro se legal research & casework",
    description:
      "Unlock GPT-5 powered legal research, case tracking, and the full Life-AI library without document drafting or mock trials.",
    price: "$20",
    priceInCents: 2000,
    currency: "USD",
    billingCadence: "monthly",
    billingAnchor: "anniversary",
    isPaidTier: true,
    features: [
      "Everything in the Community plan",
      "GPT-5 legal and academic assistant",
      "Legal research workspace for pro se litigants",
      "Case management boards for self-represented litigants",
      "Full access to curated library collections",
    ],
    aiDailyLimit: 50,
    includesLegalResearch: true,
    includesCaseManagement: true,
    allowsFileManagement: false,
    allowsDocumentWorkspace: false,
    allowsMockTrials: false,
    libraryAccess: "full",
    aiProvider: "openai",
    aiModelId: "gpt-5",
    webSearchProvider: "google",
  },
  legal_team: {
    id: "legal_team",
    name: "Legal Team",
    headline: "Unlock legal research and drafting",
    description: "Advanced legal intelligence, drafting workspaces, and collaboration controls for legal teams.",
    price: "$249",
    priceInCents: 24900,
    currency: "USD",
    billingCadence: "monthly",
    billingAnchor: "anniversary",
    isPaidTier: true,
    features: [
      "Unlimited Synthesis AI requests",
      "Full legal research connectors & analytics",
      "Case management workspaces",
      "Document drafting and time tracking",
    ],
    aiDailyLimit: null,
    includesLegalResearch: true,
    includesCaseManagement: true,
    allowsFileManagement: true,
    allowsDocumentWorkspace: true,
    allowsMockTrials: true,
    libraryAccess: "full",
    aiProvider: "groq",
    aiModelId: "llama-3.3-70b-versatile",
    webSearchProvider: "duckduckgo",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    headline: "Tailored deployments and concierge support",
    description: "Custom integrations, governance controls, and dedicated success teams for large orgs.",
    price: "Talk to us",
    priceInCents: null,
    currency: "USD",
    billingCadence: "monthly",
    billingAnchor: "anniversary",
    isPaidTier: true,
    features: [
      "Dedicated success manager and sandbox environments",
      "Private data connectors and security reviews",
      "Role-based access provisioning & audits",
      "Flexible billing and procurement options",
    ],
    aiDailyLimit: null,
    includesLegalResearch: true,
    includesCaseManagement: true,
    allowsFileManagement: true,
    allowsDocumentWorkspace: true,
    allowsMockTrials: true,
    libraryAccess: "full",
    aiProvider: "groq",
    aiModelId: "openai/gpt-oss-120b",
    webSearchProvider: "duckduckgo",
  },
};

export function getPlan(planId: SubscriptionPlanId | null | undefined): SubscriptionPlan {
  if (!planId) {
    return SUBSCRIPTION_PLANS.free;
  }
  return SUBSCRIPTION_PLANS[planId] ?? SUBSCRIPTION_PLANS.free;
}
