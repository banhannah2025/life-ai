import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { CaseDocumentDrafting } from "@/components/case-management/CaseDocumentDrafting";
import { FeatureLockedNotice } from "@/components/subscriptions/FeatureLockedNotice";
import { loadUserPlan } from "@/lib/subscription/plan-access";

export default async function CaseDocumentDraftingPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    const target = "/case-management/document-drafting";
    if (typeof redirectToSignIn === "function") {
      redirectToSignIn({ returnBackUrl: target });
    }
    redirect(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
  }

  const { plan } = await loadUserPlan(userId);

  if (!plan.allowsDocumentWorkspace) {
    return (
      <FeatureLockedNotice
        feature="Document drafting"
        planName={plan.name}
        description="Only Legal Team and Enterprise accounts can launch the drafting workspace."
      />
    );
  }

  return <CaseDocumentDrafting />;
}
