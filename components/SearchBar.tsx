"use client";

import { useState } from "react";

export default function SearchBar() {
  const [q, setQ] = useState("");

  return (
    <form
      className="relative w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: later we'll navigate to a search page
      }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search RCW (e.g. 7.105.225 or “protection order”)"
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
        ⏎
      </div>
    </form>
  );
}
