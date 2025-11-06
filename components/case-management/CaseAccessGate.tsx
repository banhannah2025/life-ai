'use client';

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";

import { ensureFirebaseSignedIn } from "@/lib/firebase/client-auth";
import { getUserProfile } from "@/lib/firebase/profile";
import { hasCaseManagementAccess, normalizeRole } from "@/lib/auth/roles";
import { isAdminEmail } from "@/lib/admin/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { getPlan } from "@/lib/subscription/plans";

type AccessState = "checking" | "allowed" | "denied";

type CaseAccessGateProps = {
  children: ReactNode;
  featureDescription?: string;
};

export function CaseAccessGate({ children, featureDescription }: CaseAccessGateProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState<AccessState>("checking");
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [planId, setPlanId] = useState<SubscriptionPlanId>("free");
  const emailAddresses = useMemo(() => user?.emailAddresses ?? [], [user?.emailAddresses]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn || !user?.id) {
        if (!cancelled) {
          setStatus("denied");
          setRoleLabel(null);
        }
        return;
      }

      try {
        const adminByEmail = emailAddresses.some((address) => isAdminEmail(address.emailAddress));

        await ensureFirebaseSignedIn();
        const profile = await getUserProfile(user.id);
        const resolvedPlanId = (profile.planId as SubscriptionPlanId) ?? "free";
        if (cancelled) {
          return;
        }

        setPlanId(resolvedPlanId);
        const roleOrFallback = profile.role && profile.role.trim().length ? profile.role : adminByEmail ? "admin" : null;
        setRoleLabel(roleOrFallback);

        const plan = getPlan(resolvedPlanId);

        if (!plan.includesLegalResearch && !adminByEmail) {
          setStatus("denied");
          return;
        }

        if (adminByEmail || hasCaseManagementAccess(profile.role)) {
          setStatus("allowed");
        } else {
          setStatus("denied");
        }
      } catch (error) {
        console.error("Unable to verify case management access", error);
        if (!cancelled) {
          setStatus("denied");
        }
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, emailAddresses]);

  const roleDisplay = useMemo(() => {
    if (!roleLabel) {
      return null;
    }
    const normalized = normalizeRole(roleLabel);
    if (!normalized) {
      return roleLabel;
    }
    return normalized.replace(/_/g, " ");
  }, [roleLabel]);
  const planMeta = useMemo(() => getPlan(planId), [planId]);
  const lacksLegalByPlan = !planMeta.includesLegalResearch;
  const denialMessage = useMemo(() => {
    if (!isSignedIn) {
      return "Sign in with an authorized account to access case management tools.";
    }
    if (lacksLegalByPlan) {
      return `The ${planMeta.name} plan focuses on community tools. Upgrade to unlock legal research and case management.`;
    }
    return (
      featureDescription ??
      "Only administrators, attorneys, and law-firm accounts can work with case management features."
    );
  }, [featureDescription, isSignedIn, lacksLegalByPlan, planMeta.name]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <p>Preparing your case management workspace…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <Card className="mx-auto max-w-2xl border-rose-100/60 bg-white/80 text-slate-700 shadow-md">
        <CardHeader className="items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            <Lock className="h-5 w-5" />
          </span>
          <CardTitle className="text-lg font-semibold text-slate-800">Case management is restricted</CardTitle>
          <CardDescription className="text-sm text-slate-500">{denialMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {roleDisplay ? (
            <p className="rounded-md bg-slate-100 px-4 py-2 text-slate-600">
              Current role detected: <span className="font-semibold capitalize">{roleDisplay}</span>
            </p>
          ) : null}
          {lacksLegalByPlan && isSignedIn ? (
            <div className="space-y-3 text-slate-600">
              <p>Your current plan: <span className="font-semibold">{planMeta.name}</span></p>
              <p className="text-sm text-slate-500">
                Upgrade to unlock legal research, drafting, and case management workspaces with unlimited Synthesis AI.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-slate-600">
              <p>If you believe you should have access, you can:</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-500">
                <li>Update your profile role so our system recognizes your responsibilities.</li>
                <li>Contact an administrator to elevate your permissions.</li>
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {!isSignedIn ? (
              <Button asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            ) : (
              <>
                {lacksLegalByPlan ? (
                  <Button asChild>
                    <Link href="/subscriptions">Explore subscriptions</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link href="/profile">Review profile</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/social">Message an admin</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
