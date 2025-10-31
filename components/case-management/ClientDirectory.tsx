'use client';

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  useCaseManagement,
  type CaseRecord,
  type ClientRecord,
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

type ClientFormState = {
  name: string;
  organization: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
};

type CaseInlineFormState = {
  caseName: string;
  matterNumber: string;
  practiceArea: string;
  stage: CaseRecord["stage"];
  priority: CaseRecord["priority"];
  leadAttorney: string;
  team: string;
  nextDeadline: string;
  description: string;
};

const stageOptions: Array<{ value: CaseRecord["stage"]; label: string }> = [
  { value: "intake", label: "Intake" },
  { value: "investigation", label: "Investigation" },
  { value: "discovery", label: "Discovery" },
  { value: "briefing", label: "Briefing" },
  { value: "hearing", label: "Hearing / Trial" },
  { value: "appeal", label: "Appeal" },
  { value: "closed", label: "Closed" },
];

const priorityOptions: Array<{ value: CaseRecord["priority"]; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function createEmptyClientForm(): ClientFormState {
  return {
    name: "",
    organization: "",
    primaryContact: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
  };
}

function createEmptyCaseInlineForm(): CaseInlineFormState {
  return {
    caseName: "",
    matterNumber: "",
    practiceArea: "",
    stage: "intake",
    priority: "medium",
    leadAttorney: "",
    team: "",
    nextDeadline: "",
    description: "",
  };
}

function normalizeList(value: string) {
  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function ClientDirectory() {
  const { state, createClient, updateClient, createCase, updateCase } = useCaseManagement();
  const { clients, cases } = state;

  const [isCreateClientOpen, setCreateClientOpen] = useState(false);
  const [clientForm, setClientForm] = useState<ClientFormState>(() => createEmptyClientForm());
  const [clientBeingEdited, setClientBeingEdited] = useState<ClientRecord | null>(null);

  const [caseFormState, setCaseFormState] = useState<CaseInlineFormState>(() => createEmptyCaseInlineForm());
  const [clientForCase, setClientForCase] = useState<ClientRecord | null>(null);
  const [caseBeingEdited, setCaseBeingEdited] = useState<CaseRecord | null>(null);

  const clientMetrics = useMemo(() => {
    const totalCases = clients.reduce((acc, client) => acc + client.caseIds.length, 0);
    const activeClients = clients.filter((client) =>
      client.caseIds.some((caseId) => cases.find((matter) => matter.id === caseId && matter.status !== "closed")),
    ).length;
    return [
      { label: "Clients", value: clients.length, helper: `${activeClients} with active work` },
      { label: "Matters", value: totalCases, helper: `${cases.filter((matter) => matter.status !== "closed").length} active` },
    ];
  }, [clients, cases]);

  const clientsWithCases = useMemo(() => {
    return clients
      .map((client) => ({
        client,
        matters: client.caseIds
          .map((caseId) => cases.find((matter) => matter.id === caseId))
          .filter((matter): matter is CaseRecord => Boolean(matter)),
      }))
      .sort((a, b) => a.client.name.localeCompare(b.client.name));
  }, [clients, cases]);

  function resetClientForm() {
    setClientForm(createEmptyClientForm());
    setClientBeingEdited(null);
  }

  function resetCaseForm() {
    setCaseFormState(createEmptyCaseInlineForm());
    setClientForCase(null);
    setCaseBeingEdited(null);
  }

  function handleClientSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientForm.name.trim()) {
      return;
    }
    if (clientBeingEdited) {
      updateClient(clientBeingEdited.id, {
        name: clientForm.name.trim(),
        organization: clientForm.organization.trim() || undefined,
        primaryContact: clientForm.primaryContact.trim() || undefined,
        contactEmail: clientForm.contactEmail.trim() || undefined,
        contactPhone: clientForm.contactPhone.trim() || undefined,
        notes: clientForm.notes.trim() || undefined,
      });
    } else {
      createClient({
        name: clientForm.name.trim(),
        organization: clientForm.organization.trim() || undefined,
        primaryContact: clientForm.primaryContact.trim() || undefined,
        contactEmail: clientForm.contactEmail.trim() || undefined,
        contactPhone: clientForm.contactPhone.trim() || undefined,
        notes: clientForm.notes.trim() || undefined,
      });
    }
    setCreateClientOpen(false);
    resetClientForm();
  }

  function handleCaseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentClient = clientForCase ?? (caseBeingEdited ? clients.find((client) => client.caseIds.includes(caseBeingEdited.id)) ?? null : null);
    if (!currentClient) {
      return;
    }
    if (!caseFormState.caseName.trim() || !caseFormState.leadAttorney.trim()) {
      return;
    }

    if (caseBeingEdited) {
      updateCase(caseBeingEdited.id, {
        caseName: caseFormState.caseName.trim(),
        clientId: currentClient.id,
        client: currentClient.name,
        practiceArea: caseFormState.practiceArea.trim() || caseBeingEdited.practiceArea,
        stage: caseFormState.stage,
        priority: caseFormState.priority,
        leadAttorney: caseFormState.leadAttorney.trim(),
        team: normalizeList(caseFormState.team),
        nextDeadline: caseFormState.nextDeadline ? caseFormState.nextDeadline : undefined,
        description: caseFormState.description.trim(),
      });
    } else {
      createCase({
        caseName: caseFormState.caseName.trim(),
        client: currentClient.name,
        clientId: currentClient.id,
        matterNumber: caseFormState.matterNumber.trim() || `MAT-${Date.now()}`,
        practiceArea: caseFormState.practiceArea.trim() || "General Practice",
        stage: caseFormState.stage,
        status: "active",
        leadAttorney: caseFormState.leadAttorney.trim(),
        team: normalizeList(caseFormState.team),
        openedOn: new Date().toISOString().slice(0, 10),
        nextDeadline: caseFormState.nextDeadline ? caseFormState.nextDeadline : undefined,
        description: caseFormState.description.trim(),
        priority: caseFormState.priority,
        tags: [],
        riskNotes: undefined,
      });
    }

    resetCaseForm();
  }

  return (
    <div className="space-y-9">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case management · Clients</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">Client directory</h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Maintain client records, contacts, and connected matters. Launch new cases directly from a client workspace.
            </p>
          </div>
        </div>
        <Dialog open={isCreateClientOpen} onOpenChange={(open) => {
          setCreateClientOpen(open);
          if (!open) {
            resetClientForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">Add client</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form className="space-y-6" onSubmit={handleClientSubmit}>
              <DialogHeader>
                <DialogTitle>{clientBeingEdited ? "Edit client" : "Create client"}</DialogTitle>
                <DialogDescription>
                  Capture contact details and notes that will stay linked to every matter for this client.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client-name">Client name</Label>
                  <Input
                    id="client-name"
                    required
                    value={clientForm.name}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Harbor Group Holdings"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-organization">Organization</Label>
                  <Input
                    id="client-organization"
                    value={clientForm.organization}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, organization: event.target.value }))}
                    placeholder="Parent organization or DBA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-contact">Primary contact</Label>
                  <Input
                    id="client-contact"
                    value={clientForm.primaryContact}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, primaryContact: event.target.value }))}
                    placeholder="Avery Brooks"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Contact email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientForm.contactEmail}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                    placeholder="avery@harbor.example"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Contact phone</Label>
                  <Input
                    id="client-phone"
                    value={clientForm.contactPhone}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                    placeholder="555-0154"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="client-notes">Notes</Label>
                  <Textarea
                    id="client-notes"
                    rows={3}
                    value={clientForm.notes}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Confidential preferences, billing requirements, or strategic considerations."
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  resetClientForm();
                  setCreateClientOpen(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit">{clientBeingEdited ? "Save client" : "Create client"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {clientMetrics.map((metric) => (
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

      <section className="grid gap-6 xl:grid-cols-2">
        {clientsWithCases.map(({ client, matters }) => (
          <Card key={client.id} className="flex flex-col border border-slate-200/70 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-slate-900">{client.name}</CardTitle>
                  <CardDescription>{client.organization ?? "Organization pending"}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs text-slate-500">
                    {matters.length} matter{matters.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-600">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>{client.primaryContact ? `Primary: ${client.primaryContact}` : "Primary contact TBD"}</span>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {client.contactEmail ? <span>{client.contactEmail}</span> : null}
                    {client.contactPhone ? <span>{client.contactPhone}</span> : null}
                  </div>
                </div>
                {client.notes ? <p className="mt-2 text-xs text-slate-500">{client.notes}</p> : null}
              </div>
              <div className="space-y-3">
                {matters.length ? (
                  matters.map((matter) => (
                    <div
                      key={matter.id}
                      className="rounded-lg border border-slate-100 bg-white/70 p-3 text-sm text-slate-700"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{matter.caseName}</p>
                          <p className="text-xs text-slate-500">
                            Lead: {matter.leadAttorney} · Stage: {matter.stage.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={matter.priority === "high" ? "destructive" : matter.priority === "medium" ? "secondary" : "outline"}
                            className="text-xs capitalize"
                          >
                            {matter.priority}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setCaseBeingEdited(matter);
                              setClientForCase(client);
                              setCaseFormState({
                                caseName: matter.caseName,
                                matterNumber: matter.matterNumber,
                                practiceArea: matter.practiceArea,
                                stage: matter.stage,
                                priority: matter.priority,
                                leadAttorney: matter.leadAttorney,
                                team: matter.team.join(", "),
                                nextDeadline: matter.nextDeadline ?? "",
                                description: matter.description,
                              });
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{matter.documentIds.length} document(s)</span>
                        <span>{matter.researchIds.length} research note(s)</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-700">
                        <Link href={`/case-management/case-analysis?case=${matter.id}`} className="hover:underline">
                          Analysis workspace
                        </Link>
                        <Link href={`/case-management/document-drafting?case=${matter.id}`} className="hover:underline">
                          Drafting workspace
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No matters yet. Start one below.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setClientBeingEdited(client);
                  setClientForm({
                    name: client.name,
                    organization: client.organization ?? "",
                    primaryContact: client.primaryContact ?? "",
                    contactEmail: client.contactEmail ?? "",
                    contactPhone: client.contactPhone ?? "",
                    notes: client.notes ?? "",
                  });
                  setCreateClientOpen(true);
                }}
              >
                Edit client
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setClientForCase(client);
                  setCaseBeingEdited(null);
                  setCaseFormState(createEmptyCaseInlineForm());
                }}
              >
                Add matter
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <Dialog open={Boolean(clientForCase) || Boolean(caseBeingEdited)} onOpenChange={(open) => {
        if (!open) {
          resetCaseForm();
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <form className="space-y-6" onSubmit={handleCaseSubmit}>
            <DialogHeader>
              <DialogTitle>{caseBeingEdited ? "Edit matter" : `Create matter for ${clientForCase?.name ?? ""}`}</DialogTitle>
              <DialogDescription>
                {caseBeingEdited
                  ? "Update matter details. Changes save instantly across dashboards."
                  : "Link the new matter to this client. You can adjust drafting and research later."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="client-case-name">Matter name</Label>
                <Input
                  id="client-case-name"
                  required
                  value={caseFormState.caseName}
                  onChange={(event) => setCaseFormState((prev) => ({ ...prev, caseName: event.target.value }))}
                  placeholder="Internal investigation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-matter-number">Matter number</Label>
                <Input
                  id="client-matter-number"
                  value={caseFormState.matterNumber}
                  onChange={(event) => setCaseFormState((prev) => ({ ...prev, matterNumber: event.target.value }))}
                  placeholder="2024-R-0045"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-practice-area">Practice area</Label>
                <Input
                  id="client-practice-area"
                  value={caseFormState.practiceArea}
                  onChange={(event) => setCaseFormState((prev) => ({ ...prev, practiceArea: event.target.value }))}
                  placeholder="Corporate governance"
                />
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={caseFormState.stage}
                  onValueChange={(value) => setCaseFormState((prev) => ({ ...prev, stage: value as CaseRecord["stage"] }))}
                >
                  <SelectTrigger>
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
                <Label>Priority</Label>
                <Select
                  value={caseFormState.priority}
                  onValueChange={(value) => setCaseFormState((prev) => ({ ...prev, priority: value as CaseRecord["priority"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-lead-attorney">Lead attorney</Label>
                <Input
                  id="client-lead-attorney"
                  required
                  value={caseFormState.leadAttorney}
                  onChange={(event) => setCaseFormState((prev) => ({ ...prev, leadAttorney: event.target.value }))}
                  placeholder="Laura Chen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-team">Team</Label>
                <Input
                  id="client-team"
                  value={caseFormState.team}
                  onChange={(event) => setCaseFormState((prev) => ({ ...prev, team: event.target.value }))}
                  placeholder="Comma separated names"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-next-deadline">Next deadline</Label>
                <Input
                  id="client-next-deadline"
                  type="date"
                  value={caseFormState.nextDeadline}
                  onChange={(event) => setCaseFormState((prev) => ({ ...prev, nextDeadline: event.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="client-description">Summary</Label>
                <Textarea
                  id="client-description"
                  rows={3}
                  value={caseFormState.description}
                  onChange={(event) => setCaseFormState((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Outline scope and objectives for this matter."
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={resetCaseForm}>
                Cancel
              </Button>
              <Button type="submit">{caseBeingEdited ? "Save changes" : "Create matter"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
