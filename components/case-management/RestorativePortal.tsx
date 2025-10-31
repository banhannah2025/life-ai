'use client';

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";

import {
  useCaseManagement,
  type RestorativeProfile,
} from "@/components/case-management/CaseManagementProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type IntakeFormState = {
  caseName: string;
  referralSource: string;
  incidentSummary: string;
  goals: string;
  supportNeeds: string;
  riskFlags: string;
  preferredFacilitator: string;
  carePlan: string;
  participants: string;
  familyContact: string;
  programTag: string;
  circleDate: string;
  consentSigned: boolean;
  safetyPlanOnFile: boolean;
  mediaReleaseSigned: boolean;
  supportTeam: string;
};

type SessionFormState = {
  caseId: string;
  date: string;
  facilitator: string;
  focusArea: string;
  summary: string;
  agreements: string;
  followUpDate: string;
};

const today = new Date().toISOString().slice(0, 10);

const defaultIntakeForm: IntakeFormState = {
  caseName: "",
  referralSource: "",
  incidentSummary: "",
  goals: "",
  supportNeeds: "",
  riskFlags: "",
  preferredFacilitator: "",
  carePlan: "",
  participants: "",
  familyContact: "",
  programTag: "OUGM Restorative",
  circleDate: today,
  consentSigned: false,
  safetyPlanOnFile: false,
  mediaReleaseSigned: false,
  supportTeam: "",
};

const defaultSessionForm: SessionFormState = {
  caseId: "",
  date: today,
  facilitator: "",
  focusArea: "Healing circle",
  summary: "",
  agreements: "",
  followUpDate: "",
};

