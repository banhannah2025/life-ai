"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Loader2, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FieldType = "short-text" | "long-text" | "email" | "number" | "multiple-choice";

export type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  description?: string;
  options?: string[];
};

export type FormDocumentData = {
  title?: string;
  description?: string;
  fields: FormField[];
};

const fieldTypeOptions: Array<{ value: FieldType; label: string }> = [
  { value: "short-text", label: "Short answer" },
  { value: "long-text", label: "Paragraph" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "multiple-choice", label: "Multiple choice" },
];

const createId = () => `field-${Math.random().toString(36).slice(2, 10)}`;

const DEFAULT_FORM: FormDocumentData = {
  title: "Untitled form",
  description: "",
  fields: [
    { id: createId(), label: "Name", type: "short-text", required: false },
    { id: createId(), label: "Email", type: "email", required: false },
  ],
};

function normalizeForm(data: FormDocumentData | null | undefined): FormDocumentData {
  if (!data) {
    return DEFAULT_FORM;
  }

  const fields = Array.isArray(data.fields) && data.fields.length
    ? data.fields.map((field) => ({
        id: field.id || createId(),
        label: field.label ?? "Untitled field",
        type: (field.type as FieldType) ?? "short-text",
        required: field.required ?? false,
        description: field.description ?? "",
        options:
          field.type === "multiple-choice"
            ? (Array.isArray(field.options) && field.options.length ? [...field.options] : ["Option 1"])
            : undefined,
      }))
    : DEFAULT_FORM.fields;

  return {
    title: data.title ?? DEFAULT_FORM.title,
    description: data.description ?? "",
    fields,
  };
}

type Status = "idle" | "saving" | "saved" | "error";

export function FormEditor({ documentId, initialForm }: { documentId: string; initialForm: FormDocumentData | null }) {
  const [form, setForm] = useState<FormDocumentData>(() => normalizeForm(initialForm));
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const persistForm = useCallback(
    async (payload: FormDocumentData) => {
      try {
        setStatus("saving");
        setError(null);
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: JSON.stringify(payload) }),
        });

        if (!response.ok) {
          const message = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(message?.error ?? "Failed to save form");
        }

        setStatus("saved");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to save form");
      }
    },
    [documentId],
  );

  const saveForm = useDebouncedCallback((payload: FormDocumentData) => {
    void persistForm(payload);
  }, 800);

  const queueSave = (next: FormDocumentData) => {
    saveForm(next);
  };

  const updateForm = (updater: (prev: FormDocumentData) => FormDocumentData) => {
    let nextForm: FormDocumentData = DEFAULT_FORM;
    setForm((prev) => {
      const next = normalizeForm(updater(prev));
      nextForm = next;
      queueSave(next);
      return next;
    });
    return nextForm;
  };

  const handleFieldChange = (id: string, updates: Partial<FormField>) => {
    updateForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => (field.id === id ? { ...field, ...updates } : field)),
    }));
  };

  const handleFieldTypeChange = (id: string, type: FieldType) => {
    updateForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === id
          ? {
              ...field,
              type,
              options: type === "multiple-choice" ? field.options ?? ["Option 1"] : undefined,
            }
          : field
      ),
    }));
  };

  const handleAddField = () => {
    updateForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        { id: createId(), label: "New question", type: "short-text", required: false, description: "" },
      ],
    }));
  };

  const handleRemoveField = (id: string) => {
    updateForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== id),
    }));
  };

  const handleAddOption = (id: string) => {
    updateForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === id && field.type === "multiple-choice"
          ? { ...field, options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] }
          : field
      ),
    }));
  };

  const handleOptionChange = (id: string, index: number, value: string) => {
    updateForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => {
        if (field.id !== id || field.type !== "multiple-choice") {
          return field;
        }
        const options = [...(field.options ?? [])];
        options[index] = value;
        return { ...field, options };
      }),
    }));
  };

  const handleRemoveOption = (id: string, index: number) => {
    updateForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => {
        if (field.id !== id || field.type !== "multiple-choice") {
          return field;
        }
        const options = (field.options ?? []).filter((_, i) => i !== index);
        return { ...field, options: options.length ? options : ["Option 1"] };
      }),
    }));
  };

  const handleManualSave = async () => {
    setLoading(true);
    await persistForm(form);
    setLoading(false);
  };

  const footerMessage = useMemo(() => {
    if (status === "saving") {
      return "Saving…";
    }
    if (status === "saved") {
      return "All changes saved";
    }
    if (status === "error") {
      return error ?? "Failed to save";
    }
    return "Changes will save automatically";
  }, [status, error]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-slate-900">Form builder</CardTitle>
        <Button variant="outline" size="sm" onClick={handleManualSave} disabled={loading || status === "saving"}>
          {loading || status === "saving" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving
            </span>
          ) : (
            "Save now"
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="form-title">Form title</Label>
          <Input
            id="form-title"
            value={form.title ?? ""}
            onChange={(event) => updateForm((prev) => ({ ...prev, title: event.target.value }))}
            className="h-10 text-lg font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-description">Description</Label>
          <Textarea
            id="form-description"
            value={form.description ?? ""}
            onChange={(event) => updateForm((prev) => ({ ...prev, description: event.target.value }))}
            className="min-h-20"
          />
        </div>
        <div className="flex flex-col gap-4">
          {form.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-inner">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`field-label-${field.id}`}>Question</Label>
                  <Input
                    id={`field-label-${field.id}`}
                    value={field.label}
                    onChange={(event) => handleFieldChange(field.id, { label: event.target.value })}
                  />
                  <Label htmlFor={`field-description-${field.id}`} className="text-xs font-medium uppercase text-slate-500">
                    Description
                  </Label>
                  <Textarea
                    id={`field-description-${field.id}`}
                    value={field.description ?? ""}
                    onChange={(event) => handleFieldChange(field.id, { description: event.target.value })}
                    className="min-h-20 text-sm"
                  />
                </div>
                <div className="flex w-full flex-shrink-0 flex-col gap-2 md:w-60">
                  <Label className="text-xs font-medium uppercase text-slate-500">Answer type</Label>
                  <Select value={field.type} onValueChange={(value: FieldType) => handleFieldTypeChange(field.id, value)}>
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span className="text-slate-600">Required</span>
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => handleFieldChange(field.id, { required: checked })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-2 text-sm text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
              {field.type === "multiple-choice" ? (
                <div className="mt-4 space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Options</Label>
                  <div className="flex flex-col gap-2">
                    {(field.options ?? []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(event) => handleOptionChange(field.id, optionIndex, event.target.value)}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(field.id, optionIndex)}
                          className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          aria-label="Remove option"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleAddOption(field.id)} className="mt-2 w-fit">
                    <Plus className="mr-2 h-4 w-4" />
                    Add option
                  </Button>
                </div>
              ) : null}
              <div className="mt-2 text-xs text-slate-500">Question {index + 1}</div>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={handleAddField} className="w-fit">
          <Plus className="mr-2 h-4 w-4" />
          Add question
        </Button>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-slate-500">
        <span>{footerMessage}</span>
        {status === "error" ? <span className="text-rose-500">{error}</span> : null}
      </CardFooter>
    </Card>
  );
}
