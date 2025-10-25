import { CaseAccessGate } from "@/components/case-management/CaseAccessGate";
import { LibraryWorkspaceSwitcher } from "@/components/library/LibraryWorkspaceSwitcher";

export default function LibraryPage() {
  return (
    <CaseAccessGate featureDescription="Library research can be linked directly to active matters for authorized legal teams.">
      <div className="px-4 pb-16">
        <LibraryWorkspaceSwitcher />
      </div>
    </CaseAccessGate>
  );
}
