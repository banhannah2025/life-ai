import { Suspense } from "react";

import { SocialFeed } from "@/components/social/SocialFeed";
import { SearchView } from "@/components/search/SearchView";

type SocialPageSearchParams = {
  channel?: string | string[];
};

type SocialPageProps = {
  searchParams?: Promise<SocialPageSearchParams>;
};

export default async function SocialPage({ searchParams }: SocialPageProps) {
  const params = (await searchParams) ?? {};
  const channelParam = params.channel;
  const initialChannelId = Array.isArray(channelParam) ? channelParam[0] ?? null : channelParam ?? null;

  return (
    <div className="space-y-6">
      <SearchView
        mode="all"
        placeholder="Search for people, channels, and posts…"
        variant="inline"
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          </div>
        }
      >
        <SocialFeed initialChannelId={initialChannelId} />
      </Suspense>
    </div>
  );
}
