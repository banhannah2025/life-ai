'use client';

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";

type CaseStage = "intake" | "investigation" | "discovery" | "briefing" | "hearing" | "appeal" | "closed";
type CaseStatus = "active" | "on_hold" | "closed";
type PriorityLevel = "low" | "medium" | "high";
export type CaseType = "legal" | "restorative" | "mock_trial";

type RestorativeParticipantRole = "harmed" | "responsible" | "caregiver" | "advocate";

export type RestorativeParticipant = {
  id: string;
  name: string;
  role: RestorativeParticipantRole;
  contact?: string;
};

export type RestorativeIntake = {
  referralSource: string;
  incidentSummary: string;
  goals: string[];
  supportNeeds?: string;
  riskFactors: string[];
  preferredFacilitator?: string;
  notes?: string;
};

export type RestorativeFormStatus = {
  consentSigned: boolean;
  safetyPlanOnFile: boolean;
  mediaReleaseSigned: boolean;
};

export type RestorativeSession = {
  id: string;
  date: string;
  facilitator: string;
  focusArea: string;
  summary: string;
  agreements: string[];
  followUpDate?: string;
};

export type RestorativeProfile = {
  intake: RestorativeIntake | null;
  participants: RestorativeParticipant[];
  forms: RestorativeFormStatus;
  carePlan?: string;
  sessions: RestorativeSession[];
};

export type MockTrialRole = "prosecution" | "defense" | "judge" | "restorative_panel";

export type MockTrialRound = {
  id: string;
  roundName: string;
  scheduledFor: string;
  venue?: string;
  judgePanel: string[];
  prosecutionScore?: number;
  defenseScore?: number;
  verdict?: string;
  notes?: string;
};

export type MockTrialProfile = {
  teamName: string;
  role: MockTrialRole;
  opponent?: string;
  casePacket?: string;
  strategyNotes?: string;
  rounds: MockTrialRound[];
};