export function RestorativePortal() {
  const { state, createCase, logRestorativeSession } = useCaseManagement();
  const restorativeCases = useMemo(() => state.cases.filter((matter) => matter.caseType === "restorative"), [state.cases]);

  const [intakeForm, setIntakeForm] = useState(defaultIntakeForm);
  const [sessionForm, setSessionForm] = useState(defaultSessionForm);
  const createParticipantId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `participant-${Math.random().toString(36).slice(2, 10)}`;

  const activeCohorts = useMemo(() => new Set(restorativeCases.map((matter) => matter.programTag ?? "OUGM")), [restorativeCases]);

  function handleCreateRestorativeCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intakeForm.caseName.trim()) {
      return;
    }

    const participants = tokenizeLines(intakeForm.participants).map((entry) => {
      const [name, role] = entry.split(" - ");
      return {
        id: createParticipantId(),
        name: name?.trim() ?? entry,
        role: (role?.trim().toLowerCase() ?? "harmed") as RestorativeProfile["participants"][number]["role"],
      };
    });

    const profile: RestorativeProfile = {
      intake: {
        referralSource: intakeForm.referralSource.trim() || "Community partner",
        incidentSummary: intakeForm.incidentSummary.trim(),
        goals: tokenizeCSV(intakeForm.goals),
        supportNeeds: intakeForm.supportNeeds.trim() || undefined,
        riskFactors: tokenizeCSV(intakeForm.riskFlags),
        preferredFacilitator: intakeForm.preferredFacilitator.trim() || undefined,
        notes: undefined,
      },
      participants,
      forms: {
        consentSigned: intakeForm.consentSigned,
        safetyPlanOnFile: intakeForm.safetyPlanOnFile,
        mediaReleaseSigned: intakeForm.mediaReleaseSigned,
      },
      carePlan: intakeForm.carePlan.trim() || undefined,
      sessions: [],
    };

    createCase({
      caseName: intakeForm.caseName.trim(),
      client: intakeForm.familyContact.trim() || intakeForm.caseName.trim(),
      matterNumber: `RJ-${Date.now()}`,
      practiceArea: "Restorative Justice",
      stage: "intake",
      status: "active",
      leadAttorney: intakeForm.preferredFacilitator.trim() || "OUGM Restorative Facilitator",
      team: tokenizeCSV(intakeForm.supportTeam),
      openedOn: intakeForm.circleDate || today,
      nextDeadline: undefined,
      description: intakeForm.incidentSummary.trim(),
      priority: "medium",
      tags: ["restorative", intakeForm.programTag || "OUGM"],
      riskNotes: intakeForm.riskFlags.trim() || undefined,
      caseType: "restorative",
      programTag: intakeForm.programTag.trim() || "OUGM",
      restorativeProfile: profile,
    });

    setIntakeForm(defaultIntakeForm);
  }

  function handleLogSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionForm.caseId || !sessionForm.facilitator.trim()) {
      return;
    }
    logRestorativeSession(sessionForm.caseId, {
      date: sessionForm.date,
      facilitator: sessionForm.facilitator.trim(),
      focusArea: sessionForm.focusArea.trim() || "Healing circle",
      summary: sessionForm.summary.trim(),
      agreements: tokenizeLines(sessionForm.agreements),
      followUpDate: sessionForm.followUpDate || undefined,
    });
    setSessionForm((prev) => ({ ...prev, date: today, summary: "", agreements: "", followUpDate: "" }));
  }

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">OUGM Restorative Justice Portal</p>
        <h3 className="text-2xl font-semibold text-slate-900">Circle intake & care coordination</h3>
        <p className="text-sm text-slate-600">
          Capture restorative referrals, track circle sessions, and keep facilitators aligned on safety planning.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active restorative cases" value={restorativeCases.length} helper={`${activeCohorts.size} cohort(s)`} />
        <MetricCard
          label="Sessions logged"
          value={restorativeCases.reduce((total, matter) => total + (matter.restorativeProfile?.sessions.length ?? 0), 0)}
          helper="Includes debrief + coaching notes"
        />
        <MetricCard
          label="Safety plans on file"
          value={restorativeCases.filter((matter) => matter.restorativeProfile?.forms.safetyPlanOnFile).length}
          helper="Ready for circle scheduling"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>New restorative intake</CardTitle>
            <CardDescription>Log referral context, participants, and readiness forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateRestorativeCase}>
              <div className="space-y-2">
                <Label htmlFor="intake-case-name">Circle title</Label>
                <Input
                  id="intake-case-name"
                  value={intakeForm.caseName}
                  onChange={(event) => setIntakeForm((prev) => ({ ...prev, caseName: event.target.value }))}
                  placeholder="Roommates restorative conference"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intake-referral">Referral source</Label>
                  <Input
                    id="intake-referral"
                    value={intakeForm.referralSource}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, referralSource: event.target.value }))}
                    placeholder="Shelter chaplain, case manager, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-program">Program tag</Label>
                  <Input
                    id="intake-program"
                    value={intakeForm.programTag}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, programTag: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake-incident">Incident summary</Label>
                <Textarea
                  id="intake-incident"
                  value={intakeForm.incidentSummary}
                  onChange={(event) => setIntakeForm((prev) => ({ ...prev, incidentSummary: event.target.value }))}
                  placeholder="Brief narrative or copy/paste from intake."
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intake-goals">Circle goals (comma separated)</Label>
                  <Input
                    id="intake-goals"
                    value={intakeForm.goals}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, goals: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-risk">Risk flags (comma separated)</Label>
                  <Input
                    id="intake-risk"
                    value={intakeForm.riskFlags}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, riskFlags: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intake-support">Support needs</Label>
                  <Input
                    id="intake-support"
                    value={intakeForm.supportNeeds}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, supportNeeds: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-care-plan">Care plan notes</Label>
                  <Input
                    id="intake-care-plan"
                    value={intakeForm.carePlan}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, carePlan: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake-participants">Participants (one per line: Name - role)</Label>
                <Textarea
                  id="intake-participants"
                  value={intakeForm.participants}
                  onChange={(event) => setIntakeForm((prev) => ({ ...prev, participants: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intake-facilitator">Preferred facilitator</Label>
                  <Input
                    id="intake-facilitator"
                    value={intakeForm.preferredFacilitator}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, preferredFacilitator: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-support-team">Support team</Label>
                  <Input
                    id="intake-support-team"
                    value={intakeForm.supportTeam}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, supportTeam: event.target.value }))}
                    placeholder="Comma separated staff / volunteers"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intake-family">Primary contact / family lead</Label>
                  <Input
                    id="intake-family"
                    value={intakeForm.familyContact}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, familyContact: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intake-date">Target circle date</Label>
                  <Input
                    id="intake-date"
                    type="date"
                    value={intakeForm.circleDate}
                    onChange={(event) => setIntakeForm((prev) => ({ ...prev, circleDate: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <CheckboxField
                  id="intake-consent"
                  label="Consent on file"
                  checked={intakeForm.consentSigned}
                  onCheckedChange={(checked) => setIntakeForm((prev) => ({ ...prev, consentSigned: Boolean(checked) }))}
                />
                <CheckboxField
                  id="intake-safety"
                  label="Safety plan"
                  checked={intakeForm.safetyPlanOnFile}
                  onCheckedChange={(checked) => setIntakeForm((prev) => ({ ...prev, safetyPlanOnFile: Boolean(checked) }))}
                />
                <CheckboxField
                  id="intake-media"
                  label="Media release"
                  checked={intakeForm.mediaReleaseSigned}
                  onCheckedChange={(checked) => setIntakeForm((prev) => ({ ...prev, mediaReleaseSigned: Boolean(checked) }))}
                />
              </div>
              <Button type="submit" className="w-full">
                Save intake
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Log circle session</CardTitle>
            <CardDescription>Document progress and agreements for an active restorative matter.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogSession}>
              <div className="space-y-2">
                <Label htmlFor="session-case">Restorative matter</Label>
                <Select value={sessionForm.caseId} onValueChange={(value) => setSessionForm((prev) => ({ ...prev, caseId: value }))}>
                  <SelectTrigger id="session-case">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {restorativeCases.map((matter) => (
                      <SelectItem key={matter.id} value={matter.id}>
                        {matter.caseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="session-date">Session date</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={sessionForm.date}
                    onChange={(event) => setSessionForm((prev) => ({ ...prev, date: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-follow-up">Follow-up</Label>
                  <Input
                    id="session-follow-up"
                    type="date"
                    value={sessionForm.followUpDate}
                    onChange={(event) => setSessionForm((prev) => ({ ...prev, followUpDate: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-facilitator">Facilitator</Label>
                <Input
                  id="session-facilitator"
                  value={sessionForm.facilitator}
                  onChange={(event) => setSessionForm((prev) => ({ ...prev, facilitator: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-focus">Focus</Label>
                <Input
                  id="session-focus"
                  value={sessionForm.focusArea}
                  onChange={(event) => setSessionForm((prev) => ({ ...prev, focusArea: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-summary">Summary</Label>
                <Textarea
                  id="session-summary"
                  value={sessionForm.summary}
                  onChange={(event) => setSessionForm((prev) => ({ ...prev, summary: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-agreements">Agreements (one per line)</Label>
                <Textarea
                  id="session-agreements"
                  value={sessionForm.agreements}
                  onChange={(event) => setSessionForm((prev) => ({ ...prev, agreements: event.target.value }))}
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!sessionForm.caseId}>
                Log session
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {restorativeCases.map((matter) => (
          <Card key={matter.id} className="border-emerald-100 bg-white">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-900">{matter.caseName}</CardTitle>
                <Badge variant="secondary">{matter.programTag ?? "OUGM"}</Badge>
              </div>
              <CardDescription>
                {matter.restorativeProfile?.participants.length ?? 0} participant(s) · Stage {matter.stage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Referral</p>
                <p>{matter.restorativeProfile?.intake?.referralSource ?? "--"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Next follow-up</p>
                <p>
                  {matter.restorativeProfile?.sessions.length
                    ? format(parseISO(matter.restorativeProfile.sessions[0].date), "MMM d, yyyy")
                    : "TBD"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Recent agreements</p>
                <ul className="list-disc space-y-1 pl-4">
                  {(matter.restorativeProfile?.sessions[0]?.agreements ?? []).slice(0, 3).map((agreement) => (
                    <li key={agreement}>{agreement}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <Card className="border-emerald-100 bg-white/90">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <Label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </Label>
    </div>
  );
}

function tokenizeCSV(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function tokenizeLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
