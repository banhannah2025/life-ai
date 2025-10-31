"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { searchDirectory } from "@/lib/search/client";
import type { RcwSectionSearchResult } from "@/lib/library/datasets";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<RcwSectionSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = q.trim();
    if (!query) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const response = await searchDirectory(query, "rcw", 8);
      setResults(response.rcwSections ?? []);
    } catch (searchError) {
      console.error(searchError);
      setError(searchError instanceof Error ? searchError.message : "Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <form className="relative w-full max-w-xl" onSubmit={handleSubmit}>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search RCW (e.g. 7.105.225 or “protection order”)"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring"
          disabled={isSearching}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {isSearching ? "…" : "⏎"}
        </div>
      </form>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((section) => (
            <li key={section.id}>
              <Link
                href={section.appPath}
                className="block rounded-lg border border-muted-foreground/10 bg-card px-3 py-2 shadow-sm transition hover:border-primary/30 hover:bg-accent/30"
              >
                <div className="text-sm font-medium text-foreground">
                  RCW {section.sectionNumber} – {section.heading}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">{section.summary}</div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
