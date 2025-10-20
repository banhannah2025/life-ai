import { CaseAccessGate } from "@/components/case-management/CaseAccessGate";
import { LibSearchBar } from "@/components/ui/LibSearchBar";

export default function Library(){
    // Add Library Search Bar
    return (
    <CaseAccessGate featureDescription="Library research can be linked directly to active matters for authorized legal teams.">
      <div className="flex w-full justify-center px-4 pb-10">
        <LibSearchBar />
      </div>
    </CaseAccessGate>
    );
}