export type ClientRecord = {
  id: string;
  name: string;
  organization?: string;
  primaryContact?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  caseIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CaseRecord = {
  id: string;
  matterNumber: string;
  caseName: string;
  clientId: string | null;
  clientName: string | null;
  caseType: CaseType;
  stage: CaseStage;
  status: CaseStatus;
  practiceArea: string;
  leadAttorney: string;
  team: string[];
  openedOn: string;
  nextDeadline?: string;
  description: string;
  priority: PriorityLevel;
  tags: string[];
  riskNotes?: string;
  programTag?: string | null;
  documentIds: string[];
  researchIds: string[];
  restorativeProfile?: RestorativeProfile | null;
  mockTrialProfile?: MockTrialProfile | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentStatus = "Drafting" | "In Review" | "Finalized";
export type DocumentWorkspaceType = "doc" | "sheet" | "slide" | "form" | "drawing";

export type DocumentJurisdiction = {
  id: string;
  label: string;
  courtRules: string[];
  filingNote?: string;
};

export type DocumentRecord = {
  id: string;
  caseIds: string[];
  title: string;
  type: string;
  owner: string;
  dueOn?: string;
  status: DocumentStatus;
  version: string;
  lastTouchedBy: string;
  updatedAt: string;
  summary: string;
  workspaceDocId?: string;
  workspaceDocType?: DocumentWorkspaceType;
  jurisdiction: DocumentJurisdiction | null;
};

export type ResearchStatus = "In Progress" | "Needs Update" | "Ready for Briefing";

export type ResearchAuthority = {
  citation: string;
  court: string;
  holding: string;
};

export type ResearchItem = {
  id: string;
  caseIds: string[];
  title: string;
  issue: string;
  jurisdiction: string;
  status: ResearchStatus;
  nextAction?: string;
  analysts: string[];
  updatedAt: string;
  summary: string;
  authorities: ResearchAuthority[];
  tags: string[];
};

export type TimeEntryStatus = "Draft" | "Submitted" | "Approved";

export type TimeEntry = {
  id: string;
  caseId: string;
  caseName: string;
  author: string;
  activity: string;
  hours: number;
  date: string;
  status: TimeEntryStatus;
  notes?: string;
};

export type ActivityType =
  | "case-created"
  | "case-updated"
  | "document-created"
  | "document-updated"
  | "research-created"
  | "research-updated"
  | "time-logged";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  label: string;
  relatedCaseIds: string[];
  timestamp: string;
};

const VALID_CASE_STAGES: Set<CaseStage> = new Set(["intake", "investigation", "discovery", "briefing", "hearing", "appeal", "closed"]);
const VALID_CASE_STATUS: Set<CaseStatus> = new Set(["active", "on_hold", "closed"]);
const VALID_PRIORITY: Set<PriorityLevel> = new Set(["low", "medium", "high"]);
const VALID_DOCUMENT_STATUS: Set<DocumentStatus> = new Set(["Drafting", "In Review", "Finalized"]);
const VALID_RESEARCH_STATUS: Set<ResearchStatus> = new Set(["In Progress", "Needs Update", "Ready for Briefing"]);
const VALID_TIME_STATUS: Set<TimeEntryStatus> = new Set(["Draft", "Submitted", "Approved"]);

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const PLACEHOLDER_CASE_IDS = new Set([
  "case-acme-finch",
  "case-state-rivera",
  "case-harbor-audit",
  "case-westhaven-renewable",
]);

const PLACEHOLDER_CLIENT_IDS = new Set(["client-acme", "client-state-program", "client-harbor", "client-westhaven"]);

function normalizeKey(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const defaultRestorativeForms: RestorativeFormStatus = {
  consentSigned: false,
  safetyPlanOnFile: false,
  mediaReleaseSigned: false,
};

function createEmptyRestorativeProfile(): RestorativeProfile {
  return {
    intake: null,
    participants: [],
    forms: { ...defaultRestorativeForms },
    carePlan: undefined,
    sessions: [],
  };
}

function createEmptyMockTrialProfile(teamName = "", role: MockTrialRole = "prosecution"): MockTrialProfile {
  return {
    teamName,
    role,
    rounds: [],
  };
}

function normalizeRestorativeProfile(value: unknown): RestorativeProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const participants: RestorativeParticipant[] = Array.isArray(record.participants)
    ? record.participants.reduce<RestorativeParticipant[]>((acc, entry) => {
        if (!entry || typeof entry !== "object") {
          return acc;
        }
        const ref = entry as Record<string, unknown>;
        const name = isString(ref.name) ? ref.name : null;
        if (!name) {
          return acc;
        }
        const role = isString(ref.role) ? (ref.role as RestorativeParticipantRole) : "harmed";
        acc.push({
          id: isString(ref.id) ? ref.id : generateId("restorative-participant"),
          name,
          role,
          contact: isString(ref.contact) ? ref.contact : undefined,
        });
        return acc;
      }, [])
    : [];

  const forms: RestorativeFormStatus = record.forms && typeof record.forms === "object"
    ? {
        consentSigned: Boolean((record.forms as Record<string, unknown>).consentSigned),
        safetyPlanOnFile: Boolean((record.forms as Record<string, unknown>).safetyPlanOnFile),
        mediaReleaseSigned: Boolean((record.forms as Record<string, unknown>).mediaReleaseSigned),
      }
    : { ...defaultRestorativeForms };

  const sessions: RestorativeSession[] = Array.isArray(record.sessions)
    ? record.sessions.reduce<RestorativeSession[]>((acc, entry) => {
        if (!entry || typeof entry !== "object") {
          return acc;
        }
        const ref = entry as Record<string, unknown>;
        const date = isString(ref.date) ? ref.date : null;
        const facilitator = isString(ref.facilitator) ? ref.facilitator : null;
        const focusArea = isString(ref.focusArea) ? ref.focusArea : "Circle";
        const summary = isString(ref.summary) ? ref.summary : "";
        if (!date || !facilitator) {
          return acc;
        }
        acc.push({
          id: isString(ref.id) ? ref.id : generateId("restorative-session"),
          date,
          facilitator,
          focusArea,
          summary,
          agreements: Array.isArray(ref.agreements) ? ref.agreements.filter(isString) : [],
          followUpDate: isString(ref.followUpDate) ? ref.followUpDate : undefined,
        });
        return acc;
      }, [])
    : [];

  const intakeRecord = record.intake && typeof record.intake === "object"
    ? ((): RestorativeIntake | null => {
        const ref = record.intake as Record<string, unknown>;
        const referralSource = isString(ref.referralSource) ? ref.referralSource : "";
        const incidentSummary = isString(ref.incidentSummary) ? ref.incidentSummary : "";
        const goals = Array.isArray(ref.goals) ? ref.goals.filter(isString) : [];
        const riskFactors = Array.isArray(ref.riskFactors) ? ref.riskFactors.filter(isString) : [];
        if (!referralSource && !incidentSummary && !goals.length && !riskFactors.length) {
          return null;
        }
        return {
          referralSource,
          incidentSummary,
          goals,
          supportNeeds: isString(ref.supportNeeds) ? ref.supportNeeds : undefined,
          riskFactors,
          preferredFacilitator: isString(ref.preferredFacilitator) ? ref.preferredFacilitator : undefined,
          notes: isString(ref.notes) ? ref.notes : undefined,
        };
      })()
    : null;

  return {
    intake: intakeRecord,
    participants,
    forms,
    carePlan: isString(record.carePlan) ? record.carePlan : undefined,
    sessions,
  };
}

function normalizeMockTrialProfile(value: unknown): MockTrialProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const rounds: MockTrialRound[] = Array.isArray(record.rounds)
    ? record.rounds.reduce<MockTrialRound[]>((acc, entry) => {
        if (!entry || typeof entry !== "object") {
          return acc;
        }
        const ref = entry as Record<string, unknown>;
        const roundName = isString(ref.roundName) ? ref.roundName : "Round";
        const scheduledFor = isString(ref.scheduledFor) ? ref.scheduledFor : new Date().toISOString();
        acc.push({
          id: isString(ref.id) ? ref.id : generateId("mock-round"),
          roundName,
          scheduledFor,
          venue: isString(ref.venue) ? ref.venue : undefined,
          judgePanel: Array.isArray(ref.judgePanel) ? ref.judgePanel.filter(isString) : [],
          prosecutionScore: typeof ref.prosecutionScore === "number" ? ref.prosecutionScore : undefined,
          defenseScore: typeof ref.defenseScore === "number" ? ref.defenseScore : undefined,
          verdict: isString(ref.verdict) ? ref.verdict : undefined,
          notes: isString(ref.notes) ? ref.notes : undefined,
        });
        return acc;
      }, [])
    : [];

  const role = isString(record.role) ? (record.role as MockTrialRole) : "prosecution";
  return {
    teamName: isString(record.teamName) ? record.teamName : "Mock Trial Team",
    role,
    opponent: isString(record.opponent) ? record.opponent : undefined,
    casePacket: isString(record.casePacket) ? record.casePacket : undefined,
    strategyNotes: isString(record.strategyNotes) ? record.strategyNotes : undefined,
    rounds,
  };
}

const PLACEHOLDER_CASE_NAME_KEYS = new Set(
  ["Acme Corp. v. Finch Supply Co.", "State v. Rivera", "Harbor Group Internal Audit", "Westhaven Renewable Series B"].map(normalizeKey),
);

const PLACEHOLDER_CLIENT_NAME_KEYS = new Set(
  ["Acme Corporation", "State Appointed Counsel Program", "Harbor Group Holdings", "Westhaven Renewable, Inc."].map(normalizeKey),
);

type CaseManagementState = {
  clients: ClientRecord[];
  cases: CaseRecord[];
  documents: DocumentRecord[];
  research: ResearchItem[];
  timeEntries: TimeEntry[];
  activity: ActivityItem[];
};

const STORAGE_KEY = "life-ai.case-management";

