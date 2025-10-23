'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

import {
  useCaseManagement,
  type CaseRecord,
  type ResearchAuthority,
  type ResearchItem,
} from "@/components/case-management/CaseManagementProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type ResearchStatus = ResearchItem["status"];

type ResearchFormState = {
  title: string;
  issue: string;
  jurisdiction: string;
  status: ResearchStatus;
  nextAction: string;
  analysts: string;
  summary: string;
  authorities: string;
  tags: string;
  caseIds: string[];
};

function createEmptyResearchForm(): ResearchFormState {
  return {
    title: "",
    issue: "",
    jurisdiction: "",
    status: "In Progress",
    nextAction: "",
    analysts: "",
    summary: "",
    authorities: "",
    tags: "",
    caseIds: [],
  };
}

function normalizeList(value: string) {
  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function parseAuthorities(text: string): ResearchAuthority[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [citation, court, holding] = line.split("|").map((segment) => segment.trim());
      return {
        citation,
        court: court || "Primary law",
        holding: holding || "Summary pending",
      };
    });
}

export function CaseAnalysis() {
  const { state, createResearchItem, updateResearchItem } = useCaseManagement();
  const { cases, research, documents } = state;

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [researchForm, setResearchForm] = useState<ResearchFormState>(() => createEmptyResearchForm());

  const [linkDialogState, setLinkDialogState] = useState<{ open: boolean; researchId: string | null }>({
    open: false,
    researchId: null,
  });
  const [linkSelection, setLinkSelection] = useState<string[]>([]);

  const statusGroups = useMemo(() => {
    return ["In Progress", "Needs Update", "Ready for Briefing"].map((status) => ({
      status: status as ResearchStatus,
      items: research.filter((item) => item.status === status),
    }));
  }, [research]);

  const aggregatedAuthorities = useMemo(() => {
    return research
      .flatMap((item) =>
        item.authorities.map((authority) => ({
          authority,
          researchTitle: item.title,
          matters: item.caseIds
            .map((caseId) => cases.find((matter) => matter.id === caseId))
            .filter((matter): matter is CaseRecord => Boolean(matter)),
          updatedAt: item.updatedAt,
        })),
      )
      .sort((a, b) => (a.authority.citation > b.authority.citation ? 1 : -1));
  }, [cases, research]);

  const caseResearch = useMemo(() => {
    return cases.map((matter) => ({
      matter,
      research: research.filter((item) => item.caseIds.includes(matter.id)),
      drafting: documents.filter((doc) => doc.caseIds.includes(matter.id)),
    }));
  }, [cases, research, documents]);

  const hasCases = cases.length > 0;

  function handleCreateResearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!researchForm.title.trim() || !researchForm.issue.trim()) {
      return;
    }

    createResearchItem({
      caseIds: researchForm.caseIds,
      title: researchForm.title.trim(),
      issue: researchForm.issue.trim(),
      jurisdiction: researchForm.jurisdiction.trim() || "Federal",
      status: researchForm.status,
      nextAction: researchForm.nextAction.trim() || undefined,
      analysts: normalizeList(researchForm.analysts),
      summary: researchForm.summary.trim(),
      authorities: parseAuthorities(researchForm.authorities),
      tags: normalizeList(researchForm.tags),
    });

    setResearchForm(createEmptyResearchForm());
    setCreateDialogOpen(false);
  }

  function openLinkDialog(item: ResearchItem) {
    setLinkSelection(item.caseIds);
    setLinkDialogState({ open: true, researchId: item.id });
  }

  function submitLinkDialog() {
    if (!linkDialogState.researchId) {
      return;
    }
    updateResearchItem(linkDialogState.researchId, { caseIds: linkSelection });
    setLinkDialogState({ open: false, researchId: null });
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case management · Analysis</p>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Arguments, authorities, and insight</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Track every research thread alongside its matters. Attach holdings, note follow-ups, and sync with
              drafting so the right authority lands in the right brief.
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">Log research insight</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form className="space-y-6" onSubmit={handleCreateResearch}>
              <DialogHeader>
                <DialogTitle>Capture legal research</DialogTitle>
                <DialogDescription>
                  Link this analysis to active matters so drafting teams can reference it instantly.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="research-title">Title</Label>
                  <Input
                    id="research-title"
                    required
                    value={researchForm.title}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Implied covenant & commercial impracticability"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="research-issue">Issue / hypothesis</Label>
                  <Textarea
                    id="research-issue"
                    required
                    rows={3}
                    value={researchForm.issue}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, issue: event.target.value }))}
                    placeholder="Whether supply-chain disruption satisfies the commercial impracticability doctrine."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="research-jurisdiction">Jurisdiction</Label>
                  <Input
                    id="research-jurisdiction"
                    value={researchForm.jurisdiction}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, jurisdiction: event.target.value }))}
                    placeholder="Second Circuit · New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="research-status">Status</Label>
                  <Select
                    value={researchForm.status}
                    onValueChange={(value) => setResearchForm((prev) => ({ ...prev, status: value as ResearchStatus }))}
                  >
                    <SelectTrigger id="research-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Progress">In progress</SelectItem>
                      <SelectItem value="Needs Update">Needs update</SelectItem>
                      <SelectItem value="Ready for Briefing">Ready for briefing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="research-analysts">Analysts / owners</Label>
                  <Input
                    id="research-analysts"
                    value={researchForm.analysts}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, analysts: event.target.value }))}
                    placeholder="Comma separated · e.g. Allison Gomez, Riley Chen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="research-next-action">Next action</Label>
                  <Input
                    id="research-next-action"
                    value={researchForm.nextAction}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, nextAction: event.target.value }))}
                    placeholder="Incorporate citations into opposition brief section II."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="research-summary">Key takeaways</Label>
                  <Textarea
                    id="research-summary"
                    rows={3}
                    value={researchForm.summary}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, summary: event.target.value }))}
                    placeholder="Summarize holdings, factual alignment, or key risks uncovered."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="research-authorities">Authorities (one per line)</Label>
                  <Textarea
                    id="research-authorities"
                    rows={4}
                    value={researchForm.authorities}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, authorities: event.target.value }))}
                    placeholder="Citation | Court | Holding summary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="research-tags">Tags</Label>
                  <Input
                    id="research-tags"
                    value={researchForm.tags}
                    onChange={(event) => setResearchForm((prev) => ({ ...prev, tags: event.target.value }))}
                    placeholder="Contract, Supply Chain"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Attach to matters</Label>
                  {hasCases ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cases.map((matter) => {
                        const isChecked = researchForm.caseIds.includes(matter.id);
                        return (
                          <label
                            key={matter.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                setResearchForm((prev) => ({
                                  ...prev,
                                  caseIds: checked
                                    ? [...prev.caseIds, matter.id]
                                    : prev.caseIds.filter((id) => id !== matter.id),
                                }))
                              }
                            />
                            <span>
                              <span className="block font-medium text-slate-800">{matter.caseName}</span>
                              <span className="text-xs text-slate-500">{matter.practiceArea}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      Add a client and matter first so you can associate this research.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save research</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          {statusGroups.map((group) => (
            <Card key={group.status} className="border border-slate-200/70 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{group.status}</CardDescription>
                <CardTitle className="text-2xl font-semibold text-slate-900">{group.items.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  {group.status === "Ready for Briefing"
                    ? "Citations available for drafting"
                    : group.status === "Needs Update"
                      ? "Review open changes before filing"
                      : "Actively researching"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Research queue</CardTitle>
            <CardDescription>Follow-ups and owners for active research branches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {research.length ? (
              research.map((item) => {
                const matters = item.caseIds
                  .map((caseId) => cases.find((matter) => matter.id === caseId))
                  .filter((matter): matter is CaseRecord => Boolean(matter));

                return (
                  <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <span className="text-xs uppercase tracking-wide text-slate-400">{item.jurisdiction}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{item.issue}</p>
                    {item.summary ? <p className="mt-2 text-xs text-slate-500">{item.summary}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matters.map((matter) => (
                        <Badge key={`${item.id}-${matter.id}`} variant="outline" className="text-xs text-slate-500">
                          {matter.caseName}
                        </Badge>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          Owners:{" "}
                          {item.analysts.length ? item.analysts.join(", ") : "Unassigned"}
                        </span>
                        {item.nextAction ? (
                          <>
                            <Separator orientation="vertical" className="hidden h-4 md:block" />
                            <span>Next: {item.nextAction}</span>
                          </>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateResearchItem(item.id, { status: value as ResearchStatus })}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="In Progress">In progress</SelectItem>
                            <SelectItem value="Needs Update">Needs update</SelectItem>
                            <SelectItem value="Ready for Briefing">Ready for briefing</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="sm" onClick={() => openLinkDialog(item)}>
                          Edit case links
                        </Button>
                        {item.status !== "Ready for Briefing" ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => updateResearchItem(item.id, { status: "Ready for Briefing" })}
                          >
                            Mark ready
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => updateResearchItem(item.id, { status: "Needs Update" })}
                          >
                            Flag follow-up
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No research logged yet. Capture your first argument above.</p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/case-management/document-drafting">Sync with drafting</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Authority library</CardTitle>
            <CardDescription>Holdings curated across matters ready for citation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aggregatedAuthorities.length ? (
              aggregatedAuthorities.map((entry, index) => (
                <div key={`${entry.authority.citation}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-800">{entry.authority.citation}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{entry.authority.court}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{entry.authority.holding}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2 py-1">Research: {entry.researchTitle}</span>
                    {entry.matters.map((matter) => (
                      <span key={`${entry.authority.citation}-${matter.id}`} className="rounded-full bg-slate-100 px-2 py-1">
                        {matter.caseName}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Updated {format(parseISO(entry.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Add authorities to research entries to populate this shared citation shelf.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Research by matter</h2>
          <p className="text-sm text-slate-500">
            Navigate research threads alongside drafting progress for each case.
          </p>
        </header>
        <div className="grid gap-4 xl:grid-cols-2">
          {caseResearch.length ? caseResearch.map(({ matter, research: matterResearch, drafting }) => (
            <Card key={matter.id} className="flex flex-col border border-slate-200/70 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900">{matter.caseName}</CardTitle>
                <CardDescription>{matter.practiceArea}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {matterResearch.length ? (
                  matterResearch.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.issue}</p>
                        </div>
                        <Badge
                          variant={
                            item.status === "Ready for Briefing"
                              ? "secondary"
                              : item.status === "Needs Update"
                                ? "destructive"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {item.authorities.map((authority, index) => (
                          <div key={`${item.id}-authority-${index}`} className="rounded border border-slate-100 bg-white/70 p-2">
                            <p className="text-xs font-medium text-slate-700">{authority.citation}</p>
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">{authority.court}</p>
                            <p className="mt-1 text-xs text-slate-500">{authority.holding}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No research linked yet.</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{drafting.length} drafting item(s) connected</span>
                <Separator orientation="vertical" className="hidden h-4 md:block" />
                <Button asChild size="sm" variant="outline">
                  <Link href={`/case-management/document-drafting?case=${matter.id}`}>Drafting workspace</Link>
                </Button>
              </CardFooter>
            </Card>
          )) : (
            <Card className="border border-slate-200/70 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900">No matters yet</CardTitle>
                <CardDescription>Create a matter to start tracking research alongside drafting.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Once you add clients and matters, their research summaries will appear here.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Dialog
        open={linkDialogState.open}
        onOpenChange={(open) =>
          setLinkDialogState((prev) => ({ open, researchId: open ? prev.researchId : null }))
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update matter links</DialogTitle>
            <DialogDescription>Select every case that should rely on this research package.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {cases.map((matter) => {
              const isChecked = linkSelection.includes(matter.id);
              return (
                <label
                  key={`link-${matter.id}`}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      setLinkSelection((prev) =>
                        checked ? [...prev, matter.id] : prev.filter((id) => id !== matter.id),
                      )
                    }
                  />
                  <span>
                    <span className="block font-medium text-slate-800">{matter.caseName}</span>
                    <span className="text-xs text-slate-500">{matter.practiceArea}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkDialogState({ open: false, researchId: null })}>
              Cancel
            </Button>
            <Button type="button" onClick={submitLinkDialog}>
              Save links
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
