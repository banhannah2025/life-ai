'use client';

import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { LibSearchBar } from "@/components/ui/LibSearchBar";
import { useLegalResearchResults } from "@/components/workspace/LegalResearchResultsContext";

export function LegalResearchSidebar() {
    const { beginSearch, completeSearch, failSearch } = useLegalResearchResults();

    return (
        <Sidebar
            side="right"
            className="flex h-[calc(100vh-4rem)] flex-col border-l border-slate-200 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 md:top-16 md:bottom-0 md:h-[calc(100vh-4rem)]"
        >
            <SidebarHeader className="space-y-1 border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-6 text-left text-white">
                <div className="text-base font-semibold">AI-Driven Legal Research</div>
                <p className="text-xs text-white/80">Combine connector search with natural language synthesis and link insights to matters.</p>
            </SidebarHeader>
            <SidebarContent className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                <LibSearchBar
                    showHeader={false}
                    variant="sidebar"
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
