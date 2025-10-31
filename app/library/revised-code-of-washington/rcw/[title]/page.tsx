import Link from "next/link";

import Breadcrumbs from "@/components/Breadcrumbs";
import RCWSidebar from "@/components/RCWSidebar";
import SearchBar from "@/components/SearchBar";
import { getTitle } from "@/lib/rcw-data";
import type { Metadata } from "next";

interface Props {
  params: { title: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = getTitle(params.title);
  const pageTitle = `RCW Title ${data.titleNumber} — ${data.titleName}`;
  const desc = `Chapters in RCW Title ${data.titleNumber} (${data.titleName}).`;
  return {
    title: pageTitle,
    description: desc,
  };
}

export default function TitlePage({ params }: Props) {
  const data = getTitle(params.title);

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

        <Breadcrumbs
          crumbs={[
            { label: "RCW", href: "/library/revised-code-of-washington" },
            { label: `Title ${data.titleNumber}` },
          ]}
        />

        <header className="rounded-xl border bg-background/70 p-6 shadow-sm">
          <h1 className="text-3xl font-semibold leading-tight">
            Title {data.titleNumber} RCW
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {data.titleName}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <Link
              href="/library/revised-code-of-washington/rcw"
              className="rounded border px-3 py-1 hover:bg-muted"
            >
              ← All titles
            </Link>
            <a
              href={`https://app.leg.wa.gov/RCW/default.aspx?cite=${encodeURIComponent(
                data.titleNumber
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded border px-3 py-1 hover:bg-muted"
            >
              View on Legislature site
            </a>
          </div>
        </header>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Chapters in this title</h2>
          <p className="text-sm text-muted-foreground">
            Open a chapter to browse all RCW sections and read the full law text.
          </p>

          <ul className="mt-4 space-y-4">
            {data.chapters.map((ch) => (
              <li
                key={ch.chapterNumber}
                className="rounded-lg border bg-background/60 p-4 hover:bg-muted/60 transition"
              >
                <Link
                  className="block"
                  href={`/library/revised-code-of-washington/rcw/${data.titleNumber}/${ch.chapterNumber}`}
                >
                  <div className="text-lg font-semibold">
                    Chapter {ch.chapterNumber} RCW
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ch.chapterTitle}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <RCWSidebar />
    </main>
  );
}
