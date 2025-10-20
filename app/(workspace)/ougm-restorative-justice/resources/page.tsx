import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const shelves = [
  {
    href: "/ougm-restorative-justice/resources/module-1",
    title: "Module 1 · Restorative Justice Foundations",
    description: "Slides, trainer script, values mapping worksheet, and a foundations teaching video.",
    tags: ["slides", "trainer script", "worksheet"],
  },
  {
    href: "/ougm-restorative-justice/resources/module-2",
    title: "Module 2 · Trauma-Responsive Facilitation",
    description: "Grounding toolkit cards, regulation audio, trauma slide deck, and reference links.",
    tags: ["grounding", "audio", "slides"],
  },
  {
    href: "/ougm-restorative-justice/resources/module-3",
    title: "Module 3 · Circle Process & Conference Design",
    description: "Annotated circle scripts, facilitator quality rubric, scenario packets, and demo video.",
    tags: ["circle scripts", "rubric", "scenario packets"],
  },
  {
    href: "/ougm-restorative-justice/resources/module-4",
    title: "Module 4 · Accountability, Re-entry, and Reconciliation",
    description: "Agreement templates, dashboards, re-entry celebration checklist, and case-study media.",
    tags: ["agreements", "dashboards", "re-entry"],
  },
  {
    href: "/ougm-restorative-justice/resources/module-5",
    title: "Module 5 · Facilitator Wellness & Mutual Care",
    description: "Wellness slide deck, ProQOL self-assessment, Sabbath retreat guide, and resilience video.",
    tags: ["wellness", "assessment", "retreat"],
  },
];

export default function OUGMResourceIndexPage() {
  return (
    <>
      <div className="space-y-3">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          OUGM Restorative Justice Initiative
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Training Resource Library</h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Explore module-specific shelves for slides, facilitator notes, downloadable worksheets, and media curated for
          Union Gospel Mission restorative justice training. Everything here lives inside the OUGM ecosystem.
        </p>
      </div>

      <Separator />

      <div className="space-y-5">
        {shelves.map((shelf) => (
          <Card key={shelf.href} className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>
                <Link href={shelf.href} className="text-slate-900 hover:text-emerald-700 hover:underline">
                  {shelf.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{shelf.description}</p>
              <div className="flex flex-wrap gap-2">
                {shelf.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Link
                href={shelf.href}
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Open module shelf
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
