import Link from "next/link";
import { getAllTitles } from "@/lib/rcw-data";
import SearchBar from "@/components/SearchBar";
import RCWSidebar from "@/components/RCWSidebar";

export default function RCWLandingPage() {
  const titles = getAllTitles();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 flex flex-col gap-6 xl:flex-row">
      {/* main column */}
      <section className="min-w-0 flex-1">
        {/* header / search */}
        <div className="mb-6 border-b pb-4">
          <div className="text-sm font-semibold text-foreground">
            Revised Code of Washington
          </div>

          <div className="mt-3 max-w-xl">
            <SearchBar />
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          Revised Code of Washington
        </h1>

        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          The Revised Code of Washington (RCW) is the collection of all
          permanent laws now in force in Washington State. Browse RCW Titles,
          open Chapters, and read full Section text.
        </p>

        <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
          This is an unofficial reference copy. Content is scraped from the
          Washington State Legislature public RCW website and organized for fast
          lookup and prep. Always verify the current wording before citing.
        </p>

        <div className="mt-8">
          <Link
            href="/library/revised-code-of-washington/rcw"
            className="inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50"
          >
            Browse all RCW Titles →
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Titles</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Jump directly to a Title:
          </p>

          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {titles.map((t) => (
              <li
                key={t.titleNumber}
                className="rounded-lg border p-4 hover:bg-muted/50"
              >
                <Link
                  href={`/library/revised-code-of-washington/rcw/${t.titleNumber}`}
                  className="block"
                >
                  <div className="text-lg font-medium">
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
                to generate <code>public/rcw/title-#.json</code>.
              </li>
            )}
          </ul>
        </section>
      </section>

      {/* right sidebar */}
      <RCWSidebar />
    </main>
  );
}
