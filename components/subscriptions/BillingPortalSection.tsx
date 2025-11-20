'use client';

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function BillingPortalSection() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }
      const payload = (await response.json().catch(() => null)) as { url?: string } | null;
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }
      throw new Error("Missing billing portal URL");
    } catch (error) {
      console.error("Unable to load Stripe billing portal", error);
      alert("Unable to open the billing portal. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="billing-portal" className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Stripe billing</p>
        <h2 className="text-2xl font-semibold text-slate-900">Manage your Life-AI membership</h2>
        <p className="text-sm text-slate-600">
          Securely manage renewals, payment methods, and invoices through Stripe&apos;s hosted billing experience.
        </p>
      </div>
      <div className="mt-6">
        <SignedIn>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 p-6 text-center">
            <p className="text-sm text-slate-600">
              Need to update your card or change plans? Open the Stripe billing portal.
            </p>
            <Button type="button" onClick={openPortal} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Opening portal..." : "Manage billing in Stripe"}
            </Button>
          </div>
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
