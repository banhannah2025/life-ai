import type { SubscriptionPlanId } from "@/lib/subscription/types";

export type UserProfile = {
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  company?: string;
  role?: string;
  website?: string;
  skills?: string[];
  avatarUrl?: string;
  planId?: SubscriptionPlanId;
  planActivatedAt?: Date | null;
  updatedAt?: Date | null;
  searchKeywords?: string[];
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  headline: "",
  summary: "",
  location: "",
  company: "",
  role: "",
  website: "",
  skills: [],
  avatarUrl: "",
  planId: "free",
  planActivatedAt: null,
  updatedAt: null,
  searchKeywords: [],
};
