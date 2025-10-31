import fs from "node:fs";
import path from "node:path";
import type { RCWTitle, RCWChapter, RCWSection } from "./rcw-types";

function loadTitleFromDisk(titleNumber: string): RCWTitle {
  const filePath = path.join(
    process.cwd(),
    "public",
    "rcw",
    `title-${titleNumber}.json`
  );

  if (!fs.existsSync(filePath)) {
    // This console.error will show in your server logs / terminal.
    console.error(
      `[RCW] Missing file for title ${titleNumber}: ${filePath}`
    );
    throw new Error(`RCW title ${titleNumber} not found on disk`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as RCWTitle;
}

/**
 * Sidebar / title list.
 * We scan public/rcw for title-*.json and build [{titleNumber,titleName}, ...]
 */
export function getAllTitles(): { titleNumber: string; titleName: string }[] {
  const dir = path.join(process.cwd(), "public", "rcw");
  let files: string[] = [];

  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }

  const titles = files
    .map((file) => {
      const m = file.match(/^title-(.+)\.json$/i);
      if (!m) return null;

      const titleNum = m[1];

      try {
        const t = loadTitleFromDisk(titleNum);
        return {
          titleNumber: t.titleNumber,
          titleName: t.titleName,
        };
      } catch {
        return null;
      }
    })
    .filter(
      (x): x is { titleNumber: string; titleName: string } => Boolean(x)
    );

  // Sort titles in natural RCW order:
  // "7", "7B", "9", "9A", "10", "11", ..., "62A", ...
  function parseSortable(num: string) {
    const m = num.match(/^(\d+)([A-Za-z]*)$/);
    if (!m) return { base: Number.POSITIVE_INFINITY, suffix: num };
    return { base: parseInt(m[1], 10), suffix: m[2] || "" };
  }

  titles.sort((a, b) => {
    const pa = parseSortable(a.titleNumber);
    const pb = parseSortable(b.titleNumber);

    if (pa.base !== pb.base) return pa.base - pb.base;
    return pa.suffix.localeCompare(pb.suffix);
  });

  return titles;
}

export function getTitle(titleNumber: string): RCWTitle {
  return loadTitleFromDisk(titleNumber);
}

export function getChapter(
  titleNumber: string,
  chapterNumber: string
): RCWChapter | undefined {
  const title = getTitle(titleNumber);
  return title.chapters.find(
    (ch) => ch.chapterNumber === chapterNumber
  );
}

export function getSection(
  titleNumber: string,
  chapterNumber: string,
  sectionNumber: string
): RCWSection | undefined {
  const chapter = getChapter(titleNumber, chapterNumber);
  return chapter?.sections.find(
    (sec) => sec.sectionNumber === sectionNumber
  );
}
