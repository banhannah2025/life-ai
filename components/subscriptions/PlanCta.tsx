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
};

export function PlanCta({ planId, isActive, signedIn, plusPlanClerkId }: PlanCtaProps) {
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
    if (!plusPlanClerkId) {
      return (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/contact">Contact support to upgrade</Link>
        </Button>
      );
    }

    return (
      <>
        <SignedIn>
          <CheckoutButton planId={plusPlanClerkId} planPeriod="month" newSubscriptionRedirectUrl="/subscriptions">
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
