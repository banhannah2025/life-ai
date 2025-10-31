'use client';

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";

import {
  useCaseManagement,
  type CaseRecord,
  type MockTrialProfile,
  type MockTrialRole,
} from "@/components/case-management/CaseManagementProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const today = new Date().toISOString().slice(0, 10);

type MockCaseFormState = {
  caseName: string;
  teamName: string;
  opponent: string;
  role: MockTrialRole;
  coach: string;
  roster: string;
  strategyNotes: string;
  startDate: string;
  programTag: string;
  casePacket: string;
};

type RoundFormState = {
  caseId: string;
  roundName: string;
  scheduledFor: string;
  venue: string;
  judgePanel: string;
};

type ScoreFormState = {
  caseId: string;
  roundId: string;
  prosecutionScore: string;
  defenseScore: string;
  verdict: string;
  notes: string;
};

const defaultMockCaseForm: MockCaseFormState = {
  caseName: "",
  teamName: "",
  opponent: "",
  role: "prosecution",
  coach: "",
  roster: "",
  strategyNotes: "",
  startDate: today,
  programTag: "Mock Trial League",
  casePacket: "",
};

const defaultRoundForm: RoundFormState = {
  caseId: "",
  roundName: "Prelim",
  scheduledFor: today,
  venue: "",
  judgePanel: "",
};

const defaultScoreForm: ScoreFormState = {
  caseId: "",
  roundId: "",
  prosecutionScore: "",
  defenseScore: "",
  verdict: "",
  notes: "",
};

