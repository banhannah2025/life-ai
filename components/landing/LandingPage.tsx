'use client';

import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, Sparkles, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Life-AI Community
            </span>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Social connection, research intelligence, and Synthesis AI in one collaborative workspace.
            </h1>
            <p className="max-w-xl text-base text-slate-200 sm:text-lg">
              Build your profile, tap into curated academic knowledge, and co-create with Synthesis AI. Upgrade when you&apos;re ready for legal research, drafting, and case management.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up/free">
                  Join free today
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent text-white hover:bg-white/10">
                <Link href="/subscriptions">Explore plans</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                End-to-end encrypted profiles
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-300" />
                Synthesis AI included
              </div>
            </div>
          </div>
          <Card className="border-white/10 bg-white/5 shadow-2xl backdrop-blur">
            <CardContent className="space-y-6 px-6 py-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">What you get on the Community plan</h2>
                <p className="text-sm text-slate-200">
                  Start for free. Save legal tooling, analytics, and case management for when your team needs them.
                </p>
              </div>
              <ul className="space-y-4 text-sm text-slate-100">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
                  AI-guided profile building with image uploads, bio coaching, and headline refinement.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
                  Collaborative social feed to share research wins, community updates, and restorative justice work.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
                  Academic research mode that blends curated sources with Synthesis AI answers.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
                  Ten Synthesis AI chats per day for brainstorming, drafting, and knowledge building.
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="space-y-4 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              Platform overview
            </p>
            <h2 className="text-3xl font-semibold text-white">Products that scale from community to case teams</h2>
            <p className="mx-auto max-w-3xl text-sm text-slate-200 sm:text-base">
              Life-AI bundles community collaboration, academic research, and enterprise-grade legal tooling into a unified workspace. Start with the Community plan and grow into advanced tiers as your needs evolve.
            </p>
            <Button variant="secondary" size="lg" asChild className="bg-white text-slate-900 hover:bg-white/90">
              <Link href="/subscriptions">
                View all plans
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ title, description, icon: Icon }) => (
              <div key={title} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300/10 text-emerald-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-200">{description}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRODUCT_HIGHLIGHTS.map(({ title, description, value, audiences }) => (
              <Card key={title} className="border-white/10 bg-white/[0.08] text-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="text-slate-200">{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-100">
                  <p className="font-semibold text-emerald-200">{value}</p>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-300">Ideal for</p>
                    <ul className="mt-2 space-y-1">
                      {audiences.map((audience) => (
                        <li key={audience} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden />
                          {audience}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/20 via-transparent to-sky-500/20 p-8 text-slate-100">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Ready when your legal team is.</h2>
              <p className="max-w-2xl text-sm text-slate-200">
                Upgrade to unlock legal research connectors, analytics dashboards, drafting workspaces, and case management automations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90">
                <Link href="/subscriptions">
                  Compare tiers
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent text-white/80 hover:bg-white/10">
                <Link href="/sign-in">
                  <LogIn className="h-4 w-4" />
                  Sign in to your workspace
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/30 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Life-AI by CCPROS. Built to serve community legal practitioners and restorative justice leaders.
      </footer>
    </div>
  );
}

type Feature = {
  title: string;
  description: string;
  icon: typeof Users;
};

type ProductHighlight = {
  title: string;
  description: string;
  value: string;
  audiences: string[];
};

const FEATURES: Feature[] = [
  {
    title: "Community-first profiles",
    description: "Showcase your mission, collaborators, and restorative justice impact with AI-assisted storytelling.",
    icon: Users,
  },
  {
    title: "AI that works like a teammate",
    description: "Synthesis AI drafts outreach, synthesizes research, and refines your writing in context.",
    icon: Sparkles,
  },
  {
    title: "Academic intelligence, curated",
    description: "Search across knowledge hubs and surface cross-disciplinary insights without digging through tabs.",
    icon: ShieldCheck,
  },
];

const PRODUCT_HIGHLIGHTS: ProductHighlight[] = [
  {
    title: "Community & Social",
    description: "Profiles, channels, and Synthesis AI co-writing help your team stay aligned and visible.",
    value: "Included in Community plan",
    audiences: ["Grassroots organizations", "Restorative justice leaders", "Community legal clinics"],
  },
  {
    title: "Research & Intelligence",
    description: "Academic connectors, blended search, and AI summaries deliver fast, citeable insights.",
    value: "Unlock with Legal Team plan",
    audiences: ["Legal researchers", "Policy analysts", "In-house innovation teams"],
  },
  {
    title: "Casework & Drafting",
    description: "Case management, drafting workspaces, document automation, and analytics dashboards.",
    value: "Available on Legal Team & Enterprise plans",
    audiences: ["Law firms & clinics", "Enterprise legal departments", "Justice system partners"],
  },
];
