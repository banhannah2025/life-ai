'use client';

import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { NavBar } from "@/components/global/NavBar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LegalResearchSidebar } from "@/components/workspace/LegalResearchSidebar";
import { LegalResearchResultsProvider, useLegalResearchResults } from "@/components/workspace/LegalResearchResultsContext";
import { LegalResearchResultsPanel } from "@/components/workspace/LegalResearchResultsPanel";
import { LandingPage } from "@/components/landing/LandingPage";
import { Loader2 } from "lucide-react";

const LEGAL_ROUTE_PREFIXES = [
  "/case-management",
  "/cases",
  "/legal-analytics",
  "/library",
];

type WorkspaceShellProps = {
  children: ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  const isLegalRoute = useMemo(() => {
    if (!pathname) {
      return false;
    }

    return LEGAL_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          <span>Loading workspace…</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return (
    <SidebarProvider>
      <NavBar />
      <LegalResearchResultsProvider>
        <WorkspaceLayoutContent isLegalRoute={isLegalRoute}>
          {children}
        </WorkspaceLayoutContent>
      </LegalResearchResultsProvider>
    </SidebarProvider>
  );
}

function WorkspaceLayoutContent({
  children,
  isLegalRoute,
}: {
  children: ReactNode;
  isLegalRoute: boolean;
}) {
  const { state } = useLegalResearchResults();
  const shouldShowResults = isLegalRoute && state.status !== "idle";

  return (
    <div className="flex min-h-screen w-full bg-gray-100 pt-16">
      <AppSidebar side="left" />
      <SidebarInset className="w-full flex-1 bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
        {shouldShowResults ? <LegalResearchResultsPanel /> : children}
      </SidebarInset>
      {isLegalRoute ? <LegalResearchSidebar /> : null}
    </div>
  );
}
