'use client';

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import type { SubscriptionPlanId } from "@/lib/subscription/types";

type PlanCtaProps = {
  planId: SubscriptionPlanId;
  isActive: boolean;
  signedIn: boolean;
  scrollTargetId?: string;
};

export function PlanCta({ planId, isActive, signedIn, scrollTargetId = "billing-portal" }: PlanCtaProps) {
  const [loading, setLoading] = useState(false);

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

  const startCheckout = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start checkout");
      }

      const payload = (await response.json().catch(() => null)) as { url?: string } | null;
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }
      throw new Error("Missing checkout URL");
    } catch (error) {
      console.error("Checkout failed", error);
      alert("Unable to open Stripe Checkout. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  if (planId === "plus") {
    return (
      <>
        <SignedIn>
          <Button type="button" className="w-full" onClick={startCheckout} disabled={loading}>
            {loading ? "Redirecting..." : "Upgrade with Stripe"}
          </Button>
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
      View billing options
    </Button>
  );
}
