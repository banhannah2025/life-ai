import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { isAdminUser } from "@/lib/admin/guard";
import { fetchAdminUserDirectory } from "@/lib/admin/users";

export const metadata: Metadata = {
  title: "Admin Dashboard | Life-AI",
  description: "Administrative tools and member insights for Life-AI.",
};

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) {
    notFound();
  }

  const users = await fetchAdminUserDirectory();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage member access, review community activity, and keep the network healthy.
        </p>
      </div>
      <AdminDashboard users={users} />
    </div>
  );
}
