import Link from "next/link";

import RCWSidebar from "@/components/RCWSidebar";
import SearchBar from "@/components/SearchBar";
import { getAllTitles } from "@/lib/rcw-data";

export default function RCWIndexPage() {
  const titles = getAllTitles();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 flex flex-col gap-6 xl:flex-row">
      <section className="min-w-0 flex-1">
        <div className="mb-6 border-b pb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Revised Code of Washington
          </div>
          <div className="mt-3 max-w-xl">
            <SearchBar />
          </div>
        </div>

        <header className="rounded-xl border bg-background/70 p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">
            Browse RCW Titles
          </h1>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed">
            The Revised Code of Washington (RCW) is organized by Title, Chapter, and Section.
            Select a title to open its chapters and read the full statute text.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            Unofficial reference copy. Always verify on the Washington State Legislature website before citing.
          </div>
        </header>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {titles.map((t) => (
            <li
              key={t.titleNumber}
              className="rounded-lg border bg-background/60 p-4 hover:bg-muted/60 transition"
            >
              <Link
                href={`/library/revised-code-of-washington/rcw/${t.titleNumber}`}
                className="block"
              >
                <div className="text-lg font-semibold">
                  Title {t.titleNumber} RCW
                </div>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {t.titleName}
                </div>
              </Link>
            </li>
          ))}

          {titles.length === 0 && (
            <li className="text-sm text-muted-foreground">
              No RCW data found. Run{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">
                pnpm run scrape:rcw
              </code>{" "}
              first.
            </li>
          )}
        </ul>
      </section>

      <RCWSidebar />
    </main>
  );
}

