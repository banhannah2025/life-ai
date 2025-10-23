"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

import {
  useCaseManagement,
  type CaseRecord,
  type DocumentRecord,
  type DocumentWorkspaceType,
  type DocumentJurisdiction,
} from "@/components/case-management/CaseManagementProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Loader2 } from "lucide-react";

type DocumentStatus = DocumentRecord["status"];

type DocumentFormState = {
  title: string;
  type: string;
  owner: string;
  dueOn: string;
  status: DocumentStatus;
  summary: string;
  caseIds: string[];
  workspaceDocType: DocumentWorkspaceType;
  generateWorkspaceDoc: boolean;
  existingWorkspaceDocId: string;
  jurisdictionId: string;
};

const workspaceDocTypeOptions: { value: DocumentWorkspaceType; label: string; helper: string }[] = [
  { value: "doc", label: "Rich document", helper: "Draft pleadings, briefs, and client-ready narratives." },
  { value: "form", label: "Smart intake form", helper: "Collect structured responses tied to matters." },
  { value: "sheet", label: "Matter workbook", helper: "Track damages, disclosures, or staffing in a grid." },
  { value: "slide", label: "Hearing deck", helper: "Prepare concise slide narratives for stakeholders." },
  { value: "drawing", label: "Whiteboard canvas", helper: "Map timelines or brainstorm case strategy visually." },
];

const jurisdictionCatalog: Array<DocumentJurisdiction & { filingNote: string }> = [
  {
    id: "us-federal-ny-sd",
    label: "U.S. District Court · Southern District of New York",
    courtRules: [
      "Conform to Local Civil Rule 11.1: 12-point font, double-spaced text, and 1-inch margins.",
      "Include attorney signature block with SDNY bar number and electronic signature per ECF Rule 2.2.",
      "Attach a Notice of Motion and Memorandum of Law as separate sections.",
    ],
    filingNote: "Remember to reserve time for ECF submission before midnight Eastern.",
  },
  {
    id: "state-ny-supreme-nyc",
    label: "New York Supreme Court · New York County",
    courtRules: [
      "Follow Uniform Rule 202.5: blue-backs not required for e-filed documents but caption must include IAS Part.",
      "Use 12-point typeface with double spacing except for block quotes and headings.",
      "Affidavits must include CPLR-compliant jurat and notary acknowledgement.",
    ],
    filingNote: "Check NYSCEF for Motion Sequence numbering before filing.",
  },
  {
    id: "state-ca-superior-la",
    label: "California Superior Court · Los Angeles County",
    courtRules: [
      "Adhere to California Rule of Court 2.111: caption must list attorney State Bar number and branch address.",
      "Number every line in the left margin; cite exhibits with tab numbers per Local Rule 3.3.",
      "Include a separate proof of service satisfying CCP §1013 for electronic service.",
    ],
    filingNote: "Courtesy copies may be required for complex cases within 5 court days.",
  },
  {
    id: "us-fed-9th-bap",
    label: "U.S. Bankruptcy Appellate Panel · Ninth Circuit",
    courtRules: [
      "Briefs limited to 13,000 words; include compliance certificate under Fed. R. Bankr. P. 8015.",
      "Use 14-point proportional font, double spacing, and cite to excerpts of record with ER page numbers.",
      "Cover page must state originating bankruptcy court and judge.",
    ],
    filingNote: "File through CM/ECF with combined pdf and text-searchable appendix.",
  },
];

function buildJurisdictionalDocHtml(title: string, owner: string, jurisdiction: DocumentJurisdiction) {
  const ruleItems = jurisdiction.courtRules
    .map((rule) => `<li>${rule}</li>`)
    .join("");

  const issuedOn = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return `
    <article class="jurisdiction-template">
      <header>
        <h1>${title}</h1>
        <p><strong>Jurisdiction:</strong> ${jurisdiction.label}</p>
        <p><strong>Prepared by:</strong> ${owner}</p>
        <p><strong>Drafted:</strong> ${issuedOn}</p>
      </header>
      <section>
        <h2>Filing checklist</h2>
        <ol>
          ${ruleItems}
        </ol>
      </section>
      <section>
        <h2>Drafting notes</h2>
        <p>Replace this section with the substantive pleading content while keeping the required formatting above.</p>
      </section>
    </article>
  `.trim();
}

