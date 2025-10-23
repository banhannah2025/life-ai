import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { AdminCodexWorkspace } from "@/components/admin/codex/AdminCodexWorkspace";
import { isAdminUser } from "@/lib/admin/guard";

export const metadata: Metadata = {
  title: "Life-AI Codex | Admin",
  description: "Collaborative AI coding environment for Life-AI administrators.",
};

export default async function AdminCodexPage() {
  const { userId } = await auth();
  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Life-AI Codex</h1>
        <p className="mt-2 text-sm text-slate-500">
          Pair with Groq models to plan changes, generate patches, and review Life-AI code safely before merging.
        </p>
      </div>
      <AdminCodexWorkspace />
    </div>
  );
}

