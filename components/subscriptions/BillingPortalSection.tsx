'use client';

import Link from "next/link";
import { PricingTable, SignedIn, SignedOut } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function BillingPortalSection() {
  return (
    <section id="billing-portal" className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Clerk billing</p>
        <h2 className="text-2xl font-semibold text-slate-900">Manage your Life-AI membership</h2>
        <p className="text-sm text-slate-600">
          Select a plan, enter payment details, and manage renewals directly through Clerk&apos;s hosted billing flow.
        </p>
      </div>
      <div className="mt-6">
        <SignedIn>
          <PricingTable
            forOrganizations={false}
            collapseFeatures
            ctaPosition="bottom"
            newSubscriptionRedirectUrl="/subscriptions?status=success"
          />
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
            <p className="text-sm text-slate-600">Sign in to purchase or manage a Plus subscription.</p>
            <Button asChild>
              <Link href="/sign-in?redirect_url=/subscriptions">Sign in to continue</Link>
            </Button>
          </div>
        </SignedOut>
      </div>
    </section>
  );
}
