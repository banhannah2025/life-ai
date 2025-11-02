'use client';

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CaseOverview() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case management</p>
        <h1 className="text-3xl font-semibold text-slate-900">Operational overview</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Monitor matters, connect research, and keep drafting on track. Access the full legal analytics experience to
          review matters, clients, documents, and more.
        </p>
      </div>
      <Button asChild size="lg" className="px-8">
        <Link href="/legal-analytics">View legal analytics</Link>
      </Button>
    </div>
  );
}
