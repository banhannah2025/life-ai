import { CaseAccessGate } from "@/components/case-management/CaseAccessGate";
import { LibraryWorkspaceSwitcher } from "@/components/library/LibraryWorkspaceSwitcher";
import { LegalResearchResultsPanel } from "@/components/workspace/LegalResearchResultsPanel";

export default function LibraryPage() {
  return (
    <CaseAccessGate featureDescription="Library research can be linked directly to active matters for authorized legal teams.">
      <div className="space-y-10 px-4 pb-16">
        <LibraryWorkspaceSwitcher />
        <LegalResearchResultsPanel />
      </div>
    </CaseAccessGate>
  );
}
