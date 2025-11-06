import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/plans";
import { resolveUserPlanId, persistUserPlan } from "@/lib/subscription/server";

export default async function FreeOnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/onboarding/free");
  }

  const plan = SUBSCRIPTION_PLANS.free;
  const currentPlanId = await resolveUserPlanId(userId);
  if (currentPlanId !== "free") {
    await persistUserPlan(userId, "free");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center text-white">
          <p className="inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Community onboarding
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Set up your Life-AI profile</h1>
          <p className="mx-auto max-w-2xl text-sm text-white/70">
            Your profile powers the social network, research workspace, and Synthesis AI. Add a photo, craft your
            tagline, and tell us how you contribute to the community.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card className="border-white/10 bg-white/95 shadow-2xl">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-semibold text-slate-900">Profile details</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Everything you share here is visible across the community directory and social feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProfileForm mode="onboarding" />
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">{plan.name} plan highlights</CardTitle>
                <CardDescription className="text-sm text-white/70">
                  Enjoy Synthesis AI across chat and the academic research library, plus community collaboration tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-white/80">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-200">
                        •
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Need to use legal tools?</CardTitle>
                <CardDescription className="text-sm text-white/70">
                  Upgrade to unlock legal research, drafting, case management, and unlimited Synthesis AI usage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild variant="secondary" className="w-full bg-white text-slate-900 hover:bg-white/90">
                  <Link href="/subscriptions">Explore plans</Link>
                </Button>
                <p className="text-xs text-white/60">
                  Already part of a legal team? Reach out to your admin or{" "}
                  <Link href="mailto:hello@life-ai.ccpros.org" className="text-emerald-200 underline">
                    contact us
                  </Link>{" "}
                  for access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
