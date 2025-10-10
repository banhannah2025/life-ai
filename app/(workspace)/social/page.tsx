import { Suspense } from "react";

import { SocialFeed } from "@/components/social/SocialFeed";

export default function SocialPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
        </div>
      }
    >
      <SocialFeed />
    </Suspense>
  );
}
