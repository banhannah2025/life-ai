'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { ensureFirebaseSignedIn } from "@/lib/firebase/client-auth";
import { getUserProfile } from "@/lib/firebase/profile";
import { inferProfilePlanId } from "@/lib/subscription/profile-plan";

type UseUserPlanResult = {
  planId: SubscriptionPlanId;
  loading: boolean;
  isSignedIn: boolean;
};

const DEFAULT_PLAN: SubscriptionPlanId = "free";

export function useUserPlan(): UseUserPlanResult {
  const { isLoaded, isSignedIn, user } = useUser();
  const [planId, setPlanId] = useState<SubscriptionPlanId>(DEFAULT_PLAN);
  const [loading, setLoading] = useState(true);
  const metadataPlanId = (user?.publicMetadata?.planId as SubscriptionPlanId | undefined) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function hydratePlan() {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn || !user?.id) {
        if (!cancelled) {
          setPlanId(DEFAULT_PLAN);
          setLoading(false);
        }
        return;
      }

      if (!cancelled && !metadataPlanId) {
        setLoading(true);
      }

      if (metadataPlanId && !cancelled) {
        setPlanId(metadataPlanId);
        setLoading(false);
      }

      try {
        const response = await fetch("/api/subscription/plan", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load plan, status ${response.status}`);
        }

        const payload = (await response.json().catch(() => null)) as { planId?: unknown } | null;
        const resolvedPlanId = (payload?.planId as SubscriptionPlanId | undefined) ?? DEFAULT_PLAN;

        if (!cancelled) {
          setPlanId(resolvedPlanId);
          setLoading(false);
        }
        return;
      } catch (error) {
        console.warn("Subscription plan API lookup failed, falling back to profile", error);
      }

      try {
        await ensureFirebaseSignedIn();
        const profile = await getUserProfile(user.id);
        if (!cancelled) {
          setPlanId(inferProfilePlanId(profile));
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load user plan via profile fallback", error);
        if (!cancelled) {
          setPlanId(DEFAULT_PLAN);
          setLoading(false);
        }
      }
    }

    void hydratePlan();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, metadataPlanId]);

  return { planId, loading, isSignedIn: Boolean(isSignedIn) };
}
