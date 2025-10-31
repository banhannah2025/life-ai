import Link from "next/link";

import Breadcrumbs from "@/components/Breadcrumbs";
import RCWSidebar from "@/components/RCWSidebar";
import SearchBar from "@/components/SearchBar";
import { getChapter } from "@/lib/rcw-data";
import type { Metadata } from "next";

interface Props {
  params: { title: string; chapter: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const chapter = getChapter(params.title, params.chapter);
  if (!chapter) {
    return { title: `RCW Chapter ${params.chapter} — Not found` };
  }

  const pageTitle = `RCW Chapter ${chapter.chapterNumber} — ${chapter.chapterTitle}`;
  const desc = `Sections in RCW Chapter ${chapter.chapterNumber} (${chapter.chapterTitle}).`;

  return {
    title: pageTitle,
    description: desc,
  };
}

export default function ChapterPage({ params }: Props) {
  const chapter = getChapter(params.title, params.chapter);

  if (!chapter) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 flex flex-col gap-6 xl:flex-row">
        <section className="min-w-0 flex-1">
          <div className="rounded border border-destructive/40 bg-destructive/5 p-6 text-destructive">
            Chapter not found.
          </div>
        </section>
        <RCWSidebar />
      </main>
    );
  }

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
            {
              label: `Title ${params.title}`,
              href: `/library/revised-code-of-washington/rcw/${params.title}`,
            },
            { label: `Chapter ${chapter.chapterNumber}` },
          ]}
        />

        <header className="rounded-xl border bg-background/70 p-6 shadow-sm">
          <h1 className="text-3xl font-semibold leading-tight">
            Chapter {chapter.chapterNumber} RCW
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {chapter.chapterTitle}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <Link
              href={`/library/revised-code-of-washington/rcw/${params.title}`}
              className="rounded border px-3 py-1 hover:bg-muted"
            >
              ← Title {params.title}
            </Link>
            <a
              href={`https://app.leg.wa.gov/RCW/default.aspx?cite=${encodeURIComponent(
                chapter.chapterNumber
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
          <h2 className="text-xl font-semibold">Sections in this chapter</h2>
          <p className="text-sm text-muted-foreground">
            Select a section to read the full law text, history, and cross references.
          </p>

          <ul className="mt-4 space-y-3">
            {chapter.sections.map((sec) => (
              <li key={sec.sectionNumber} className="rounded border bg-background/60 p-4 hover:bg-muted/60 transition">
                <Link
                  href={`/library/revised-code-of-washington/rcw/${params.title}/${chapter.chapterNumber}/${sec.sectionNumber}`}
                  className="block"
                >
                  <div className="font-semibold">
                    RCW {sec.sectionNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sec.caption}
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
