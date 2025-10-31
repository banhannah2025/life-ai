'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";

import {
  useCaseManagement,
  type CaseRecord,
  type TimeEntry,
  type TimeEntryStatus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TimeEntryFormState = {
  caseId: string;
  author: string;
  activity: string;
  hours: string;
  date: string;
  status: TimeEntryStatus;
  notes: string;
};

function coerceHours(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createEmptyTimeForm(): TimeEntryFormState {
  return {
    caseId: "",
    author: "",
    activity: "",
    hours: "",
    date: new Date().toISOString().slice(0, 10),
    status: "Draft",
    notes: "",
  };
}

export function CaseTimeTracking() {
  const { state, logTimeEntry, updateTimeEntry } = useCaseManagement();
  const { cases, timeEntries } = state;

  const [timeForm, setTimeForm] = useState<TimeEntryFormState>(() => createEmptyTimeForm());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [caseFilter, setCaseFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const entries = useMemo(() => {
    const sorted = [...timeEntries].sort((a, b) => (a.date > b.date ? -1 : 1));
    const term = searchTerm.trim().toLowerCase();
    return sorted.filter((entry) => {
      const matchesStatus = statusFilter === "all" ? true : entry.status === statusFilter;
      const matchesCase = caseFilter === "all" ? true : entry.caseId === caseFilter;
      const matchesSearch = term
        ? `${entry.caseName} ${entry.activity} ${entry.author}`.toLowerCase().includes(term)
        : true;
      return matchesStatus && matchesCase && matchesSearch;
    });
  }, [timeEntries, statusFilter, caseFilter, searchTerm]);

  const metrics = useMemo(() => {
    const totals = timeEntries.reduce(
      (acc, entry) => {
        const hours = coerceHours(entry.hours);
        acc.total += hours;
        if (entry.status === "Submitted") {
          acc.submitted += hours;
          acc.pendingCount += 1;
        } else if (entry.status === "Draft") {
          acc.draftCount += 1;
        }
        return acc;
      },
      { total: 0, submitted: 0, draftCount: 0, pendingCount: 0 },
    );
    const approvalRatio =
      timeEntries.length > 0
        ? `${((timeEntries.filter((entry) => entry.status === "Approved").length / timeEntries.length) * 100).toFixed(0)}%`
        : "—";

    return [
      {
        label: "Hours captured",
        value: totals.total.toFixed(1),
        helper: totals.total ? `${totals.submitted.toFixed(1)} submitted` : "Log time to populate metrics",
      },
      {
        label: "Draft entries",
        value: totals.draftCount,
        helper: totals.draftCount ? "Submit drafts to keep billing current" : "No drafts yet",
      },
      {
        label: "Awaiting approval",
        value: totals.pendingCount,
        helper: totals.pendingCount ? "Review before invoicing" : "No submissions pending",
      },
      {
        label: "Approval rate",
        value: approvalRatio,
        helper: "Approved vs. total entries",
      },
    ];
  }, [timeEntries]);

  const hoursByCase = useMemo(() => {
    const map = new Map<string, { matter: CaseRecord; hours: number }>();
    timeEntries.forEach((entry) => {
      const matter = cases.find((item) => item.id === entry.caseId);
      if (!matter) {
        return;
      }
      const current = map.get(entry.caseId) ?? { matter, hours: 0 };
      current.hours += coerceHours(entry.hours);
      map.set(entry.caseId, current);
    });
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [cases, timeEntries]);

  const hoursByAuthor = useMemo(() => {
    const map = new Map<string, number>();
    timeEntries.forEach((entry) => {
      const hours = coerceHours(entry.hours);
      map.set(entry.author, (map.get(entry.author) ?? 0) + hours);
    });
    return Array.from(map.entries())
      .map(([author, hours]) => ({ author, hours }))
      .sort((a, b) => b.hours - a.hours);
  }, [timeEntries]);

  const hasCases = cases.length > 0;
  const hasEntries = timeEntries.length > 0;
  const formatEntryDate = (value: string | undefined | null) => {
    if (!value) {
      return "—";
    }
    try {
      const parsed = parseISO(value);
      if (!isValid(parsed)) {
        return "—";
      }
      return format(parsed, "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  function handleLogEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!timeForm.caseId || !timeForm.author.trim() || !timeForm.activity.trim() || !timeForm.hours) {
      return;
    }

    logTimeEntry({
      caseId: timeForm.caseId,
      author: timeForm.author.trim(),
      activity: timeForm.activity.trim(),
      hours: Number(timeForm.hours),
      date: timeForm.date,
      status: timeForm.status,
      notes: timeForm.notes.trim() || undefined,
    });

    setTimeForm(createEmptyTimeForm());
  }

  function updateStatus(entry: TimeEntry, status: TimeEntryStatus) {
    updateTimeEntry(entry.id, { status });
  }

  if (!hasCases) {
    return (
      <div className="space-y-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case management · Time</p>
          <h1 className="text-3xl font-semibold text-slate-900">Timekeeping and productivity</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Capture work as it happens, review utilization by matter and attorney, and keep approvals moving before billing deadlines hit.
          </p>
        </header>

        <section className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-10 text-center shadow-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">No matters available</h2>
            <p className="text-sm text-slate-500">
              Create your first client and matter to unlock time tracking, utilization metrics, and approval workflows.
            </p>
            <Button asChild>
              <Link href="/case-management/clients">Go to client workspace</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case management · Time</p>
        <h1 className="text-3xl font-semibold text-slate-900">Timekeeping and productivity</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Capture work as it happens, review utilization by matter and attorney, and keep approvals moving before
          billing deadlines hit.
        </p>
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

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Log billable time</CardTitle>
            <CardDescription>Quick capture form for attorneys and legal staff.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleLogEntry}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="time-case">Matter</Label>
              <Select
                value={timeForm.caseId}
                onValueChange={(value) => setTimeForm((prev) => ({ ...prev, caseId: value }))}
                disabled={!hasCases}
              >
                <SelectTrigger id="time-case">
                  <SelectValue placeholder={hasCases ? "Select matter" : "No matters available"} />
                </SelectTrigger>
                <SelectContent>
                  {hasCases ? (
                    cases.map((matter) => (
                      <SelectItem key={matter.id} value={matter.id}>
                        {matter.caseName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Create a matter first
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-author">Timekeeper</Label>
                <Input
                  id="time-author"
                  required
                  value={timeForm.author}
                  onChange={(event) => setTimeForm((prev) => ({ ...prev, author: event.target.value }))}
                  placeholder="Katherine Monroe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-date">Date</Label>
                <Input
                  id="time-date"
                  type="date"
                  value={timeForm.date}
                  onChange={(event) => setTimeForm((prev) => ({ ...prev, date: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-hours">Hours</Label>
                <Input
                  id="time-hours"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={timeForm.hours}
                  onChange={(event) => setTimeForm((prev) => ({ ...prev, hours: event.target.value }))}
                  placeholder="1.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time-status">Status</Label>
                <Select
                  value={timeForm.status}
                  onValueChange={(value) => setTimeForm((prev) => ({ ...prev, status: value as TimeEntryStatus }))}
                >
                  <SelectTrigger id="time-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="time-activity">Narrative</Label>
                <Textarea
                  id="time-activity"
                  required
                  rows={3}
                  value={timeForm.activity}
                  onChange={(event) => setTimeForm((prev) => ({ ...prev, activity: event.target.value }))}
                  placeholder="Draft Daubert challenge outline and integrate expert feedback."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="time-notes">Internal notes (optional)</Label>
                <Textarea
                  id="time-notes"
                  rows={2}
                  value={timeForm.notes}
                  onChange={(event) => setTimeForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Use to track write-offs, follow-up tasks, or billing codes."
                />
              </div>
              <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto" disabled={!hasCases}>
                Log entry
              </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Hours by matter</CardTitle>
            <CardDescription>Where your team is investing time this period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hoursByCase.length ? (
              hoursByCase.slice(0, 8).map(({ matter, hours }) => (
                <div key={matter.id} className="flex items-center justify-between text-sm text-slate-700">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{matter.caseName}</span>
                    <span className="text-xs text-slate-500">{matter.practiceArea}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{hours.toFixed(1)} h</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No hours logged yet.</p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/case-management/case-management">Case dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Timekeepers</CardTitle>
            <CardDescription>Total hours captured by each contributor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hoursByAuthor.length ? (
              hoursByAuthor.slice(0, 6).map((entry) => (
                <div key={entry.author} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-sm text-slate-800">{entry.author}</span>
                  <span className="text-sm font-semibold text-slate-900">{entry.hours.toFixed(1)} h</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Hours will appear as soon as entries are logged.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Filters</CardTitle>
            <CardDescription>Focus the ledger by status, matter, or keyword.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="entry-search">Search entries</Label>
              <Input
                id="entry-search"
                placeholder="Search by matter, activity, or timekeeper"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Matter</Label>
              <Select value={caseFilter} onValueChange={setCaseFilter} disabled={!hasCases}>
                <SelectTrigger>
                  <SelectValue placeholder={hasCases ? "All matters" : "No matters"} />
                </SelectTrigger>
                <SelectContent>
                  {hasCases ? (
                    <>
                      <SelectItem value="all">All matters</SelectItem>
                      {cases.map((matter) => (
                        <SelectItem key={matter.id} value={matter.id}>
                          {matter.caseName}
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    <SelectItem value="all">No matters available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Time entries</h2>
          <p className="text-sm text-slate-500">Review, adjust status, and keep approvals current.</p>
        </header>
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Matter</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Timekeeper</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length ? (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="align-top">
                        <div className="flex flex-col text-sm text-slate-800">
                          <span className="font-semibold">{entry.caseName || "Matter archived"}</span>
                          {entry.notes ? <span className="text-xs text-slate-400">{entry.notes}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm text-slate-600">{entry.activity}</TableCell>
                      <TableCell className="align-top text-sm text-slate-600">{entry.author}</TableCell>
                      <TableCell className="align-top text-sm text-slate-500">{formatEntryDate(entry.date)}</TableCell>
                      <TableCell className="align-top text-sm text-slate-600">
                        {coerceHours(entry.hours).toFixed(1)}
                      </TableCell>
                      <TableCell className="align-top">
                        <Select value={entry.status} onValueChange={(value) => updateStatus(entry, value as TimeEntryStatus)}>
                          <SelectTrigger className="h-9 w-36 text-left">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-2">
                          {entry.status !== "Approved" ? (
                            <Button size="sm" onClick={() => updateStatus(entry, "Approved")}>
                              Approve
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="h-8 px-3 text-xs">
                              Approved
                            </Badge>
                          )}
                          {entry.status === "Draft" ? (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(entry, "Submitted")}>
                              Submit
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      {hasEntries ? "No entries match this filter." : "Log time to see entries here."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
