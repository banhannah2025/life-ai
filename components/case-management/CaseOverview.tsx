'use client';

import Link from "next/link";

import {
  CASE_MANAGEMENT_NAV_ITEMS,
} from "@/components/ui/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";

export function CaseOverview() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-12">
      <p className="text-2xl font-semibold uppercase tracking-wide text-slate-700">Case management</p>
      <Card className="w-full border border-slate-200 bg-white/80 shadow-sm">
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {CASE_MANAGEMENT_NAV_ITEMS.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-lg border border-slate-100 bg-white/80 p-3 text-left shadow-sm transition hover:border-slate-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/5 text-slate-700 transition group-hover:bg-slate-900/10">
                <Icon className="h-4 w-4" />
              </span>
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-800">{label}</span>
                <span className="block text-xs text-slate-500">{description}</span>
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