export function MockTrialPortal() {
  const { state, createCase, scheduleMockTrialRound, scoreMockTrialRound } = useCaseManagement();
  const mockCases = useMemo(() => state.cases.filter((matter) => matter.caseType === "mock_trial"), [state.cases]);

  const [mockCaseForm, setMockCaseForm] = useState(defaultMockCaseForm);
  const [roundForm, setRoundForm] = useState(defaultRoundForm);
  const [scoreForm, setScoreForm] = useState(defaultScoreForm);

  function handleCreateMockCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mockCaseForm.caseName.trim() || !mockCaseForm.teamName.trim()) {
      return;
    }
    const profile: MockTrialProfile = {
      teamName: mockCaseForm.teamName.trim(),
      role: mockCaseForm.role,
      opponent: mockCaseForm.opponent.trim() || undefined,
      casePacket: mockCaseForm.casePacket.trim() || undefined,
      strategyNotes: mockCaseForm.strategyNotes.trim() || undefined,
      rounds: [],
    };

    createCase({
      caseName: mockCaseForm.caseName.trim(),
      client: mockCaseForm.teamName.trim(),
      clientId: null,
      matterNumber: `MT-${Date.now()}`,
      practiceArea: "Mock Trial",
      stage: "intake",
      status: "active",
      leadAttorney: mockCaseForm.coach.trim() || "Coach",
      team: tokenizeCSV(mockCaseForm.roster),
      openedOn: mockCaseForm.startDate || today,
      nextDeadline: undefined,
      description: mockCaseForm.strategyNotes.trim(),
      priority: "medium",
      tags: ["mock-trial", mockCaseForm.programTag || "League"],
      riskNotes: undefined,
      caseType: "mock_trial",
      programTag: mockCaseForm.programTag.trim() || "Mock Trial",
      mockTrialProfile: profile,
    });

    setMockCaseForm(defaultMockCaseForm);
  }

  function handleScheduleRound(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roundForm.caseId) {
      return;
    }
    scheduleMockTrialRound(roundForm.caseId, {
      roundName: roundForm.roundName.trim() || "Round",
      scheduledFor: roundForm.scheduledFor,
      venue: roundForm.venue.trim() || undefined,
      judgePanel: tokenizeCSV(roundForm.judgePanel),
    });
    setRoundForm((prev) => ({ ...prev, roundName: "Prelim", venue: "", judgePanel: "" }));
  }

  function handleScoreRound(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scoreForm.caseId || !scoreForm.roundId) {
      return;
    }
    scoreMockTrialRound(scoreForm.caseId, scoreForm.roundId, {
      prosecutionScore: Number(scoreForm.prosecutionScore) || 0,
      defenseScore: Number(scoreForm.defenseScore) || 0,
      verdict: scoreForm.verdict.trim() || undefined,
      notes: scoreForm.notes.trim() || undefined,
    });
    setScoreForm(defaultScoreForm);
  }

  const selectedCaseRounds = useMemo(() => {
    if (!scoreForm.caseId) {
      return [] as MockTrialProfile["rounds"];
    }
    const caseRecord = mockCases.find((matter) => matter.id === scoreForm.caseId);
    return caseRecord?.mockTrialProfile?.rounds ?? [];
  }, [mockCases, scoreForm.caseId]);

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mock trial arena</p>
        <h3 className="text-2xl font-semibold text-slate-900">Scrimmages, scorecards, and case packets</h3>
        <p className="text-sm text-slate-600">
          Manage mock trial teams across brackets, keep judges coordinated, and capture scoring in one workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Active teams" value={mockCases.length} helper="Across all programs" />
        <Metric
          label="Rounds scheduled"
          value={mockCases.reduce((total, matter) => total + (matter.mockTrialProfile?.rounds.length ?? 0), 0)}
          helper="Includes upcoming + completed"
        />
        <Metric
          label="Average score spread"
          value={calculateAverageSpread(mockCases).toFixed(1)}
          helper="Lower spread = tighter matches"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Register mock trial matter</CardTitle>
            <CardDescription>Spin up a new scrimmage or season entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreateMockCase}>
              <InputField
                label="Case packet title"
                value={mockCaseForm.caseName}
                onChange={(value) => setMockCaseForm((prev) => ({ ...prev, caseName: value }))}
                required
              />
              <InputField
                label="Team name"
                value={mockCaseForm.teamName}
                onChange={(value) => setMockCaseForm((prev) => ({ ...prev, teamName: value }))}
                required
              />
              <InputField
                label="Opposing team"
                value={mockCaseForm.opponent}
                onChange={(value) => setMockCaseForm((prev) => ({ ...prev, opponent: value }))}
              />
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={mockCaseForm.role} onValueChange={(value) => setMockCaseForm((prev) => ({ ...prev, role: value as MockTrialRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prosecution">Prosecution / Plaintiff</SelectItem>
                    <SelectItem value="defense">Defense</SelectItem>
                    <SelectItem value="judge">Judging panel</SelectItem>
                    <SelectItem value="restorative_panel">Restorative panel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <InputField
                label="Coach / advisor"
                value={mockCaseForm.coach}
                onChange={(value) => setMockCaseForm((prev) => ({ ...prev, coach: value }))}
              />
              <InputField
                label="Program tag"
                value={mockCaseForm.programTag}
                onChange={(value) => setMockCaseForm((prev) => ({ ...prev, programTag: value }))}
              />
              <InputField
                label="Team roster (comma separated)"
                value={mockCaseForm.roster}
                onChange={(value) => setMockCaseForm((prev) => ({ ...prev, roster: value }))}
              />
              <InputField
                label="Case packet link"
                value={mockCaseForm.casePacket}
                onChange={(value) => setMockCaseForm((prev) => ({ ...prev, casePacket: value }))}
                placeholder="https://..."
              />
              <div className="grid gap-2">
                <Label htmlFor="mock-start">Season start</Label>
                <Input
                  id="mock-start"
                  type="date"
                  value={mockCaseForm.startDate}
                  onChange={(event) => setMockCaseForm((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Strategy notes</Label>
                <Textarea
                  value={mockCaseForm.strategyNotes}
                  onChange={(event) => setMockCaseForm((prev) => ({ ...prev, strategyNotes: event.target.value }))}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Create mock trial matter
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Schedule round</CardTitle>
            <CardDescription>Assign judges and lock the scrimmage date.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleScheduleRound}>
              <div className="space-y-2">
                <Label>Mock trial matter</Label>
                <Select value={roundForm.caseId} onValueChange={(value) => setRoundForm((prev) => ({ ...prev, caseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCases.map((matter) => (
                      <SelectItem key={matter.id} value={matter.id}>
                        {matter.caseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <InputField label="Round name" value={roundForm.roundName} onChange={(value) => setRoundForm((prev) => ({ ...prev, roundName: value }))} />
              <div className="space-y-2">
                <Label htmlFor="round-date">Scheduled for</Label>
                <Input
                  id="round-date"
                  type="datetime-local"
                  value={roundForm.scheduledFor}
                  onChange={(event) => setRoundForm((prev) => ({ ...prev, scheduledFor: event.target.value }))}
                />
              </div>
              <InputField label="Venue / platform" value={roundForm.venue} onChange={(value) => setRoundForm((prev) => ({ ...prev, venue: value }))} />
              <InputField
                label="Judges (comma separated)"
                value={roundForm.judgePanel}
                onChange={(value) => setRoundForm((prev) => ({ ...prev, judgePanel: value }))}
              />
              <Button type="submit" className="w-full" disabled={!roundForm.caseId}>
                Add round
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Score round</CardTitle>
            <CardDescription>Record totals for prosecution and defense.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleScoreRound}>
              <div className="space-y-2">
                <Label>Mock trial matter</Label>
                <Select
                  value={scoreForm.caseId}
                  onValueChange={(value) => {
                    setScoreForm((prev) => ({ ...prev, caseId: value, roundId: "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCases.map((matter) => (
                      <SelectItem key={matter.id} value={matter.id}>
                        {matter.caseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Round</Label>
                <Select value={scoreForm.roundId} onValueChange={(value) => setScoreForm((prev) => ({ ...prev, roundId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCaseRounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.roundName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InputField
                  label="Prosecution score"
                  value={scoreForm.prosecutionScore}
                  onChange={(value) => setScoreForm((prev) => ({ ...prev, prosecutionScore: value }))}
                  type="number"
                />
                <InputField
                  label="Defense score"
                  value={scoreForm.defenseScore}
                  onChange={(value) => setScoreForm((prev) => ({ ...prev, defenseScore: value }))}
                  type="number"
                />
              </div>
              <InputField label="Verdict" value={scoreForm.verdict} onChange={(value) => setScoreForm((prev) => ({ ...prev, verdict: value }))} />
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={scoreForm.notes}
                  onChange={(event) => setScoreForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!scoreForm.caseId || !scoreForm.roundId}>
                Save scorecard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {mockCases.map((matter) => (
          <Card key={matter.id} className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{matter.caseName}</CardTitle>
                <Badge variant="outline">{matter.programTag ?? "Mock Trial"}</Badge>
              </div>
              <CardDescription>
                {matter.mockTrialProfile?.teamName} · {matter.mockTrialProfile?.role ?? "prosecution"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming round</p>
                <p>
                  {matter.mockTrialProfile?.rounds.length
                    ? format(parseISO(matter.mockTrialProfile.rounds[0].scheduledFor), "MMM d, h:mm a")
                    : "TBD"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Judges</p>
                <p>{(matter.mockTrialProfile?.rounds[0]?.judgePanel ?? []).join(", ") || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Recent notes</p>
                <p>{matter.mockTrialProfile?.strategyNotes || "No notes yet"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function tokenizeCSV(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function calculateAverageSpread(cases: CaseRecord[]) {
  const spreads: number[] = [];
  cases.forEach((matter) => {
    matter.mockTrialProfile?.rounds.forEach((round) => {
      if (typeof round.prosecutionScore === "number" && typeof round.defenseScore === "number") {
        spreads.push(Math.abs(round.prosecutionScore - round.defenseScore));
      }
    });
  });
  if (!spreads.length) {
    return 0;
  }
  return spreads.reduce((sum, spread) => sum + spread, 0) / spreads.length;
}
