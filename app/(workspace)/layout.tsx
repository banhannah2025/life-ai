import { ReactNode } from "react";

import { CaseManagementProvider } from "@/components/case-management/CaseManagementProvider";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CaseManagementProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </CaseManagementProvider>
  );
}
