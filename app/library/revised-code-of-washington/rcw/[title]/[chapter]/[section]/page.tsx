import RCWSidebar from "@/components/RCWSidebar";
import SearchBar from "@/components/SearchBar";
import Breadcrumbs from "@/components/Breadcrumbs";
import RCWViewer from "@/components/RCWViewer";
import { getSection } from "@/lib/rcw-data";
import type { Metadata } from "next";

interface Props {
  params: { title: string; chapter: string; section: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = getSection(params.title, params.chapter, params.section);

  if (!data) {
    return {
      title: `RCW ${params.section} — Not found`,
      description: `RCW ${params.section} not found.`,
    };
  }

  const pageTitle = `RCW ${data.sectionNumber} — ${data.caption}`;
  const desc =
    `Full text of RCW ${data.sectionNumber}: ${data.caption}. ` +
    `Unofficial reference. Verify current law before citing.`;

  return {
    title: pageTitle,
    description: desc,
    openGraph: {
      title: pageTitle,
      description: desc,
      type: "article",
    },
  };
}

export default function SectionPage({ params }: Props) {
  const data = getSection(params.title, params.chapter, params.section);

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 flex flex-col gap-6 xl:flex-row">
        <section className="min-w-0 flex-1">
          <div className="rounded border border-destructive/40 bg-destructive/5 p-6 text-destructive">
            Section not found.
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
            {
              label: "RCW",
              href: "/library/revised-code-of-washington",
            },
            {
              label: `Title ${params.title}`,
              href: `/library/revised-code-of-washington/rcw/${params.title}`,
            },
            {
              label: `Chapter ${params.chapter}`,
              href: `/library/revised-code-of-washington/rcw/${params.title}/${params.chapter}`,
            },
            {
              label: `RCW ${data.sectionNumber}`,
            },
          ]}
        />

        <header className="rounded-xl border bg-background/70 p-6 shadow-sm">
          <h1 className="text-3xl font-semibold leading-tight">
            RCW {data.sectionNumber}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{data.caption}</p>
          <div className="mt-4 text-sm text-muted-foreground">
            Unofficial reference copy. Always verify against the current statute on the Washington State Legislature website.
          </div>
        </header>

        <article className="mt-8 rounded-xl border bg-background/70 p-6 shadow-sm">
          <RCWViewer html={data.bodyHtml} />

          {data.history && (
            <div className="mt-8 rounded border border-muted-foreground/20 bg-muted/40 p-4 text-xs text-muted-foreground">
              <div className="font-semibold uppercase tracking-wide text-[10px] text-muted-foreground/80">
                Legislative history
              </div>
              <div className="mt-2" dangerouslySetInnerHTML={{ __html: data.history }} />
            </div>
          )}
        </article>
      </section>

      <RCWSidebar />
    </main>
  );
}
