'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

import {
  useCaseManagement,
  type CaseRecord,
  type CaseType,
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type CaseStage = CaseRecord["stage"];
type PriorityLevel = CaseRecord["priority"];

type CaseFormState = {
  caseName: string;
  clientId: string | null;
  clientName: string;
  matterNumber: string;
  practiceArea: string;
  stage: CaseStage;
  priority: PriorityLevel;
  leadAttorney: string;
  team: string;
  openedOn: string;
  nextDeadline: string;
  description: string;
  tags: string;
  riskNotes: string;
  caseType: CaseType;
  programTag: string;
};

const stageOptions: { value: CaseStage; label: string }[] = [
  { value: "intake", label: "Intake & conflicts" },
  { value: "investigation", label: "Investigation" },
  { value: "discovery", label: "Discovery" },
  { value: "briefing", label: "Briefing & motions" },
  { value: "hearing", label: "Hearings & trial" },
  { value: "appeal", label: "Appeal" },
  { value: "closed", label: "Closed" },
];

const priorityLabels: Record<PriorityLevel, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  low: { label: "Low", variant: "outline" },
  medium: { label: "Medium", variant: "secondary" },
  high: { label: "High", variant: "destructive" },
};

function createEmptyCaseForm(): CaseFormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    caseName: "",
    clientId: null,
    clientName: "",
    matterNumber: "",
    practiceArea: "",
    stage: "intake",
    priority: "medium",
    leadAttorney: "",
    team: "",
    openedOn: today,
    nextDeadline: "",
    description: "",
    tags: "",
    riskNotes: "",
    caseType: "legal",
    programTag: "",
  };
}

function toTitle(value: string) {
  return value
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeList(value: string) {
  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }
  return format(parseISO(value), "MMM d, yyyy");
}

