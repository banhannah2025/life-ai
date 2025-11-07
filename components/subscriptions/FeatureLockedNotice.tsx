import Link from "next/link";
import { Lock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FeatureLockedNoticeProps = {
  feature: string;
  planName?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function FeatureLockedNotice({
  feature,
  planName,
  description,
  actionHref = "/subscriptions",
  actionLabel = "Explore subscriptions",
}: FeatureLockedNoticeProps) {
  return (
    <Card className="mx-auto max-w-2xl border-amber-200 bg-white/90 shadow-sm">
      <CardHeader className="items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Lock className="h-5 w-5" />
        </span>
        <CardTitle className="text-lg font-semibold text-slate-900">{feature} is unavailable</CardTitle>
        <CardDescription className="text-sm text-slate-500">
          {description ??
            "Your current Life-AI membership does not include this workspace. Upgrade to unlock the feature."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center text-sm text-slate-600">
        {planName ? <p>Current plan: {planName}</p> : null}
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
