import { getAllTitles } from "@/lib/rcw-data";

export default function RCWSidebar() {
  const titles = getAllTitles();

  return (
    <aside className="xl:w-72 shrink-0 border-l bg-background/50 p-4 overflow-y-auto sticky top-0 max-h-screen hidden xl:block">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Jump to Title
        </div>

        <ul className="mt-2 space-y-2 text-sm">
          {titles.map((t) => (
            <li key={t.titleNumber}>
              <a
                className="block rounded px-2 py-1 hover:bg-muted"
                href={`/library/revised-code-of-washington/rcw/${t.titleNumber}`}
              >
                <div className="font-medium">
                  Title {t.titleNumber}
                </div>

                <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {t.titleName}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t pt-4 text-[10px] leading-relaxed text-muted-foreground">
        Unofficial reference copy of the Revised Code of Washington.
        Always confirm the current text on the Washington State Legislature
        website before citing in court.
      </div>
    </aside>
  );
}
