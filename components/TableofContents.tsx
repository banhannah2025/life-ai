import { getAllTitles } from "@/lib/rcw-data";

export default function TableOfContents() {
  const titles = getAllTitles();

  return (
    <aside className="hidden lg:block lg:w-64 lg:shrink-0 border-r bg-background/50 p-4 overflow-y-auto sticky top-0 max-h-screen">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Revised Code of Washington
      </div>

      <ul className="space-y-2 text-sm">
        {titles.map((t) => (
          <li key={t.titleNumber}>
            <a
              className="block rounded px-2 py-1 hover:bg-muted"
              href={`/library/revised-code-of-washington/rcw/${t.titleNumber}`}
            >
              <div className="font-medium">
                Title {t.titleNumber}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {t.titleName}
              </div>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-[10px] leading-relaxed text-muted-foreground">
        Unofficial reference copy. Verify with the Washington State Legislature
        before relying on a statute in court.
      </div>
    </aside>
  );
}
