'use client';

import { useState } from "react";
import { BookOpen, Gavel, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { LibSearchBar } from "@/components/ui/LibSearchBar";
import { cn } from "@/lib/utils";

type WorkspaceView = "library" | "academic";

const VIEW_META: Record<
  WorkspaceView,
  {
    heading: string;
    description: string;
  }
> = {
  library: {
    heading: "Interactive library browser",
    description: "Scan curated playbooks, field guides, and datasets with advanced filters.",
  },
  academic: {
    heading: "Academic research studio",
    description: "Interrogate scholarly sources with AI synthesis and curated academic connectors.",
  },
};

export function LibraryWorkspaceSwitcher() {
  const [view, setView] = useState<WorkspaceView>("library");
  const meta = VIEW_META[view];

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Workspace mode</p>
            <h1 className="text-2xl font-semibold text-slate-900">{meta.heading}</h1>
            <p className="text-sm text-slate-600">{meta.description}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
              <ModeToggleButton
                icon={BookOpen}
                label="Library browser"
                active={view === "library"}
                onClick={() => setView("library")}
              />
              <ModeToggleButton
                icon={Gavel}
                label="Academic research"
                active={view === "academic"}
                onClick={() => setView("academic")}
              />
            </div>
          </div>
        </div>
      </div>

      {view === "library" ? (
        <LibraryBrowser />
      ) : (
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Synthesize academic intelligence faster</h2>
            <p className="text-sm text-slate-600">
              Lead with AI synthesis as your primary agent while reviewing the top five matches from every connected source.
            </p>
          </div>
          <LibSearchBar
            heading="Academic Research"
            description="Blend natural language prompts with academic connectors. AI synthesis surfaces cross-source insights while we list the top five results across disciplines."
          />
        </section>
      )}
    </div>
  );
}

type ModeToggleButtonProps = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
};

function ModeToggleButton({ icon: Icon, label, active, onClick }: ModeToggleButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2 rounded-full px-4",
        active ? "bg-emerald-600 text-white hover:bg-emerald-600" : "text-slate-600 hover:bg-transparent"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
