import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { MockTrialPortal } from "@/components/case-management/MockTrialPortal";
import { FeatureLockedNotice } from "@/components/subscriptions/FeatureLockedNotice";
import { loadUserPlan } from "@/lib/subscription/plan-access";

export default async function MockTrialPortalPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    const target = "/case-management/mock-trial";
    if (typeof redirectToSignIn === "function") {
      redirectToSignIn({ returnBackUrl: target });
    }
    redirect(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
  }

  const { plan } = await loadUserPlan(userId);

  if (!plan.allowsMockTrials) {
    return (
      <FeatureLockedNotice
        feature="Mock trial portal"
        planName={plan.name}
        description="Mock trial scheduling and scoring are reserved for Legal Team and Enterprise workspaces."
      />
    );
  }

  return (
    <div className="space-y-8">
      <MockTrialPortal />
    </div>
  );
}
