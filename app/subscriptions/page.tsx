import { auth } from "@clerk/nextjs/server";
import { Check, Sparkles, Shield, Briefcase, Gem } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, getPlan } from "@/lib/subscription/plans";
import type { SubscriptionPlanId } from "@/lib/subscription/types";
import { resolveUserPlanId } from "@/lib/subscription/server";
import { cn } from "@/lib/utils";
import { PlanCta } from "@/components/subscriptions/PlanCta";
import { BillingPortalSection } from "@/components/subscriptions/BillingPortalSection";

type PlanIcon = typeof Sparkles;

const PLAN_ICON_MAP: Record<SubscriptionPlanId, PlanIcon> = {
  free: Sparkles,
  plus: Gem,
  legal_team: Briefcase,
  enterprise: Shield,
};

export default async function SubscriptionsPage() {
  const { userId } = await auth();
  const activePlanId = userId ? await resolveUserPlanId(userId) : null;
  const activePlan = getPlan(activePlanId);
  const plusPlanClerkId = process.env.NEXT_PUBLIC_CLERK_PLUS_PLAN_ID ?? null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-4 text-center">
        <p className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
          Choose the right Life-AI workspace
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Subscription plans built for every team</h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
          Start with the Community plan to explore social, academic research, and Synthesis AI chat. Upgrade when
          you&apos;re ready for legal research, drafting, and case management.
        </p>
        {userId ? (
          <p className="text-sm text-slate-500">
            Your current plan: <span className="font-medium text-slate-700">{activePlan.name}</span>
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanId[]).map((planId) => {
          const plan = SUBSCRIPTION_PLANS[planId];
          const isActive = activePlanId === planId;
          const Icon = PLAN_ICON_MAP[planId] ?? Sparkles;

          return (
            <Card
              key={planId}
              className={cn(
                "flex h-full flex-col border-slate-200 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
                isActive ? "border-emerald-300 shadow-emerald-100" : "",
              )}
            >
              <CardHeader className="space-y-4">
                <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-full", iconAccent(planId))}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-slate-500">{plan.headline}</CardDescription>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-slate-900">{plan.price}</div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {plan.billingCadence === "free" ? "Free forever" : `Billed ${plan.billingCadence}`}
                  </p>
                </div>
                <p className="text-sm text-slate-600">{plan.description}</p>
              </CardHeader>
              <CardContent className="mt-auto space-y-6">
                <ul className="space-y-3 text-sm text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <PlanCta
                  planId={planId}
                  isActive={isActive}
                  signedIn={!!userId}
                  plusPlanClerkId={plusPlanClerkId}
                  scrollTargetId="billing-portal"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <BillingPortalSection />
    </div>
  );
}

function iconAccent(planId: SubscriptionPlanId) {
  switch (planId) {
    case "free":
      return "bg-emerald-100 text-emerald-600";
    case "plus":
      return "bg-amber-100 text-amber-600";
    case "legal_team":
      return "bg-sky-100 text-sky-600";
    case "enterprise":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