function createEmptyDocumentForm(): DocumentFormState {
  return {
    title: "",
    type: "",
    owner: "",
    dueOn: "",
    status: "Drafting",
    summary: "",
    caseIds: [],
    workspaceDocType: "doc",
    generateWorkspaceDoc: true,
    existingWorkspaceDocId: "",
    jurisdictionId: "",
  };
}

export function CaseDocumentDrafting() {
  const { state, createDocument, updateDocument } = useCaseManagement();
  const { cases, documents, research } = state;

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(() => createEmptyDocumentForm());
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recentWorkspaceDoc, setRecentWorkspaceDoc] = useState<{
    docId: string;
    docType: DocumentWorkspaceType;
    title: string;
    jurisdictionLabel?: string;
  } | null>(null);
  const [documentActions, setDocumentActions] = useState<
    Record<string, { status: "idle" | "loading" | "error"; message?: string }>
  >({});

  const [linkDialogState, setLinkDialogState] = useState<{ open: boolean; documentId: string | null }>({
    open: false,
    documentId: null,
  });
  const [linkSelection, setLinkSelection] = useState<string[]>([]);
  const [workspaceLinkDialog, setWorkspaceLinkDialog] = useState<{
    open: boolean;
    documentId: string | null;
    docId: string;
    docType: DocumentWorkspaceType;
    initialDocId: string;
  }>({
    open: false,
    documentId: null,
    docId: "",
    docType: "doc",
    initialDocId: "",
  });
  const [workspaceLinkSaving, setWorkspaceLinkSaving] = useState(false);
  const [workspaceLinkError, setWorkspaceLinkError] = useState<string | null>(null);

  const statusBuckets = useMemo(() => {
    return ["Drafting", "In Review", "Finalized"].map((status) => ({
      status: status as DocumentStatus,
      items: documents.filter((doc) => doc.status === status),
    }));
  }, [documents]);

  const selectedJurisdiction = useMemo<DocumentJurisdiction | null>(() => {
    return jurisdictionCatalog.find((item) => item.id === documentForm.jurisdictionId) ?? null;
  }, [documentForm.jurisdictionId]);

  const upcomingDocuments = useMemo(() => {
    return documents
      .filter((doc) => doc.dueOn)
      .map((doc) => ({
        ...doc,
        dueDate: doc.dueOn ? parseISO(doc.dueOn) : undefined,
      }))
      .filter((doc): doc is DocumentRecord & { dueDate: Date } => Boolean(doc.dueDate))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [documents]);

  const documentsWithCoverage = useMemo(() => {
    return documents.map((doc) => {
      const linkedMatters = doc.caseIds
        .map((caseId) => cases.find((matter) => matter.id === caseId))
        .filter((matter): matter is CaseRecord => Boolean(matter));
      const linkedResearch = research.filter((item) => item.caseIds.some((caseId) => doc.caseIds.includes(caseId)));
      return {
        document: doc,
        matters: linkedMatters,
        research: linkedResearch,
      };
    });
  }, [cases, documents, research]);

  const hasCases = cases.length > 0;
  const hasDocuments = documents.length > 0;

  async function handleCreateDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSavingDocument) {
      return;
    }

    setFormError(null);

    const trimmedTitle = documentForm.title.trim();
    const trimmedOwner = documentForm.owner.trim();

    if (!trimmedTitle || !trimmedOwner) {
      return;
    }

    if (!selectedJurisdiction) {
      setFormError("Select a jurisdiction so we can apply the correct court rules.");
      return;
    }

    const jurisdiction = selectedJurisdiction;

    setIsSavingDocument(true);

    let workspaceDocId: string | undefined;
    let workspaceDocType: DocumentWorkspaceType | undefined;

    try {
      if (documentForm.generateWorkspaceDoc) {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: documentForm.workspaceDocType, name: trimmedTitle }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { docId?: string; docType?: string; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to create workspace document");
        }

        if (!payload?.docId) {
          throw new Error("Workspace document created without an identifier");
        }

        workspaceDocId = payload.docId;
        workspaceDocType = (payload.docType as DocumentWorkspaceType) ?? documentForm.workspaceDocType;
        await initializeWorkspaceDocument({
          docId: payload.docId,
          docType: workspaceDocType,
          title: trimmedTitle,
          owner: trimmedOwner,
          jurisdiction,
        });
      } else if (documentForm.existingWorkspaceDocId.trim()) {
        workspaceDocId = documentForm.existingWorkspaceDocId.trim();
        workspaceDocType = documentForm.workspaceDocType;
      }

      createDocument({
        caseIds: documentForm.caseIds,
        title: trimmedTitle,
        type: documentForm.type.trim() || "Memorandum",
        owner: trimmedOwner,
        dueOn: documentForm.dueOn ? documentForm.dueOn : undefined,
        status: documentForm.status,
        summary: documentForm.summary.trim(),
        workspaceDocId,
        workspaceDocType,
        jurisdiction,
      });

      if (workspaceDocId && workspaceDocType) {
        setRecentWorkspaceDoc({
          docId: workspaceDocId,
          docType: workspaceDocType,
          title: trimmedTitle,
          jurisdictionLabel: jurisdiction.label,
        });
      }

      setDocumentForm(createEmptyDocumentForm());
      setCreateDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save drafting workflow";
      setFormError(message);
    } finally {
      setIsSavingDocument(false);
    }
  }

  function openLinkDialog(doc: DocumentRecord) {
    setLinkSelection(doc.caseIds);
    setLinkDialogState({ open: true, documentId: doc.id });
  }

  function openWorkspaceLinkDialog(doc: DocumentRecord) {
    setWorkspaceLinkError(null);
    setWorkspaceLinkDialog({
      open: true,
      documentId: doc.id,
      docId: doc.workspaceDocId ?? "",
      docType: doc.workspaceDocType ?? "doc",
      initialDocId: doc.workspaceDocId ?? "",
    });
  }

  function submitLinkDialog() {
    if (!linkDialogState.documentId) {
      return;
    }
    updateDocument(linkDialogState.documentId, { caseIds: linkSelection });
    setLinkDialogState({ open: false, documentId: null });
  }

  function resetWorkspaceLinkDialog() {
    setWorkspaceLinkDialog({ open: false, documentId: null, docId: "", docType: "doc", initialDocId: "" });
    setWorkspaceLinkError(null);
  }

  function updateDocumentActionState(documentId: string, state: { status: "idle" | "loading" | "error"; message?: string }) {
    setDocumentActions((prev) => ({ ...prev, [documentId]: state }));
  }

  async function generateWorkspaceDocument(doc: DocumentRecord, preferredType?: DocumentWorkspaceType) {
    const typeToUse = preferredType ?? doc.workspaceDocType ?? "doc";
    updateDocumentActionState(doc.id, { status: "loading" });
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: typeToUse, name: doc.title }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { docId?: string; docType?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to generate workspace document");
      }
      if (!payload?.docId) {
        throw new Error("Workspace document created without an identifier");
      }
      const resolvedType = (payload.docType as DocumentWorkspaceType) ?? typeToUse;
      updateDocument(doc.id, { workspaceDocId: payload.docId, workspaceDocType: resolvedType });
      await initializeWorkspaceDocument({
        docId: payload.docId,
        docType: resolvedType,
        title: doc.title,
        owner: doc.owner,
        jurisdiction: doc.jurisdiction ?? null,
      });
      updateDocumentActionState(doc.id, { status: "idle" });
      setRecentWorkspaceDoc({
        docId: payload.docId,
        docType: resolvedType,
        title: doc.title,
        jurisdictionLabel: doc.jurisdiction?.label,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate workspace document";
      updateDocumentActionState(doc.id, { status: "error", message });
    }
  }

  function handleWorkspaceDocIdChange(value: string) {
    setWorkspaceLinkDialog((prev) => ({ ...prev, docId: value }));
  }

  function handleWorkspaceDocTypeInDialog(value: DocumentWorkspaceType) {
    setWorkspaceLinkDialog((prev) => ({ ...prev, docType: value }));
  }

  function handleDismissWorkspaceAlert() {
    setRecentWorkspaceDoc(null);
  }

  function handleClearActionState(documentId: string) {
    updateDocumentActionState(documentId, { status: "idle" });
  }

  function getDocumentTitle(documentId: string) {
    return documents.find((item) => item.id === documentId)?.title ?? "Document";
  }

  function documentActionFor(documentId: string) {
    return documentActions[documentId] ?? { status: "idle" as const };
  }

  async function initializeWorkspaceDocument({
    docId,
    docType,
    title,
    owner,
    jurisdiction,
  }: {
    docId: string;
    docType: DocumentWorkspaceType;
    title: string;
    owner: string;
    jurisdiction: DocumentJurisdiction | null;
  }) {
    if (docType !== "doc" || !jurisdiction) {
      return;
    }
    try {
      const content = buildJurisdictionalDocHtml(title, owner, jurisdiction);
      await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });
    } catch (error) {
      console.error("Failed to initialize workspace document", error);
    }
  }

  function getWorkspaceDocTypeLabel(value: DocumentWorkspaceType) {
    const match = workspaceDocTypeOptions.find((option) => option.value === value);
    return match ? match.label : "Workspace document";
  }

  function handleWorkspaceLinkSave() {
    if (!workspaceLinkDialog.documentId) {
      return;
    }
    const trimmed = workspaceLinkDialog.docId.trim();
    const linkedDocument = documents.find((item) => item.id === workspaceLinkDialog.documentId) ?? null;
    setWorkspaceLinkSaving(true);
    setWorkspaceLinkError(null);
    try {
      updateDocument(workspaceLinkDialog.documentId, {
        workspaceDocId: trimmed ? trimmed : undefined,
        workspaceDocType: workspaceLinkDialog.docType,
      });
      if (trimmed) {
        setRecentWorkspaceDoc({
          docId: trimmed,
          docType: workspaceLinkDialog.docType,
          title: linkedDocument?.title ?? getDocumentTitle(workspaceLinkDialog.documentId),
          jurisdictionLabel: linkedDocument?.jurisdiction?.label,
        });
      }
      resetWorkspaceLinkDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to link workspace document";
      setWorkspaceLinkError(message);
    } finally {
      setWorkspaceLinkSaving(false);
    }
  }

  function handleWorkspaceLinkRemove() {
    if (!workspaceLinkDialog.documentId) {
      return;
    }
    updateDocument(workspaceLinkDialog.documentId, {
      workspaceDocId: undefined,
      workspaceDocType: undefined,
    });
    resetWorkspaceLinkDialog();
  }

  const canSubmit =
    Boolean(documentForm.title.trim()) && Boolean(documentForm.owner.trim()) && Boolean(selectedJurisdiction);

  return (
    <div className="space-y-10">
      {recentWorkspaceDoc ? (
        <Alert className="border border-slate-200/70 bg-white shadow-sm">
          <FileText className="text-slate-500" />
          <AlertTitle>Workspace document ready</AlertTitle>
          <AlertDescription>
            <p>
              {getWorkspaceDocTypeLabel(recentWorkspaceDoc.docType)} for{" "}
              <span className="font-medium text-slate-800">{recentWorkspaceDoc.title}</span> is ready to edit or share.
            </p>
            {recentWorkspaceDoc.jurisdictionLabel ? (
              <p className="mt-1 text-xs text-slate-500">
                Court rules aligned to <span className="font-medium text-slate-700">{recentWorkspaceDoc.jurisdictionLabel}</span>.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/documents/${recentWorkspaceDoc.docId}`}>Open editor</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismissWorkspaceAlert}>
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case management · Drafting</p>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Document assembly workspace</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Coordinate drafting cycles, map citations, and keep every deliverable anchored to the matters and research
              driving it.
            </p>
            {!hasDocuments ? (
              <p className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No drafting items yet. Create a matter and add a document to start tracking workflows here.
              </p>
            ) : null}
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">Create drafting item</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <form className="space-y-6" onSubmit={handleCreateDocument}>
              <DialogHeader>
                <DialogTitle>New document workflow</DialogTitle>
                <DialogDescription>
                  Link this deliverable to matters so stakeholders see deadlines, owners, and research coverage.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="document-title">Title</Label>
                  <Input
                    id="document-title"
                    required
                    value={documentForm.title}
                    onChange={(event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Opposition to Motion to Dismiss"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-type">Type</Label>
                  <Input
                    id="document-type"
                    value={documentForm.type}
                    onChange={(event) => setDocumentForm((prev) => ({ ...prev, type: event.target.value }))}
                    placeholder="Pleading, Agreement, Memo…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-owner">Owner</Label>
                  <Input
                    id="document-owner"
                    required
                    value={documentForm.owner}
                    onChange={(event) => setDocumentForm((prev) => ({ ...prev, owner: event.target.value }))}
                    placeholder="Leo Choi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-status">Status</Label>
                  <Select
                    value={documentForm.status}
                    onValueChange={(value) => setDocumentForm((prev) => ({ ...prev, status: value as DocumentStatus }))}
                  >
                    <SelectTrigger id="document-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Drafting">Drafting</SelectItem>
                      <SelectItem value="In Review">In review</SelectItem>
                      <SelectItem value="Finalized">Finalized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-due">Due date</Label>
                  <Input
                    id="document-due"
                    type="date"
                    value={documentForm.dueOn}
                    onChange={(event) => setDocumentForm((prev) => ({ ...prev, dueOn: event.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="document-summary">Summary / scope</Label>
                  <Textarea
                    id="document-summary"
                    rows={3}
                    value={documentForm.summary}
                    onChange={(event) => setDocumentForm((prev) => ({ ...prev, summary: event.target.value }))}
                    placeholder="Brief outline, key issues, or dependencies for this deliverable."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="document-jurisdiction">Jurisdiction</Label>
                  <Select
                    value={documentForm.jurisdictionId}
                    onValueChange={(value) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        jurisdictionId: value,
                      }))
                    }
                  >
                    <SelectTrigger id="document-jurisdiction">
                      <SelectValue placeholder="Select the filing court" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictionCatalog.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedJurisdiction ? (
                    <div className="rounded-lg border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Court rules to follow</p>
                      <ul className="mt-2 space-y-1 pl-4 list-disc">
                        {selectedJurisdiction.courtRules.map((rule, index) => (
                          <li key={`${selectedJurisdiction.id}-rule-${index}`}>{rule}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-slate-500">{selectedJurisdiction.filingNote}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Pick the filing jurisdiction so we can apply the correct formatting and filing checklist.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2 rounded-md border border-slate-200/80 bg-slate-50/60 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Workspace document</p>
                      <p className="text-xs text-slate-500">
                        Create or link an editable workspace file alongside this matter deliverable.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Auto-create</span>
                      <Switch
                        checked={documentForm.generateWorkspaceDoc}
                        onCheckedChange={(checked) =>
                          setDocumentForm((prev) => ({
                            ...prev,
                            generateWorkspaceDoc: checked === true,
                            existingWorkspaceDocId: checked === true ? "" : prev.existingWorkspaceDocId,
                          }))
                        }
                      />
                    </div>
                  </div>
                  {documentForm.generateWorkspaceDoc ? (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="workspace-doc-type" className="text-xs uppercase text-slate-500">
                        Editor format
                      </Label>
                      <Select
                        value={documentForm.workspaceDocType}
                        onValueChange={(value) =>
                          setDocumentForm((prev) => ({
                            ...prev,
                            workspaceDocType: value as DocumentWorkspaceType,
                          }))
                        }
                      >
                        <SelectTrigger id="workspace-doc-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaceDocTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        {
                          workspaceDocTypeOptions.find((option) => option.value === documentForm.workspaceDocType)
                            ?.helper
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="workspace-doc-id" className="text-xs uppercase text-slate-500">
                        Existing workspace document ID
                      </Label>
                      <Input
                        id="workspace-doc-id"
                        value={documentForm.existingWorkspaceDocId}
                        onChange={(event) =>
                          setDocumentForm((prev) => ({ ...prev, existingWorkspaceDocId: event.target.value }))
                        }
                        placeholder="Paste an existing document identifier"
                      />
                      <p className="text-xs text-slate-500">
                        Use a document id from the Documents workspace. Leave blank to attach later.
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Attach to matters</Label>
                  {hasCases ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cases.map((matter) => {
                        const isChecked = documentForm.caseIds.includes(matter.id);
                        return (
                          <label
                            key={matter.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                setDocumentForm((prev) => ({
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
                      Create a client and matter first so you can associate drafting work.
                    </p>
                  )}
                </div>
              </div>
              {formError ? (
                <Alert variant="destructive">
                  <AlertTitle>Workflow not saved</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingDocument || !canSubmit}>
                  {isSavingDocument ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </span>
                  ) : !canSubmit ? (
                    "Select jurisdiction to save"
                  ) : (
                    "Save drafting item"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          {statusBuckets.map((bucket) => {
            const helper =
              bucket.status === "Finalized"
                ? "Filed or executed"
                : bucket.status === "In Review"
                  ? "Ready for partner / client review"
                  : "Drafting in progress";
            return (
              <Card key={bucket.status} className="border border-slate-200/70 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>{bucket.status}</CardDescription>
                  <CardTitle className="text-2xl font-semibold text-slate-900">{bucket.items.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{helper}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Drafting queue</h2>
          <p className="text-sm text-slate-500">
            Update statuses, keep deadlines on radar, and jump into supporting research.
          </p>
        </header>
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[220px]">Document</TableHead>
                  <TableHead>Matters</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsWithCoverage.length ? (
                  documentsWithCoverage.map(({ document, matters, research: linkedResearch }) => {
                    const dueDate = document.dueOn ? parseISO(document.dueOn) : null;
                    const daysAhead = dueDate ? differenceInCalendarDays(dueDate, new Date()) : null;
                    const dueClass =
                      daysAhead === null
                        ? "text-slate-500"
                        : daysAhead < 0
                          ? "text-rose-600"
                          : daysAhead <= 5
                          ? "text-amber-600"
                            : "text-slate-700";
                    const actionState = documentActionFor(document.id);
                    const workspaceLabel = document.workspaceDocType
                      ? getWorkspaceDocTypeLabel(document.workspaceDocType)
                      : "Workspace doc";

                    return (
                      <TableRow key={document.id}>
                        <TableCell className="align-top">
                          <div className="flex flex-col text-sm text-slate-800">
                            <span className="font-semibold">{document.title}</span>
                            <span className="text-xs text-slate-500">{document.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1">
                            {matters.map((matter) => (
                              <Badge key={`${document.id}-${matter.id}`} variant="outline" className="w-fit text-xs text-slate-500">
                                {matter.caseName}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm text-slate-600">{document.owner}</TableCell>
                        <TableCell className="align-top">
                          <Select
                            value={document.status}
                            onValueChange={(value) => updateDocument(document.id, { status: value as DocumentStatus })}
                          >
                            <SelectTrigger className="h-9 w-36 text-left">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Drafting">Drafting</SelectItem>
                              <SelectItem value="In Review">In review</SelectItem>
                              <SelectItem value="Finalized">Finalized</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className={`align-top text-sm ${dueClass}`}>
                          {dueDate ? format(dueDate, "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="align-top text-sm text-slate-600">
                          <p className="line-clamp-3">{document.summary || "No summary yet."}</p>
                          {document.jurisdiction ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Jurisdiction:{" "}
                              <span className="font-medium text-slate-700">{document.jurisdiction.label}</span>
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-400">
                            {linkedResearch.length} research note(s) linked
                          </p>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <div className="flex flex-col items-end gap-2">
                            {document.workspaceDocId ? (
                              <>
                                <Button asChild size="sm">
                                  <Link href={`/documents/${document.workspaceDocId}`}>
                                    Open {workspaceLabel.toLowerCase()}
                                  </Link>
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openWorkspaceLinkDialog(document)}>
                                  Manage workspace link
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => generateWorkspaceDocument(document)}
                                  disabled={actionState.status === "loading"}
                                >
                                  {actionState.status === "loading" ? (
                                    <span className="inline-flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Generating…
                                    </span>
                                  ) : (
                                    `Generate ${workspaceLabel.toLowerCase()}`
                                  )}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openWorkspaceLinkDialog(document)}>
                                  Link existing doc
                                </Button>
                              </>
                            )}
                            {actionState.status === "error" ? (
                              <div className="flex flex-col items-end gap-1 text-xs text-rose-600">
                                <span className="max-w-[260px] text-right">{actionState.message}</span>
                                <button
                                  type="button"
                                  onClick={() => handleClearActionState(document.id)}
                                  className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                                >
                                  Dismiss
                                </button>
                              </div>
                            ) : null}
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/case-management/case-analysis?case=${matters[0]?.id ?? ""}`}>
                                View research
                              </Link>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openLinkDialog(document)}>
                              Edit case links
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      No drafting items yet. Create one to start tracking progress.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Upcoming deadlines</CardTitle>
            <CardDescription>Deliverables due soon across the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingDocuments.length ? (
              upcomingDocuments.slice(0, 6).map((doc) => {
                const dueIn = differenceInCalendarDays(doc.dueDate, new Date());
                const dueClass = dueIn < 0 ? "text-rose-600" : dueIn <= 5 ? "text-amber-600" : "text-slate-600";
                const matters = doc.caseIds
                  .map((caseId) => cases.find((matter) => matter.id === caseId))
                  .filter((matter): matter is CaseRecord => Boolean(matter));
                return (
                  <div key={`${doc.id}-queue`} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                      <span className="font-semibold">{doc.title}</span>
                      <span className={`text-xs font-semibold ${dueClass}`}>{format(doc.dueDate, "MMM d")}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Owner: {doc.owner}</span>
                      {matters.map((matter) => (
                        <span key={`${doc.id}-${matter.id}`} className="rounded-full bg-slate-100 px-2 py-1">
                          {matter.caseName}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No upcoming deadlines scheduled.</p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href="/case-management/time-tracking">Review staffing</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900">Research coverage</CardTitle>
            <CardDescription>Ensure every draft is backed by current authority.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentsWithCoverage.length ? documentsWithCoverage.map(({ document, research: linkedResearch }) => (
              <div key={`${document.id}-coverage`} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{document.title}</p>
                    <p className="text-xs text-slate-500">{document.owner}</p>
                    {document.jurisdiction ? (
                      <p className="text-xs text-slate-500">
                        Jurisdiction: <span className="font-medium text-slate-700">{document.jurisdiction.label}</span>
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    variant={linkedResearch.length ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {linkedResearch.length ? `${linkedResearch.length} research note(s)` : "Add research"}
                  </Badge>
                </div>
                {linkedResearch.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
                    {linkedResearch.slice(0, 3).map((item) => (
                      <li key={`${document.id}-${item.id}`}>
                        {item.title} · {item.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Link an analysis item from the research workspace before filing.
                  </p>
                )}
              </div>
            )) : (
              <p className="text-sm text-slate-500">No drafting items yet. Create a document to see research coverage.</p>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild size="sm">
              <Link href="/case-management/case-analysis">Open research workspace</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Workstreams by matter</h2>
          <p className="text-sm text-slate-500">Track drafting alongside each case&apos;s stage and research.</p>
        </header>
        <div className="grid gap-4 xl:grid-cols-2">
          {cases.map((matter) => {
            const matterDocs = documents.filter((doc) => doc.caseIds.includes(matter.id));
            const matterResearch = research.filter((item) => item.caseIds.includes(matter.id));
            return (
              <Card key={matter.id} className="border border-slate-200/70 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-900">{matter.caseName}</CardTitle>
                  <CardDescription>{matter.practiceArea}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {matterDocs.length ? (
                    matterDocs.map((doc) => (
                      <div key={doc.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-800">{doc.title}</span>
                          <Badge
                            variant={doc.status === "Finalized" ? "secondary" : doc.status === "In Review" ? "outline" : "destructive"}
                            className="text-xs"
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{doc.summary || "Summary forthcoming."}</p>
                        {doc.jurisdiction ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Jurisdiction: <span className="font-medium text-slate-700">{doc.jurisdiction.label}</span>
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-400">
                          Linked research: {matterResearch.length} · Owner: {doc.owner}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No drafting items linked yet.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Dialog
        open={linkDialogState.open}
        onOpenChange={(open) => setLinkDialogState((prev) => ({ open, documentId: open ? prev.documentId : null }))}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update matter links</DialogTitle>
            <DialogDescription>Select all matters collaborating on this document.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {cases.map((matter) => {
              const isChecked = linkSelection.includes(matter.id);
              return (
                <label
                  key={`doc-link-${matter.id}`}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      setLinkSelection((prev) => (checked ? [...prev, matter.id] : prev.filter((id) => id !== matter.id)))
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
            <Button type="button" variant="outline" onClick={() => setLinkDialogState({ open: false, documentId: null })}>
              Cancel
            </Button>
            <Button type="button" onClick={submitLinkDialog}>
              Save links
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={workspaceLinkDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            resetWorkspaceLinkDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage workspace document</DialogTitle>
            <DialogDescription>
              Link an existing workspace file or adjust the collaborative format for this drafting record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-link-type">Editor format</Label>
              <Select
                value={workspaceLinkDialog.docType}
                onValueChange={(value) => handleWorkspaceDocTypeInDialog(value as DocumentWorkspaceType)}
              >
                <SelectTrigger id="workspace-link-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workspaceDocTypeOptions.map((option) => (
                    <SelectItem key={`link-type-${option.value}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {workspaceDocTypeOptions.find((option) => option.value === workspaceLinkDialog.docType)?.helper}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-link-id">Workspace document ID</Label>
              <Input
                id="workspace-link-id"
                value={workspaceLinkDialog.docId}
                onChange={(event) => handleWorkspaceDocIdChange(event.target.value)}
                placeholder="Paste a document identifier (e.g. doc-abc123)"
              />
              <p className="text-xs text-slate-500">
                Link a file created in the Documents workspace. Leave empty to clear the current link.
              </p>
            </div>
            {workspaceLinkError ? <p className="text-xs text-rose-600">{workspaceLinkError}</p> : null}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={resetWorkspaceLinkDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleWorkspaceLinkRemove}
              disabled={!workspaceLinkDialog.initialDocId || workspaceLinkSaving}
            >
              Remove link
            </Button>
            <Button type="button" onClick={handleWorkspaceLinkSave} disabled={workspaceLinkSaving}>
              {workspaceLinkSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save workspace link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