export function CaseOverview() {
  const { state, createCase, updateCase, createClient } = useCaseManagement();
  const { cases, clients, documents, research, activity } = state;
  const legalCases = useMemo(() => cases.filter((matter) => matter.caseType === "legal"), [cases]);

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [caseForm, setCaseForm] = useState<CaseFormState>(() => createEmptyCaseForm());
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const practiceAreas = useMemo(() => {
    const defaults = new Set<string>();
    legalCases.forEach((matter) => defaults.add(matter.practiceArea));
    return Array.from(defaults).sort((a, b) => a.localeCompare(b));
  }, [legalCases]);

  const clientLookup = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client]));
  }, [clients]);

  const hasClients = clients.length > 0;
  const hasCases = legalCases.length > 0;

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return legalCases
      .filter((matter) => matter.nextDeadline)
      .map((matter) => ({
        ...matter,
        deadline: matter.nextDeadline ? parseISO(matter.nextDeadline) : undefined,
      }))
      .filter((matter): matter is CaseRecord & { deadline: Date } => Boolean(matter.deadline))
      .filter((matter) => differenceInCalendarDays(matter.deadline, now) >= -3)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [legalCases]);

  const documentsInFlight = useMemo(() => documents.filter((doc) => doc.status !== "Finalized"), [documents]);
  const researchNeedingAttention = useMemo(
    () => research.filter((item) => item.status !== "Ready for Briefing"),
    [research],
  );

  const metrics = useMemo(() => {
    const now = new Date();
    const activeMatters = legalCases.filter((matter) => matter.status !== "closed");
    const briefingCount = activeMatters.filter((matter) => matter.stage === "briefing").length;
    const nextDeadlineSummary = upcomingDeadlines[0]
      ? `${upcomingDeadlines[0].caseName.split(" ")[0]} · ${format(upcomingDeadlines[0].deadline, "MMM d")}`
      : "No deadlines due";
    return [
      {
        label: "Active matters",
        value: activeMatters.length,
        helper: briefingCount ? `${briefingCount} in briefing` : "Start by adding a matter",
      },
      {
        label: "Clients supported",
        value: clients.length,
        helper: clients.filter((client) => client.caseIds.length).length
          ? `${clients.filter((client) => client.caseIds.length).length} with open work`
          : "No clients yet",
      },
      {
        label: "Deadlines (14 days)",
        value: upcomingDeadlines.filter((matter) => differenceInCalendarDays(matter.deadline, now) <= 14).length,
        helper: nextDeadlineSummary,
      },
      {
        label: "Research tracks",
        value: research.length,
        helper: researchNeedingAttention.length ? `${researchNeedingAttention.length} need updates` : "Log research to track progress",
      },
    ];
  }, [legalCases, clients, research, researchNeedingAttention.length, upcomingDeadlines]);

  const stageGroups = useMemo(() => {
    return stageOptions.map((stage) => ({
      ...stage,
      cases: legalCases.filter((matter) => matter.stage === stage.value),
    }));
  }, [legalCases]);

  const filteredCases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return legalCases
      .filter((matter) => (stageFilter === "all" ? true : matter.stage === stageFilter))
      .filter((matter) => {
        if (!term) {
          return true;
        }
        const haystack = `${matter.caseName} ${matter.clientName ?? ""} ${matter.matterNumber} ${matter.tags.join(" ")}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => {
        if (a.priority === b.priority) {
          return a.caseName.localeCompare(b.caseName);
        }
        const priorityOrder: PriorityLevel[] = ["high", "medium", "low"];
        return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
      });
  }, [legalCases, stageFilter, searchTerm]);

  function resetForm() {
    setCaseForm(createEmptyCaseForm());
  }

  function handleCreateMatter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !caseForm.caseName.trim() ||
      (!caseForm.clientId && !caseForm.clientName.trim()) ||
      !caseForm.leadAttorney.trim()
    ) {
      return;
    }

    let clientId = caseForm.clientId ?? null;
    let clientName = caseForm.clientName.trim();
    if (clientId) {
      clientName = clientName || clientLookup.get(clientId)?.name ?? "";
    } else if (clientName) {
      const existingClient = clients.find((client) => client.name.toLowerCase() === clientName.toLowerCase());
      if (existingClient) {
        clientId = existingClient.id;
        clientName = existingClient.name;
      } else {
        clientId = createClient({ name: clientName });
      }
    }

    createCase({
      caseName: caseForm.caseName.trim(),
      client: clientName,
      clientId,
      matterNumber: caseForm.matterNumber.trim() || `MAT-${Date.now()}`,
      practiceArea:
        caseForm.practiceArea.trim() ||
        (caseForm.caseType === "restorative"
          ? "Restorative Justice"
          : caseForm.caseType === "mock_trial"
            ? "Mock Trial"
            : "General Practice"),
      stage: caseForm.stage,
      status: "active",
      leadAttorney: caseForm.leadAttorney.trim(),
      team: normalizeList(caseForm.team),
      openedOn: caseForm.openedOn,
      nextDeadline: caseForm.nextDeadline ? caseForm.nextDeadline : undefined,
      description: caseForm.description.trim(),
      priority: caseForm.priority,
      tags: normalizeList(caseForm.tags),
      riskNotes: caseForm.riskNotes.trim() || undefined,
      caseType: caseForm.caseType,
      programTag: caseForm.programTag.trim() || null,
      restorativeProfile: caseForm.caseType === "restorative" ? undefined : null,
      mockTrialProfile: caseForm.caseType === "mock_trial" ? undefined : null,
    });

    resetForm();
    setCreateDialogOpen(false);
  }

  function updateStage(caseId: string, nextStage: CaseStage) {
    updateCase(caseId, { stage: nextStage });
  }

  return (
    <div className="space-y-9">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case management</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Operational overview</h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Monitor matters, connect research, and keep drafting on track. This dashboard links every client and case
              so the next action is always clear.
            </p>
            {!hasClients && !hasCases ? (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                You haven&apos;t added any clients or matters yet. Start by creating your first client and matter to unlock analytics.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/case-management/clients">Manage clients</Link>
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogContent className="sm:max-w-xl">
              <form className="space-y-6" onSubmit={handleCreateMatter}>
                <DialogHeader>
                  <DialogTitle>Create a new matter</DialogTitle>
                  <DialogDescription>
                    Link the new case to a client and capture the essentials so drafting, research, and billing stay in sync.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="case-name">Matter name</Label>
                    <Input
                      id="case-name"
                      required
                      value={caseForm.caseName}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, caseName: event.target.value }))}
                      placeholder="Acme Corp. v. Finch Supply Co."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Client</Label>
                    <Select
                      value={caseForm.clientId ?? ""}
                      onValueChange={(value) => {
                        const clientId = value || null;
                        const client = clientId ? clientLookup.get(clientId) : null;
                        setCaseForm((prev) => ({
                          ...prev,
                          clientId,
                          clientName: client ? client.name : prev.clientName,
                        }));
                      }}
                    >
                      <SelectTrigger id="case-client">
                        <SelectValue placeholder="Select existing client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned / New client</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Choose an existing client or leave blank to enter a new client name.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="case-client-name">Client name</Label>
                    <Input
                      id="case-client-name"
                      value={caseForm.clientName}
                      onChange={(event) =>
                        setCaseForm((prev) => ({
                          ...prev,
                          clientName: event.target.value,
                        }))
                      }
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matter-number">Matter number</Label>
                    <Input
                      id="matter-number"
                      value={caseForm.matterNumber}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, matterNumber: event.target.value }))}
                      placeholder="2024-L-0012"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practice-area">Practice area</Label>
                    <Input
                      id="practice-area"
                      value={caseForm.practiceArea}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, practiceArea: event.target.value }))}
                      list={practiceAreas.length ? "practice-area-suggestions" : undefined}
                      placeholder="e.g. Commercial Litigation"
                    />
                    {practiceAreas.length ? (
                      <datalist id="practice-area-suggestions">
                        {practiceAreas.map((area) => (
                          <option key={area} value={area} />
                        ))}
                      </datalist>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-attorney">Lead attorney</Label>
                    <Input
                      id="lead-attorney"
                      required
                      value={caseForm.leadAttorney}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, leadAttorney: event.target.value }))}
                      placeholder="Katherine Monroe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-members">Team</Label>
                    <Input
                      id="team-members"
                      value={caseForm.team}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, team: event.target.value }))}
                      placeholder="Comma separated · e.g. Jordan Patel, Leo Choi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Stage</Label>
                    <Select value={caseForm.stage} onValueChange={(value) => setCaseForm((prev) => ({ ...prev, stage: value as CaseStage }))}>
                      <SelectTrigger id="stage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="case-type">Case type</Label>
                    <Select
                      value={caseForm.caseType}
                      onValueChange={(value) => setCaseForm((prev) => ({ ...prev, caseType: value as CaseType }))}
                    >
                      <SelectTrigger id="case-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="restorative">OUGM Restorative</SelectItem>
                        <SelectItem value="mock_trial">Mock Trial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-tag">Program / portal tag</Label>
                    <Input
                      id="program-tag"
                      value={caseForm.programTag}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, programTag: event.target.value }))}
                      placeholder="e.g. OUGM Cohort A or Spring Mock"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={caseForm.priority}
                      onValueChange={(value) => setCaseForm((prev) => ({ ...prev, priority: value as PriorityLevel }))}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opened-on">Opened</Label>
                    <Input
                      id="opened-on"
                      type="date"
                      value={caseForm.openedOn}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, openedOn: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next-deadline">Next deadline</Label>
                    <Input
                      id="next-deadline"
                      type="date"
                      value={caseForm.nextDeadline}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, nextDeadline: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Matter summary</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={caseForm.description}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="Capture objectives, counterparties, or risk factors shaping the strategy."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={caseForm.tags}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, tags: event.target.value }))}
                      placeholder="Contract, Supply Chain"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk-notes">Risk notes</Label>
                    <Textarea
                      id="risk-notes"
                      rows={2}
                      value={caseForm.riskNotes}
                      onChange={(event) => setCaseForm((prev) => ({ ...prev, riskNotes: event.target.value }))}
                      placeholder="Document cost sensitivities, regulators, or reputational items."
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    resetForm();
                    setCreateDialogOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Create matter</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border border-slate-200/70 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold text-slate-900">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{metric.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {hasCases ? (
          stageGroups.map((group) => (
            <Card key={group.value} className="flex flex-col border border-slate-200/70 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-slate-900">
                  <span>{group.label}</span>
                  <Badge variant="outline" className="text-xs text-slate-500">
                    {group.cases.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {group.cases.length ? "Top matters by urgency" : "No matters in this stage"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {group.cases.slice(0, 4).map((matter) => {
                  const deadlineText = matter.nextDeadline ? formatDate(matter.nextDeadline) : "Unscheduled";
                  const daysToDeadline = matter.nextDeadline ? differenceInCalendarDays(parseISO(matter.nextDeadline), new Date()) : null;
                  const deadlineClass =
                    daysToDeadline === null
                      ? "text-slate-500"
                      : daysToDeadline < 0
                        ? "text-rose-600"
                        : daysToDeadline <= 5
                          ? "text-amber-600"
                          : "text-slate-500";
                  const priorityMeta = priorityLabels[matter.priority];
                  const clientName = matter.clientName ?? clientLookup.get(matter.clientId ?? "")?.name ?? "Unassigned client";

                  return (
                    <div key={matter.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{matter.caseName}</p>
                          <p className="text-xs text-slate-500">{clientName}</p>
                        </div>
                        <Badge variant={priorityMeta.variant} className="text-xs capitalize">
                          {priorityMeta.label}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{matter.leadAttorney}</span>
                        <Separator orientation="vertical" className="hidden h-4 sm:block" />
                        <span className={deadlineClass}>Next: {deadlineText}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="justify-end">
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/case-management/case-analysis">Open analysis workspace</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : null}
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Matter list</h2>
            <p className="text-sm text-slate-500">
              Filter by stage or search across clients, matter numbers, and tags.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-64">
              <Label htmlFor="matter-search" className="sr-only">
                Search matters
              </Label>
              <Input
                id="matter-search"
                placeholder="Search active matters"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="w-full sm:w-52">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="min-w-[220px]">Matter</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Next deadline</TableHead>
                    <TableHead>Workstreams</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length ? (
                    filteredCases.map((matter) => {
                      const priorityMeta = priorityLabels[matter.priority];
                      const deadline = matter.nextDeadline ? parseISO(matter.nextDeadline) : null;
                      const daysToDeadline = deadline ? differenceInCalendarDays(deadline, new Date()) : null;
                      const deadlineClass =
                        daysToDeadline === null
                          ? "text-slate-500"
                          : daysToDeadline < 0
                            ? "text-rose-600"
                            : daysToDeadline <= 5
                              ? "text-amber-600"
                              : "text-slate-700";
                      const clientName = matter.clientName ?? clientLookup.get(matter.clientId ?? "")?.name ?? "Unassigned client";

                      return (
                        <TableRow key={matter.id}>
                          <TableCell className="align-top">
                            <div className="flex flex-col gap-1 text-sm text-slate-800">
                              <span className="font-semibold">{matter.caseName}</span>
                              <span className="text-xs text-slate-500">
                                {matter.matterNumber || "Unassigned"} · Opened {formatDate(matter.openedOn)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-sm text-slate-600">{clientName}</TableCell>
                          <TableCell className="align-top">
                            <Select
                              value={matter.stage}
                              onValueChange={(value) => updateStage(matter.id, value as CaseStage)}
                            >
                              <SelectTrigger className="h-9 w-[180px] text-left">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stageOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge variant={priorityMeta.variant} className="text-xs capitalize">
                              {priorityMeta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className={`align-top text-sm ${deadlineClass}`}>
                            {deadline ? format(deadline, "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell className="align-top text-sm text-slate-600">
                            <div className="flex flex-col gap-1">
                              <span>{matter.leadAttorney}</span>
                              <span className="text-xs text-slate-400">
                                {toTitle(matter.priority)} priority · {matter.documentIds.length} docs ·{" "}
                                {matter.researchIds.length} research
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/case-management/case-analysis?case=${matter.id}`} prefetch={false}>
                                Open workspace
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                        No matters match this filter. Try broadening your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Upcoming deadlines</CardTitle>
            <CardDescription>Matters with deadlines due, overdue, or recently scheduled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasCases && upcomingDeadlines.length ? (
              upcomingDeadlines.slice(0, 6).map((matter) => {
                const daysToDeadline = differenceInCalendarDays(matter.deadline, new Date());
                const deadlineClass =
                  daysToDeadline < 0 ? "text-rose-600" : daysToDeadline <= 5 ? "text-amber-600" : "text-slate-600";
                const linkedDocs = documentsInFlight.filter((doc) => doc.caseIds.includes(matter.id));
                const clientName = matter.clientName ?? clientLookup.get(matter.clientId ?? "")?.name ?? "Unassigned client";

                return (
                  <div key={`${matter.id}-deadline`} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{matter.caseName}</span>
                        <span className="text-xs text-slate-500">{clientName}</span>
                      </div>
                      <span className={`text-xs font-semibold ${deadlineClass}`}>
                        {format(matter.deadline, "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Lead: {matter.leadAttorney}</span>
                      {linkedDocs.length ? (
                        <span>{linkedDocs.length} drafting item(s)</span>
                      ) : (
                        <span>No linked drafts</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No upcoming deadlines yet.</p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/case-management/document-drafting">Manage drafting queue</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Research highlights</CardTitle>
            <CardDescription>
              Legal analysis tied directly to matters so drafting teams can cite with confidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {research.length ? (
              research.map((item) => {
                const linkedCases = item.caseIds
                  .map((caseId) => cases.find((matter) => matter.id === caseId))
                  .filter((matter): matter is CaseRecord => Boolean(matter));
                return (
                  <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{item.jurisdiction}</p>
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
                    <p className="mt-2 text-xs text-slate-500">{item.issue}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                      {linkedCases.map((matter) => (
                        <span key={`${item.id}-${matter.id}`} className="rounded-full bg-slate-100 px-2 py-1">
                          {matter.caseName}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                No linked research yet. Capture authorities from the analysis workspace to populate this view.
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild size="sm">
              <Link href="/case-management/case-analysis">Open analysis workspace</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section>
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Recent activity</CardTitle>
            <CardDescription>
              Every new case, document, research thread, and time entry recorded across the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length ? (
              activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-md border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-xs text-slate-400">
                      {format(parseISO(item.timestamp), "MMM d, yyyy · h:mm a")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.relatedCaseIds.map((caseId) => {
                      const matter = cases.find((record) => record.id === caseId);
                      if (!matter) {
                        return null;
                      }
                      return (
                        <Badge key={`${item.id}-${caseId}`} variant="outline" className="text-xs text-slate-500">
                          {matter.caseName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent activity captured yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
