"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Loader2, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SheetRow = string[];

export type SheetData = {
  columns: string[];
  rows: SheetRow[];
};

const DEFAULT_SHEET: SheetData = {
  columns: ["Column A", "Column B", "Column C"],
  rows: [["", "", ""]],
};

function normalizeSheet(data: SheetData | null | undefined): SheetData {
  if (!data) {
    return DEFAULT_SHEET;
  }

  const columns = Array.isArray(data.columns) && data.columns.length > 0 ? [...data.columns] : [...DEFAULT_SHEET.columns];
  const rows = Array.isArray(data.rows) && data.rows.length > 0 ? data.rows.map((row) => [...row]) : [...DEFAULT_SHEET.rows.map((row) => [...row])];

  // Ensure every row has the same column length
  return {
    columns,
    rows: rows.map((row) => {
      const nextRow = [...row];
      while (nextRow.length < columns.length) {
        nextRow.push("");
      }
      return nextRow.slice(0, columns.length);
    }),
  };
}

type Status = "idle" | "saving" | "saved" | "error";

export function SheetEditor({ documentId, initialData }: { documentId: string; initialData: SheetData | null }) {
  const [data, setData] = useState<SheetData>(() => normalizeSheet(initialData));
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const persistSheet = useCallback(
    async (payload: SheetData) => {
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
          throw new Error(message?.error ?? "Failed to save sheet");
        }

        setStatus("saved");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to save sheet");
      }
    },
    [documentId],
  );

  const saveSheet = useDebouncedCallback((payload: SheetData) => {
    void persistSheet(payload);
  }, 800);

  const queueSave = (next: SheetData) => {
    saveSheet(next);
  };

  const updateData = (updater: (prev: SheetData) => SheetData) => {
    setData((prev) => {
      const next = normalizeSheet(updater(prev));
      queueSave(next);
      return next;
    });
  };

  const handleColumnChange = (index: number, value: string) => {
    updateData((prev) => {
      const columns = [...prev.columns];
      columns[index] = value;
      return { ...prev, columns };
    });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    updateData((prev) => {
      const rows = prev.rows.map((row, r) => {
        if (r !== rowIndex) {
          return row;
        }
        const nextRow = [...row];
        nextRow[colIndex] = value;
        return nextRow;
      });
      return { ...prev, rows };
    });
  };

  const handleAddColumn = () => {
    updateData((prev) => {
      const columns = [...prev.columns, `Column ${prev.columns.length + 1}`];
      const rows = prev.rows.map((row) => [...row, ""]);
      return { columns, rows };
    });
  };

  const handleRemoveColumn = (index: number) => {
    updateData((prev) => {
      const columns = prev.columns.filter((_, i) => i !== index);
      const rows = prev.rows.map((row) => row.filter((_, i) => i !== index));
      return normalizeSheet({ columns, rows });
    });
  };

  const handleAddRow = () => {
    updateData((prev) => {
      const newRow = prev.columns.map(() => "");
      return { ...prev, rows: [...prev.rows, newRow] };
    });
  };

  const handleRemoveRow = (index: number) => {
    updateData((prev) => {
      const rows = prev.rows.filter((_, i) => i !== index);
      return normalizeSheet({ ...prev, rows });
    });
  };

  const handleManualSave = async () => {
    setLoading(true);
    await persistSheet(data);
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
        <CardTitle className="text-xl font-semibold text-slate-900">Sheet editor</CardTitle>
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
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={handleAddColumn} variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            Add column
          </Button>
          <Button type="button" size="sm" onClick={handleAddRow} variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            Add row
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse bg-white text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                {data.columns.map((column, index) => (
                  <th key={index} className="min-w-40 border-b border-slate-200 px-3 py-2 text-left font-semibold">
                    <div className="flex items-center gap-2">
                      <Input
                        value={column}
                        onChange={(event) => handleColumnChange(index, event.target.value)}
                        className="h-8"
                        aria-label={`Column ${index + 1} name`}
                      />
                      {data.columns.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(index)}
                          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          aria-label={`Remove column ${column}`}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50/60">
                  {row.map((value, colIndex) => (
                    <td key={colIndex} className="border-r border-slate-100 px-3 py-2 last:border-r-0">
                      <Input
                        value={value}
                        onChange={(event) => handleCellChange(rowIndex, colIndex, event.target.value)}
                        className="h-8"
                        aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                      />
                    </td>
                  ))}
                  <td className="w-12 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(rowIndex)}
                      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      aria-label={`Remove row ${rowIndex + 1}`}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-slate-500">
        <span>{footerMessage}</span>
        {status === "error" ? <span className="text-rose-500">{error}</span> : null}
      </CardFooter>
    </Card>
  );
}
