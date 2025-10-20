'use client';

import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormFieldBase = {
  id: string;
  label: string;
  helper?: string;
  placeholder?: string;
};

export type DigitalFormField =
  | (FormFieldBase & { type: "text" | "email" | "number" | "date" | "time" })
  | (FormFieldBase & { type: "textarea"; rows?: number })
  | (FormFieldBase & { type: "select"; options: string[] });

export type DigitalForm = {
  id?: string;
  title: string;
  purpose: string;
  tags?: string[];
  stage?: string;
  fields: DigitalFormField[];
  completionNote?: string;
};

type DigitalFormCardProps = {
  form: DigitalForm;
};

export function DigitalFormCard({ form }: DigitalFormCardProps) {
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        form.fields.map((field) => [
          field.id,
          field.type === "select" ? (field.options[0] ?? "") : "",
        ]),
      ),
    [form.fields],
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [copied, setCopied] = useState(false);

  const serializedOutput = useMemo(() => {
    const lines: string[] = [];
    lines.push(`# ${form.title}`);
    lines.push(form.purpose);
    lines.push("");
    for (const field of form.fields) {
      const value = values[field.id] ?? "";
      lines.push(`${field.label}: ${value || "(not recorded)"}`);
    }
    if (form.completionNote) {
      lines.push("");
      lines.push(`Notes: ${form.completionNote}`);
    }
    return lines.join("\n");
  }, [form.completionNote, form.fields, form.purpose, form.title, values]);

  return (
    <Card className="border-slate-200 shadow-sm" id={form.id}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-xl font-semibold text-slate-900">{form.title}</CardTitle>
          {form.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-700">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <p className="text-sm text-slate-600">{form.purpose}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {form.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`${form.title}-${field.id}`} className="text-sm text-slate-700">
                {field.label}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={`${form.title}-${field.id}`}
                  value={values[field.id] ?? ""}
                  rows={field.rows ?? 4}
                  placeholder={field.placeholder}
                  onChange={(event) => {
                    setValues((prev) => ({
                      ...prev,
                      [field.id]: event.target.value,
                    }));
                    setCopied(false);
                  }}
                />
              ) : field.type === "select" ? (
                <select
                  id={`${form.title}-${field.id}`}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-10 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow]"
                  value={values[field.id] ?? ""}
                  onChange={(event) => {
                    setValues((prev) => ({
                      ...prev,
                      [field.id]: event.target.value,
                    }));
                    setCopied(false);
                  }}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`${form.title}-${field.id}`}
                  type={field.type}
                  value={values[field.id] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => {
                    setValues((prev) => ({
                      ...prev,
                      [field.id]: event.target.value,
                    }));
                    setCopied(false);
                  }}
                />
              )}
              {field.helper ? <p className="text-xs text-slate-500">{field.helper}</p> : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(serializedOutput);
                setCopied(true);
              } catch (error) {
                console.error("Unable to copy form values", error);
              }
            }}
          >
            {copied ? "Copied to clipboard" : "Copy responses"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setValues(initialValues);
              setCopied(false);
            }}
          >
            Reset form
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.print();
              }
            }}
          >
            Print / Save as PDF
          </Button>
        </div>

        <Alert variant="default" className="border-slate-200 bg-slate-50">
          <AlertTitle>Digital record keeping</AlertTitle>
          <AlertDescription className="text-xs text-slate-600">
            Copy responses into your shared case management notes or upload them to the Life-AI workspace for tracking.
            The clipboard summary includes field labels so you can paste into documentation systems without losing context.
          </AlertDescription>
        </Alert>

        {form.completionNote ? (
          <p className="text-xs text-slate-500">{form.completionNote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
