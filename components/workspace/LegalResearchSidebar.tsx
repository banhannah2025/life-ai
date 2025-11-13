'use client';

import { Loader2 } from "lucide-react";
import { useMemo } from "react";

import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { LibSearchBar } from "@/components/ui/LibSearchBar";
import { useLegalResearchResults } from "@/components/workspace/LegalResearchResultsContext";
import { useUserPlan } from "@/hooks/use-user-plan";
import { getPlan } from "@/lib/subscription/plans";

type ResearchMode = "legal" | "academic" | "ai";

export function LegalResearchSidebar() {
  const { beginSearch, completeSearch, failSearch } = useLegalResearchResults();
  const { planId, loading } = useUserPlan();

  const planMeta = useMemo(() => getPlan(planId), [planId]);
  const hasLegalAccess = planMeta.includesLegalResearch;
  const heading = hasLegalAccess ? "AI-Driven Legal Research" : "Academic Research Studio";
  const description = hasLegalAccess
    ? "Combine connector search with natural language synthesis and link insights to matters."
    : "Blend academic connectors with Synthesis AI to surface research-grade insights without legal tooling.";
  const communityResearchTypes: ResearchMode[] = ["academic", "ai"];
  const enabledResearchTypes: ResearchMode[] | undefined = hasLegalAccess ? undefined : communityResearchTypes;
  const initialResearchType: ResearchMode | undefined = hasLegalAccess ? undefined : "academic";
  const planBadge = loading ? "Checking plan" : `${planMeta.name} plan`;
  const planBadgeSuffix = hasLegalAccess ? "Full legal research access" : "Ten Synthesis AI requests per day";

  return (
    <Sidebar
      side="right"
      className="flex h-[calc(100vh-4rem)] flex-col border-l border-slate-200 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 md:top-16 md:bottom-0 md:h-[calc(100vh-4rem)]"
    >
      <SidebarHeader className="space-y-2 border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-6 text-left text-white">
        <div className="flex items-center gap-2 text-base font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-white/70" /> : null}
          <span>{heading}</span>
        </div>
        <p className="text-xs text-white/80">{description}</p>
        <p className="text-[11px] uppercase tracking-wide text-emerald-200">
          {planBadge} · {planBadgeSuffix}
        </p>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <LibSearchBar
          showHeader={false}
          variant="sidebar"
          initialResearchType={initialResearchType}
          enabledResearchTypes={enabledResearchTypes}
          searchLifecycle={{
            onStart: beginSearch,
            onSuccess: completeSearch,
            onError: failSearch,
          }}
        />
      </SidebarContent>
    </Sidebar>
  );
}
