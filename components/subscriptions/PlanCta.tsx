'use client';

import Link from "next/link";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { SignedIn, SignedOut } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import type { SubscriptionPlanId } from "@/lib/subscription/types";

type PlanCtaProps = {
  planId: SubscriptionPlanId;
  isActive: boolean;
  signedIn: boolean;
  plusPlanClerkId?: string | null;
  scrollTargetId?: string;
};

export function PlanCta({ planId, isActive, signedIn, plusPlanClerkId, scrollTargetId = "billing-portal" }: PlanCtaProps) {
  if (isActive && signedIn) {
    return (
      <Button variant="outline" disabled className="w-full">
        Current plan
      </Button>
    );
  }

  if (planId === "free") {
    return (
      <Button asChild className="w-full">
        <Link href="/sign-up/free">Get started</Link>
      </Button>
    );
  }

  if (planId === "plus") {
    if (plusPlanClerkId) {
      return (
        <>
          <SignedIn>
            <CheckoutButton planId={plusPlanClerkId} planPeriod="month" newSubscriptionRedirectUrl="/subscriptions?status=success">
              <Button className="w-full">Upgrade to Plus</Button>
            </CheckoutButton>
          </SignedIn>
          <SignedOut>
            <Button asChild className="w-full">
              <Link href="/sign-in?redirect_url=/subscriptions">Sign in to upgrade</Link>
            </Button>
          </SignedOut>
        </>
      );
    }

    const handleScroll = () => {
      const target = document.getElementById(scrollTargetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.hash = `#${scrollTargetId}`;
      }
    };

    return (
      <Button type="button" className="w-full" onClick={handleScroll}>
        Explore Plus billing options
      </Button>
    );
  }

  if (planId === "legal_team") {
    return (
      <Button asChild variant="secondary" className="w-full">
        <Link href="/contact">Talk to sales</Link>
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" className="w-full">
      <Link href="mailto:hello@life-ai.ccpros.org">Contact us</Link>
    </Button>
  );
}
