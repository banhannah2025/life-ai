'use client';

import { useState } from "react";
import { BookOpen, Gavel, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { LibSearchBar } from "@/components/ui/LibSearchBar";
import { cn } from "@/lib/utils";

type WorkspaceView = "library" | "legal";

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
  legal: {
    heading: "Precision legal research console",
    description: "Switch to connector-ready legal search with jurisdiction filters and AI assistance.",
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
              <ModeToggleButton icon={Gavel} label="Legal research" active={view === "legal"} onClick={() => setView("legal")} />
            </div>
          </div>
        </div>
      </div>

      {view === "library" ? (
        <LibraryBrowser />
      ) : (
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Need laser-precise legal search?</h2>
            <p className="text-sm text-slate-600">
              Drop into our advanced research console when you need multi-jurisdiction filtering, AI rewriting, or quick attachments
              to matters.
            </p>
          </div>
          <LibSearchBar />
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
