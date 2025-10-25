import { CaseAccessGate } from "@/components/case-management/CaseAccessGate";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { LibSearchBar } from "@/components/ui/LibSearchBar";

export default function LibraryPage() {
  return (
    <CaseAccessGate featureDescription="Library research can be linked directly to active matters for authorized legal teams.">
      <div className="space-y-12 px-4 pb-16">
        <LibraryBrowser />
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Need laser-precise legal search?</h2>
            <p className="text-sm text-slate-600">
              Drop into our advanced research console when you need multi-jurisdiction filtering, AI rewriting, or quick
              attachments to matters.
            </p>
          </div>
          <LibSearchBar />
        </section>
      </div>
    </CaseAccessGate>
  );
}
