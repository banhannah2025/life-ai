import type { ReactNode } from "react";

import { CaseAccessGate } from "@/components/case-management/CaseAccessGate";

export default function CaseManagementLayout({ children }: { children: ReactNode }) {
  return (
    <CaseAccessGate featureDescription="Case management consolidates matters, drafting, research, and timekeeping for authorized legal teams.">
      {children}
    </CaseAccessGate>
  );
}