type CreateCaseInput = {
  caseName: string;
  client: string;
  clientId?: string | null;
  matterNumber: string;
  practiceArea: string;
  stage: CaseStage;
  status?: CaseStatus;
  leadAttorney: string;
  team?: string[];
  openedOn: string;
  nextDeadline?: string;
  description: string;
  priority: PriorityLevel;
  tags?: string[];
  riskNotes?: string;
  caseType?: CaseType;
  programTag?: string | null;
  restorativeProfile?: RestorativeProfile | null;
  mockTrialProfile?: MockTrialProfile | null;
};

type UpdateCaseInput = Partial<Omit<CreateCaseInput, "matterNumber" | "openedOn">> & {
  nextDeadline?: string | null;
  tags?: string[];
  riskNotes?: string | null;
  clientId?: string | null;
  client?: string;
};

type CreateDocumentInput = {
  caseIds: string[];
  title: string;
  type: string;
  owner: string;
  dueOn?: string;
  status: DocumentStatus;
  summary: string;
  workspaceDocId?: string;
  workspaceDocType?: DocumentWorkspaceType;
  jurisdiction: DocumentJurisdiction | null;
};

type UpdateDocumentInput = Partial<Omit<CreateDocumentInput, "caseIds">> & {
  caseIds?: string[];
};

type CreateResearchInput = {
  caseIds: string[];
  title: string;
  issue: string;
  jurisdiction: string;
  status: ResearchStatus;
  nextAction?: string;
  analysts: string[];
  summary: string;
  authorities: ResearchAuthority[];
  tags?: string[];
};

type UpdateResearchInput = Partial<CreateResearchInput> & {
  authorities?: ResearchAuthority[];
};

type LogTimeEntryInput = {
  caseId: string;
  author: string;
  activity: string;
  hours: number;
  date: string;
  notes?: string;
  status: TimeEntryStatus;
};

type UpdateTimeEntryInput = Partial<{
  caseId: string;
  caseName: string;
  author: string;
  activity: string;
  hours: number;
  date: string;
  notes?: string;
  status: TimeEntryStatus;
}>;

type RestorativeSessionInput = Omit<RestorativeSession, "id">;

type MockTrialRoundInput = {
  roundName: string;
  scheduledFor: string;
  venue?: string;
  judgePanel: string[];
};

type MockTrialRoundScoreInput = {
  prosecutionScore: number;
  defenseScore: number;
  verdict?: string;
  notes?: string;
};

