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

      try {
        await ensureFirebaseSignedIn();
        const profile = await getUserProfile(user.id);
        if (!cancelled) {
          setPlanId(inferProfilePlanId(profile));
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load user plan", error);
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
  }, [isLoaded, isSignedIn, user?.id]);

  return { planId, loading, isSignedIn: Boolean(isSignedIn) };
}
