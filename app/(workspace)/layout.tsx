import { ReactNode } from "react";

import { NavBar } from "@/components/global/NavBar";
import { CaseManagementProvider } from "@/components/case-management/CaseManagementProvider";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CaseManagementProvider>
      <SidebarProvider>
        <NavBar />
        <div className="flex w-full min-h-screen bg-gray-100 pt-16">
          <AppSidebar />
          <SidebarInset className="flex-1 w-full bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CaseManagementProvider>
  );
}