type CreateClientInput = {
  name: string;
  organization?: string;
  primaryContact?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

type UpdateClientInput = Partial<CreateClientInput>;

type CaseManagementAction =
  | { type: "hydrate"; payload: CaseManagementState }
  | { type: "create-client"; payload: ClientRecord; activity: ActivityItem }
  | { type: "update-client"; payload: { clientId: string; updates: UpdateClientInput }; activity?: ActivityItem }
  | { type: "create-case"; payload: CaseRecord; activity: ActivityItem }
  | {
      type: "update-case";
      payload: { caseId: string; updates: UpdateCaseInput };
      activity?: ActivityItem;
    }
  | { type: "create-document"; payload: DocumentRecord; activity: ActivityItem }
  | {
      type: "update-document";
      payload: { documentId: string; updates: UpdateDocumentInput };
      activity?: ActivityItem;
    }
  | { type: "create-research"; payload: ResearchItem; activity: ActivityItem }
  | {
      type: "update-research";
      payload: { researchId: string; updates: UpdateResearchInput };
      activity?: ActivityItem;
    }
  | { type: "log-time"; payload: TimeEntry; activity: ActivityItem }
  | {
      type: "update-time";
      payload: { timeEntryId: string; updates: UpdateTimeEntryInput };
      activity?: ActivityItem;
    };

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialState(): CaseManagementState {
  return {
    clients: [],
    cases: [],
    documents: [],
    research: [],
    timeEntries: [],
    activity: [],
  };
}

function migrateStoredState(raw: unknown): CaseManagementState {
  const fallback = createInitialState();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const maybe = raw as Partial<CaseManagementState> & {
    cases?: unknown[];
    clients?: unknown[];
    documents?: unknown[];
    research?: unknown[];
    timeEntries?: unknown[];
    activity?: unknown[];
  };

  const now = new Date().toISOString();

  let clients: ClientRecord[] = Array.isArray(maybe.clients)
    ? maybe.clients
        .filter((client: unknown): client is Record<string, unknown> => typeof client === "object" && client !== null)
        .map((client) => {
          const id = isString(client.id) ? client.id : generateId("client");
          const name = isString(client.name) ? client.name : "Client";
          return {
            id,
            name,
            organization: isString(client.organization) ? client.organization : undefined,
            primaryContact: isString(client.primaryContact) ? client.primaryContact : undefined,
            contactEmail: isString(client.contactEmail) ? client.contactEmail : undefined,
            contactPhone: isString(client.contactPhone) ? client.contactPhone : undefined,
            notes: isString(client.notes) ? client.notes : undefined,
            caseIds: Array.isArray(client.caseIds) ? client.caseIds.filter(isString) : [],
            createdAt: isString(client.createdAt) ? client.createdAt : now,
            updatedAt: isString(client.updatedAt) ? client.updatedAt : now,
          };
        })
    : [];

  clients = clients.filter((client) => {
    if (PLACEHOLDER_CLIENT_IDS.has(client.id)) {
      return false;
    }
    if (PLACEHOLDER_CLIENT_NAME_KEYS.has(normalizeKey(client.name))) {
      return false;
    }
    return true;
  });

  const clientsById = new Map<string, ClientRecord>();
  const clientsByName = new Map<string, ClientRecord>();
  clients.forEach((client) => {
    clientsById.set(client.id, client);
    clientsByName.set(client.name.toLowerCase(), client);
  });

  const ensureClient = (name: string | null): ClientRecord | null => {
    if (!name) {
      return null;
    }
    const key = name.toLowerCase();
    const existing = clientsByName.get(key);
    if (existing) {
      return existing;
    }
    const id = generateId("client");
    const record: ClientRecord = {
      id,
      name,
      organization: undefined,
      primaryContact: undefined,
      contactEmail: undefined,
      contactPhone: undefined,
      notes: undefined,
      caseIds: [],
      createdAt: now,
      updatedAt: now,
    };
    clients.push(record);
    clientsById.set(id, record);
    clientsByName.set(key, record);
    return record;
  };

  let cases: CaseRecord[] = Array.isArray(maybe.cases)
    ? maybe.cases
        .filter((item: unknown): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => {
          const record = item as Record<string, unknown>;
          const id = isString(item.id) ? item.id : generateId("case");
          const caseName = isString(item.caseName)
            ? item.caseName
            : isString(record.name)
              ? (record.name as string)
              : "Untitled matter";
          const matterNumber = isString(item.matterNumber) ? item.matterNumber : "";

          let clientId = isString(item.clientId) ? item.clientId : null;
          let clientName =
            isString(item.clientName)
              ? item.clientName
              : isString(record.client)
                ? (record.client as string)
                : null;

          if (clientId && clientsById.has(clientId)) {
            clientName = clientsById.get(clientId)?.name ?? clientName;
          } else if (clientName) {
            const record = ensureClient(clientName);
            clientId = record?.id ?? clientId;
            clientName = record?.name ?? clientName;
          } else if (clientId && !clientsById.has(clientId)) {
            const record = ensureClient(clientName ?? "Client");
            clientId = record?.id ?? clientId;
            clientName = record?.name ?? clientName;
          }

          const stage = isString(item.stage) && VALID_CASE_STAGES.has(item.stage as CaseStage) ? (item.stage as CaseStage) : "intake";
          const status = isString(item.status) && VALID_CASE_STATUS.has(item.status as CaseStatus) ? (item.status as CaseStatus) : "active";
          const priority = isString(item.priority) && VALID_PRIORITY.has(item.priority as PriorityLevel) ? (item.priority as PriorityLevel) : "medium";
          const rawCaseType = isString((record as Record<string, unknown>).caseType)
            ? ((record as Record<string, unknown>).caseType as CaseType)
            : "legal";
          const caseType: CaseType = rawCaseType === "restorative" || rawCaseType === "mock_trial" ? rawCaseType : "legal";
          const restorativeProfile = normalizeRestorativeProfile((record as Record<string, unknown>).restorativeProfile);
          const mockTrialProfile = normalizeMockTrialProfile((record as Record<string, unknown>).mockTrialProfile);

          return {
            id,
            matterNumber,
            caseName,
            clientId,
            clientName: clientName ?? null,
            caseType,
            stage,
            status,
            practiceArea: isString(item.practiceArea) ? item.practiceArea : "General Practice",
            leadAttorney: isString(item.leadAttorney) ? item.leadAttorney : "Unassigned",
            team: Array.isArray(item.team) ? item.team.filter(isString) : [],
            openedOn: isString(item.openedOn) ? item.openedOn : now.slice(0, 10),
            nextDeadline: isString(item.nextDeadline) ? item.nextDeadline : undefined,
            description: isString(item.description) ? item.description : "",
            priority,
            tags: Array.isArray(item.tags) ? item.tags.filter(isString) : [],
            riskNotes: isString(item.riskNotes) ? item.riskNotes : undefined,
             programTag: isString((record as Record<string, unknown>).programTag)
               ? ((record as Record<string, unknown>).programTag as string)
               : null,
            documentIds: Array.isArray(item.documentIds) ? item.documentIds.filter(isString) : [],
            researchIds: Array.isArray(item.researchIds) ? item.researchIds.filter(isString) : [],
            restorativeProfile: restorativeProfile ?? (caseType === "restorative" ? createEmptyRestorativeProfile() : null),
            mockTrialProfile: mockTrialProfile ?? (caseType === "mock_trial" ? createEmptyMockTrialProfile(caseName) : null),
            createdAt: isString(item.createdAt) ? item.createdAt : now,
            updatedAt: isString(item.updatedAt) ? item.updatedAt : now,
          } as CaseRecord;
        })
    : [];

  cases = cases.filter((matter) => {
    if (PLACEHOLDER_CASE_IDS.has(matter.id)) {
      return false;
    }
    if (PLACEHOLDER_CASE_NAME_KEYS.has(normalizeKey(matter.caseName))) {
      return false;
    }
    return true;
  });

  const validCaseIds = new Set(cases.map((matter) => matter.id));
  clients = clients.map((client) => ({
    ...client,
    caseIds: client.caseIds.filter((caseId) => validCaseIds.has(caseId)),
  }));

  if (
    !cases.length &&
    !clients.length &&
    !Array.isArray(maybe.documents) &&
    !Array.isArray(maybe.research) &&
    !Array.isArray(maybe.timeEntries)
  ) {
    return fallback;
  }

  cases.forEach((matter) => {
    if (matter.clientId) {
      const client = clientsById.get(matter.clientId);
      if (client && !client.caseIds.includes(matter.id)) {
        client.caseIds.push(matter.id);
        client.updatedAt = now;
      }
    }
  });

  const documents: DocumentRecord[] = Array.isArray(maybe.documents)
    ? maybe.documents
        .filter((doc: unknown): doc is Record<string, unknown> => typeof doc === "object" && doc !== null)
        .map((doc) => {
          const record = doc as Record<string, unknown>;
          const id = isString(record.id) ? (record.id as string) : generateId("document");
          const owner = isString(record.owner) ? (record.owner as string) : "Unassigned";
          const status =
            isString(record.status) && VALID_DOCUMENT_STATUS.has(record.status as DocumentStatus)
              ? (record.status as DocumentStatus)
              : "Drafting";
          const caseIds = Array.isArray(record.caseIds) ? (record.caseIds as unknown[]).filter(isString) : [];
          const sanitizedCaseIds = caseIds.filter((caseId) => validCaseIds.has(caseId));
          const workspaceDocId = isString(record.workspaceDocId) ? (record.workspaceDocId as string) : undefined;
          const workspaceType =
            isString(record.workspaceDocType) && ["doc", "sheet", "slide", "form", "drawing"].includes(record.workspaceDocType as string)
              ? (record.workspaceDocType as DocumentWorkspaceType)
              : undefined;
          const jurisdiction =
            record.jurisdiction && typeof record.jurisdiction === "object"
              ? {
                  id: isString((record.jurisdiction as Record<string, unknown>).id)
                    ? ((record.jurisdiction as Record<string, unknown>).id as string)
                    : "",
                  label: isString((record.jurisdiction as Record<string, unknown>).label)
                    ? ((record.jurisdiction as Record<string, unknown>).label as string)
                    : "",
                  courtRules: Array.isArray((record.jurisdiction as Record<string, unknown>).courtRules)
                    ? ((record.jurisdiction as Record<string, unknown>).courtRules as unknown[]).filter(isString)
                    : [],
                  filingNote: isString((record.jurisdiction as Record<string, unknown>).filingNote)
                    ? ((record.jurisdiction as Record<string, unknown>).filingNote as string)
                    : undefined,
                }
              : null;
          const documentRecord: DocumentRecord = {
            id,
            caseIds: sanitizedCaseIds,
            title: isString(record.title) ? (record.title as string) : "Untitled document",
            type: isString(record.type) ? (record.type as string) : "Document",
            owner,
            dueOn: isString(record.dueOn) ? (record.dueOn as string) : undefined,
            status,
            version: isString(record.version) ? (record.version as string) : "v1",
            lastTouchedBy: isString(record.lastTouchedBy) ? (record.lastTouchedBy as string) : owner,
            updatedAt: isString(record.updatedAt) ? (record.updatedAt as string) : now,
            summary: isString(record.summary) ? (record.summary as string) : "",
            workspaceDocId,
            workspaceDocType: workspaceType,
            jurisdiction: jurisdiction && jurisdiction.id && jurisdiction.label ? jurisdiction : null,
          };
          return documentRecord;
        })
        .filter((doc) => doc.caseIds.length > 0)
    : [];

  const research: ResearchItem[] = Array.isArray(maybe.research)
    ? maybe.research
        .filter((item: unknown): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => {
          const record = item as Record<string, unknown>;
          const id = isString(record.id) ? (record.id as string) : generateId("research");
          const status =
            isString(record.status) && VALID_RESEARCH_STATUS.has(record.status as ResearchStatus)
              ? (record.status as ResearchStatus)
              : "In Progress";
          const caseIds = Array.isArray(record.caseIds) ? (record.caseIds as unknown[]).filter(isString) : [];
          const sanitizedCaseIds = caseIds.filter((caseId) => validCaseIds.has(caseId));
          const researchRecord: ResearchItem = {
            id,
            caseIds: sanitizedCaseIds,
            title: isString(record.title) ? (record.title as string) : "Research note",
            issue: isString(record.issue) ? (record.issue as string) : "Unspecified issue",
            jurisdiction: isString(record.jurisdiction) ? (record.jurisdiction as string) : "Mixed",
            status,
            nextAction: isString(record.nextAction) ? (record.nextAction as string) : undefined,
            analysts: Array.isArray(record.analysts) ? (record.analysts as unknown[]).filter(isString) : [],
            updatedAt: isString(record.updatedAt) ? (record.updatedAt as string) : now,
            summary: isString(record.summary) ? (record.summary as string) : "",
            authorities: Array.isArray(record.authorities)
              ? (record.authorities as unknown[])
                  .filter((auth: unknown): auth is Record<string, unknown> => typeof auth === "object" && auth !== null)
                  .map((auth) => ({
                    citation: isString(auth.citation) ? auth.citation : "Citation pending",
                    court: isString(auth.court) ? auth.court : "Authority",
                    holding: isString(auth.holding) ? auth.holding : "Holding summary pending",
              }))
              : [],
            tags: Array.isArray(record.tags) ? (record.tags as unknown[]).filter(isString) : [],
          };
          return researchRecord;
        })
        .filter((item) => item.caseIds.length > 0)
    : [];

  const timeEntries: TimeEntry[] = Array.isArray(maybe.timeEntries)
    ? maybe.timeEntries
        .filter((entry: unknown): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
        .map((entry) => {
          const record = entry as Record<string, unknown>;
          const id = isString(record.id) ? (record.id as string) : generateId("time");
          const status =
            isString(record.status) && VALID_TIME_STATUS.has(record.status as TimeEntryStatus)
              ? (record.status as TimeEntryStatus)
              : "Draft";
          const timeEntry: TimeEntry = {
            id,
            caseId: isString(record.caseId) ? (record.caseId as string) : "",
            caseName: isString(record.caseName) ? (record.caseName as string) : "",
            author: isString(record.author) ? (record.author as string) : "Unknown",
            activity: isString(record.activity) ? (record.activity as string) : "Unspecified activity",
            hours: typeof record.hours === "number" ? (record.hours as number) : 0,
            date: isString(record.date) ? (record.date as string) : now.slice(0, 10),
            status,
            notes: isString(record.notes) ? (record.notes as string) : undefined,
          };
          return timeEntry;
        })
        .filter((entry) => entry.caseId && validCaseIds.has(entry.caseId))
    : [];

  const activity: ActivityItem[] = Array.isArray(maybe.activity)
    ? maybe.activity
        .filter((log: unknown): log is Record<string, unknown> => typeof log === "object" && log !== null)
        .map((log) => {
          const record = log as Record<string, unknown>;
          return {
            id: isString(record.id) ? (record.id as string) : generateId("activity"),
            type: isString(record.type) ? (record.type as ActivityType) : "case-updated",
            label: isString(record.label) ? (record.label as string) : "Activity recorded",
            relatedCaseIds: Array.isArray(record.relatedCaseIds) ? (record.relatedCaseIds as unknown[]).filter(isString) : [],
            timestamp: isString(record.timestamp) ? (record.timestamp as string) : now,
          };
        })
        .map((item) => ({
          ...item,
          relatedCaseIds: item.relatedCaseIds.filter((caseId) => !PLACEHOLDER_CASE_IDS.has(caseId)),
        }))
        .filter((item) => item.relatedCaseIds.length === 0 || item.relatedCaseIds.some((caseId) => validCaseIds.has(caseId)))
    : [];

  return {
    clients,
    cases,
    documents,
    research,
    timeEntries,
    activity,
  };
}

function pruneActivity(activity: ActivityItem[]) {
  return activity
    .slice()
    .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
    .slice(0, 25);
}

function caseManagementReducer(state: CaseManagementState, action: CaseManagementAction): CaseManagementState {
  switch (action.type) {
    case "hydrate": {
      return action.payload;
    }
    case "create-client": {
      const clients = [action.payload, ...state.clients];
      const activity = pruneActivity([action.activity, ...state.activity]);
      return { ...state, clients, activity };
    }
    case "update-client": {
      const { clientId, updates } = action.payload;
      const clients = state.clients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : client,
      );
      const activity = action.activity ? pruneActivity([action.activity, ...state.activity]) : state.activity;
      const cases = state.cases.map((caseRecord) => {
        if (caseRecord.clientId !== clientId) {
          return caseRecord;
        }
        return {
          ...caseRecord,
          clientName: updates.name ?? caseRecord.clientName,
        };
      });
      return { ...state, clients, cases, activity };
    }
    case "create-case": {
      const cases = [action.payload, ...state.cases];
      const activity = pruneActivity([action.activity, ...state.activity]);
      const clients = state.clients.map((client) =>
        action.payload.clientId === client.id
          ? {
              ...client,
              caseIds: Array.from(new Set([action.payload.id, ...client.caseIds])),
              updatedAt: new Date().toISOString(),
            }
          : client,
      );
      return { ...state, cases, clients, activity };
    }
    case "update-case": {
      const { caseId, updates } = action.payload;
      const cases = state.cases.map((item) => {
        if (item.id !== caseId) {
          return item;
        }
        const nextDeadline =
          updates.nextDeadline === null
            ? undefined
            : updates.nextDeadline ?? item.nextDeadline;
        const riskNotes = updates.riskNotes === null ? undefined : updates.riskNotes ?? item.riskNotes;
        const updated: CaseRecord = {
          ...item,
          ...updates,
          nextDeadline,
          riskNotes,
          tags: updates.tags ?? item.tags,
          updatedAt: new Date().toISOString(),
        };
        if (typeof updates.clientId !== "undefined" || typeof updates.client !== "undefined") {
          updated.clientId = typeof updates.clientId !== "undefined" ? updates.clientId : item.clientId;
          if (updates.clientId) {
            const client = state.clients.find((record) => record.id === updates.clientId);
            updated.clientName = client?.name ?? updates.client ?? updated.clientName ?? null;
          } else if (updates.client) {
            updated.clientName = updates.client;
          }
        }
        if (updates.client && !updates.clientId) {
          updated.clientName = updates.client;
        }
        return updated;
      });
      const activity = action.activity ? pruneActivity([action.activity, ...state.activity]) : state.activity;
      let clients = state.clients;
      if (typeof updates.clientId !== "undefined") {
        const previousClientId = state.cases.find((item) => item.id === caseId)?.clientId ?? null;
        const nextClientId = updates.clientId ?? null;

        clients = state.clients.map((client) => {
          if (client.id === previousClientId && previousClientId !== nextClientId) {
            return {
              ...client,
              caseIds: client.caseIds.filter((id) => id !== caseId),
              updatedAt: new Date().toISOString(),
            };
          }
          if (client.id === nextClientId) {
            return {
              ...client,
              caseIds: Array.from(new Set([caseId, ...client.caseIds])),
              updatedAt: new Date().toISOString(),
            };
          }
          return client;
        });
      }
      return { ...state, cases, clients, activity };
    }
    case "create-document": {
      const documents = [action.payload, ...state.documents];
      const cases = state.cases.map((item) =>
        action.payload.caseIds.includes(item.id)
          ? {
              ...item,
              documentIds: Array.from(new Set([action.payload.id, ...item.documentIds])),
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      const activity = pruneActivity([action.activity, ...state.activity]);
      return { ...state, documents, cases, activity };
    }
    case "update-document": {
      const { documentId, updates } = action.payload;
      const documents = state.documents.map((doc) => {
        if (doc.id !== documentId) {
          return doc;
        }
        return {
          ...doc,
          ...updates,
          caseIds: updates.caseIds ?? doc.caseIds,
          updatedAt: new Date().toISOString(),
        };
      });

      let cases = state.cases;
      if (action.payload.updates.caseIds) {
        const newCaseIds = action.payload.updates.caseIds;
        cases = state.cases.map((item) => {
          const hasDoc = documents.find((doc) => doc.id === documentId && doc.caseIds.includes(item.id));
          if (hasDoc && !item.documentIds.includes(documentId)) {
            return {
              ...item,
              documentIds: [documentId, ...item.documentIds],
            };
          }
          if (!hasDoc && item.documentIds.includes(documentId)) {
            return {
              ...item,
              documentIds: item.documentIds.filter((id) => id !== documentId),
            };
          }
          return item;
        });
        // ensure cases referenced in newCaseIds contain document id
        cases = cases.map((item) =>
          newCaseIds.includes(item.id)
            ? {
                ...item,
                documentIds: Array.from(new Set([documentId, ...item.documentIds])),
              }
            : item,
        );
      }

      const activity = action.activity ? pruneActivity([action.activity, ...state.activity]) : state.activity;
      return { ...state, documents, cases, activity };
    }
    case "create-research": {
      const research = [action.payload, ...state.research];
      const cases = state.cases.map((item) =>
        action.payload.caseIds.includes(item.id)
          ? {
              ...item,
              researchIds: Array.from(new Set([action.payload.id, ...item.researchIds])),
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      const activity = pruneActivity([action.activity, ...state.activity]);
      return { ...state, research, cases, activity };
    }
    case "update-research": {
      const { researchId, updates } = action.payload;
      const research = state.research.map((item) => {
        if (item.id !== researchId) {
          return item;
        }
        return {
          ...item,
          ...updates,
          caseIds: updates.caseIds ?? item.caseIds,
          authorities: updates.authorities ?? item.authorities,
          updatedAt: new Date().toISOString(),
        };
      });

      let cases = state.cases;
      if (updates.caseIds) {
        const newCaseIds = updates.caseIds;
        cases = state.cases.map((item) => {
          const linked = research.find((note) => note.id === researchId && note.caseIds.includes(item.id));
          if (linked && !item.researchIds.includes(researchId)) {
            return {
              ...item,
              researchIds: [researchId, ...item.researchIds],
            };
          }
          if (!linked && item.researchIds.includes(researchId)) {
            return {
              ...item,
              researchIds: item.researchIds.filter((id) => id !== researchId),
            };
          }
          return item;
        });
        cases = cases.map((item) =>
          newCaseIds.includes(item.id)
            ? {
                ...item,
                researchIds: Array.from(new Set([researchId, ...item.researchIds])),
              }
            : item,
        );
      }

      const activity = action.activity ? pruneActivity([action.activity, ...state.activity]) : state.activity;
      return { ...state, research, cases, activity };
    }
    case "log-time": {
      const timeEntries = [action.payload, ...state.timeEntries];
      const activity = pruneActivity([action.activity, ...state.activity]);
      return { ...state, timeEntries, activity };
    }
    case "update-time": {
      const timeEntries = state.timeEntries.map((entry) =>
        entry.id === action.payload.timeEntryId ? { ...entry, ...action.payload.updates } : entry,
      );
      const activity = action.activity ? pruneActivity([action.activity, ...state.activity]) : state.activity;
      return { ...state, timeEntries, activity };
    }
    default:
      return state;
  }
}

type CaseManagementContextValue = {
  createClient: (input: CreateClientInput) => string;
  updateClient: (clientId: string, updates: UpdateClientInput) => void;
  state: CaseManagementState;
  createCase: (input: CreateCaseInput) => string;
  updateCase: (caseId: string, updates: UpdateCaseInput) => void;
  createDocument: (input: CreateDocumentInput) => string;
  updateDocument: (documentId: string, updates: UpdateDocumentInput) => void;
  createResearchItem: (input: CreateResearchInput) => string;
  updateResearchItem: (researchId: string, updates: UpdateResearchInput) => void;
  logTimeEntry: (input: LogTimeEntryInput) => string;
  updateTimeEntry: (timeEntryId: string, updates: UpdateTimeEntryInput) => void;
  saveRestorativeProfile: (caseId: string, profile: RestorativeProfile) => void;
  logRestorativeSession: (caseId: string, session: RestorativeSessionInput) => void;
  scheduleMockTrialRound: (caseId: string, round: MockTrialRoundInput) => void;
  scoreMockTrialRound: (caseId: string, roundId: string, result: MockTrialRoundScoreInput) => void;
};

const CaseManagementContext = createContext<CaseManagementContextValue | null>(null);

export function CaseManagementProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(caseManagementReducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = migrateStoredState(JSON.parse(stored));
        dispatch({ type: "hydrate", payload: parsed });
      }
    } catch (error) {
      console.warn("Failed to restore case management state from storage", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<CaseManagementContextValue>(() => {
    function buildActivity(label: string, type: ActivityType, relatedCaseIds: string[]): ActivityItem {
      return {
        id: generateId("activity"),
        type,
        label,
        relatedCaseIds,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      state,
      createClient: (input) => {
        const now = new Date().toISOString();
        const id = generateId("client");
        const record: ClientRecord = {
          id,
          name: input.name,
          organization: input.organization,
          primaryContact: input.primaryContact,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          notes: input.notes,
          caseIds: [],
          createdAt: now,
          updatedAt: now,
        };
        dispatch({
          type: "create-client",
          payload: record,
          activity: buildActivity(`New client added: ${input.name}`, "case-created", []),
        });
        return id;
      },
      updateClient: (clientId, updates) => {
        dispatch({
          type: "update-client",
          payload: { clientId, updates },
          activity: buildActivity(`Client updated: ${updates.name ?? ""}`.trim() || "Client updated", "case-updated", []),
        });
      },
      createCase: (input) => {
        const now = new Date().toISOString();
        const id = generateId("case");
        const clientId = input.clientId ?? null;
        const client = clientId ? state.clients.find((record) => record.id === clientId) : null;
        const caseType: CaseType = input.caseType ?? "legal";
        const restorativeProfile =
          caseType === "restorative"
            ? input.restorativeProfile ?? createEmptyRestorativeProfile()
            : input.restorativeProfile ?? null;
        const mockTrialProfile =
          caseType === "mock_trial"
            ? input.mockTrialProfile ?? createEmptyMockTrialProfile(input.caseName)
            : input.mockTrialProfile ?? null;
        const record: CaseRecord = {
          id,
          matterNumber: input.matterNumber,
          caseName: input.caseName,
          clientId,
          clientName: client?.name ?? input.client ?? null,
          caseType,
          stage: input.stage,
          status: input.status ?? "active",
          practiceArea: input.practiceArea,
          leadAttorney: input.leadAttorney,
          team: input.team ?? [],
          openedOn: input.openedOn,
          nextDeadline: input.nextDeadline,
          description: input.description,
          priority: input.priority,
          tags: input.tags ?? [],
          riskNotes: input.riskNotes ?? undefined,
          programTag: input.programTag ?? null,
          documentIds: [],
          researchIds: [],
          restorativeProfile,
          mockTrialProfile,
          createdAt: now,
          updatedAt: now,
        };
        dispatch({
          type: "create-case",
          payload: record,
          activity: buildActivity(`New matter created: ${input.caseName}`, "case-created", [id]),
        });
        return id;
      },
      updateCase: (caseId, updates) => {
        dispatch({
          type: "update-case",
          payload: { caseId, updates },
          activity: buildActivity(`Matter updated: ${updates.caseName ?? ""}`.trim() || "Matter updated", "case-updated", [
            caseId,
          ]),
        });
      },
      createDocument: (input) => {
        const now = new Date().toISOString();
        const id = generateId("document");
        const record: DocumentRecord = {
          id,
          caseIds: input.caseIds,
          title: input.title,
          type: input.type,
          owner: input.owner,
          dueOn: input.dueOn,
          status: input.status,
          version: "Draft",
          lastTouchedBy: input.owner,
          updatedAt: now,
          summary: input.summary,
          workspaceDocId: input.workspaceDocId,
          workspaceDocType: input.workspaceDocType,
          jurisdiction: input.jurisdiction ?? null,
        };
        dispatch({
          type: "create-document",
          payload: record,
          activity: buildActivity(`Document added: ${input.title}`, "document-created", input.caseIds),
        });
        return id;
      },
      updateDocument: (documentId, updates) => {
        dispatch({
          type: "update-document",
          payload: { documentId, updates },
          activity: buildActivity("Document updated", "document-updated", updates.caseIds ?? []),
        });
      },
      createResearchItem: (input) => {
        const now = new Date().toISOString();
        const id = generateId("research");
        const record: ResearchItem = {
          id,
          caseIds: input.caseIds,
          title: input.title,
          issue: input.issue,
          jurisdiction: input.jurisdiction,
          status: input.status,
          nextAction: input.nextAction,
          analysts: input.analysts,
          updatedAt: now,
          summary: input.summary,
          authorities: input.authorities,
          tags: input.tags ?? [],
        };
        dispatch({
          type: "create-research",
          payload: record,
          activity: buildActivity(`Research logged: ${input.title}`, "research-created", input.caseIds),
        });
        return id;
      },
      updateResearchItem: (researchId, updates) => {
        dispatch({
          type: "update-research",
          payload: { researchId, updates },
          activity: buildActivity("Research updated", "research-updated", updates.caseIds ?? []),
        });
      },
      logTimeEntry: (input) => {
        const id = generateId("time");
        const entry: TimeEntry = {
          id,
          caseId: input.caseId,
          caseName: state.cases.find((item) => item.id === input.caseId)?.caseName ?? "",
          author: input.author,
          activity: input.activity,
          hours: input.hours,
          date: input.date,
          status: input.status,
          notes: input.notes,
        };
        dispatch({
          type: "log-time",
          payload: entry,
          activity: buildActivity(`Time logged: ${input.activity}`, "time-logged", [input.caseId]),
        });
        return id;
      },
      updateTimeEntry: (timeEntryId, updates) => {
        const existing = state.timeEntries.find((entry) => entry.id === timeEntryId);
        if (!existing) {
          return;
        }
        const caseId = updates.caseId ?? existing.caseId;
        const caseName =
          updates.caseId && updates.caseId !== existing.caseId
            ? state.cases.find((item) => item.id === updates.caseId)?.caseName ?? existing.caseName
            : existing.caseName;

        dispatch({
          type: "update-time",
          payload: {
            timeEntryId,
            updates: {
              ...updates,
              caseId,
              caseName,
            },
          },
          activity: buildActivity("Time entry updated", "time-logged", caseId ? [caseId] : []),
        });
      },
      saveRestorativeProfile: (caseId, profile) => {
        dispatch({
          type: "update-case",
          payload: { caseId, updates: { restorativeProfile: profile, caseType: "restorative" } },
          activity: buildActivity("Restorative profile updated", "case-updated", [caseId]),
        });
      },
      logRestorativeSession: (caseId, sessionInput) => {
        const matter = state.cases.find((item) => item.id === caseId);
        if (!matter) {
          return;
        }
        const baseProfile = matter.restorativeProfile ?? createEmptyRestorativeProfile();
        const session: RestorativeSession = {
          id: generateId("restorative-session"),
          ...sessionInput,
        };
        const updatedProfile: RestorativeProfile = {
          ...baseProfile,
          sessions: [session, ...baseProfile.sessions],
        };
        dispatch({
          type: "update-case",
          payload: { caseId, updates: { restorativeProfile: updatedProfile, caseType: "restorative" } },
          activity: buildActivity("Restorative session logged", "case-updated", [caseId]),
        });
      },
      scheduleMockTrialRound: (caseId, roundInput) => {
        const matter = state.cases.find((item) => item.id === caseId);
        if (!matter) {
          return;
        }
        const baseProfile = matter.mockTrialProfile ?? createEmptyMockTrialProfile(matter.caseName);
        const round: MockTrialRound = {
          id: generateId("mock-round"),
          ...roundInput,
        };
        const updatedProfile: MockTrialProfile = {
          ...baseProfile,
          rounds: [round, ...baseProfile.rounds],
        };
        dispatch({
          type: "update-case",
          payload: { caseId, updates: { mockTrialProfile: updatedProfile, caseType: "mock_trial" } },
          activity: buildActivity("Mock trial round scheduled", "case-updated", [caseId]),
        });
      },
      scoreMockTrialRound: (caseId, roundId, result) => {
        const matter = state.cases.find((item) => item.id === caseId);
        if (!matter || !matter.mockTrialProfile) {
          return;
        }
        const rounds = matter.mockTrialProfile.rounds.map((round) =>
          round.id === roundId
            ? {
                ...round,
                prosecutionScore: result.prosecutionScore,
                defenseScore: result.defenseScore,
                verdict: result.verdict,
                notes: result.notes,
              }
            : round,
        );
        const updatedProfile: MockTrialProfile = {
          ...matter.mockTrialProfile,
          rounds,
        };
        dispatch({
          type: "update-case",
          payload: { caseId, updates: { mockTrialProfile: updatedProfile, caseType: "mock_trial" } },
          activity: buildActivity("Mock trial round scored", "case-updated", [caseId]),
        });
      },
    };
  }, [state]);

  return <CaseManagementContext.Provider value={value}>{children}</CaseManagementContext.Provider>;
}

export function useCaseManagement() {
  const context = useContext(CaseManagementContext);
  if (!context) {
    throw new Error("useCaseManagement must be used within a CaseManagementProvider");
  }
  return context;
}

export function useOptionalCaseManagement() {
  return useContext(CaseManagementContext);
}
