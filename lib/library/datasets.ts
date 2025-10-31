import fs from "node:fs";
import path from "node:path";

import { extractSearchTokens } from "@/lib/search/keywords";

type RcwSectionIndexEntry = {
  id: string;
  titleNumber: string;
  titleName: string;
  chapterNumber: string;
  chapterTitle: string;
  sectionNumber: string;
  caption: string;
  bodyText: string;
  summary: string;
  searchText: string;
  officialUrl: string;
  appPath: string;
};

type UsCodeDownloadIndexEntry = {
  id: string;
  titleSlug: string;
  titleLabel: string;
  titleNumber: string | null;
  description: string;
  releaseLabel: string;
  remoteUrl: string;
  localPath: string | null;
  fileSize: number | null;
  searchText: string;
};

type WashingtonOpinionIndexEntry = {
  id: string;
  docketNumber: string;
  docketNumberNormalized: string;
  caseTitle: string;
  courtLabel: string;
  division: string | null;
  fileDate: string | null;
  fileContains: string;
  detailUrl: string | null;
  pdfUrl: string | null;
  pdfPath: string | null;
  summary: string;
  searchText: string;
};

export type RcwSectionSearchResult = {
  id: string;
  titleNumber: string;
  titleName: string;
  chapterNumber: string;
  chapterTitle: string;
  sectionNumber: string;
  heading: string;
  summary: string;
  appPath: string;
  officialUrl: string;
};

export type UsCodeDownloadSearchResult = {
  id: string;
  titleSlug: string;
  titleLabel: string;
  titleNumber: string | null;
  description: string;
  releaseLabel: string;
  remoteUrl: string;
  localPath: string | null;
  fileSize: number | null;
};

export type WashingtonCourtOpinionSearchResult = {
  id: string;
  docketNumber: string;
  docketNumberNormalized: string;
  caseTitle: string;
  courtLabel: string;
  division: string | null;
  fileDate: string | null;
  fileContains: string;
  detailUrl: string | null;
  pdfUrl: string | null;
  pdfPath: string | null;
  summary: string;
};

export type LibraryDatasetSearchResults = {
  rcwSections: RcwSectionSearchResult[];
  uscodeTitles: UsCodeDownloadSearchResult[];
  waOpinions: WashingtonCourtOpinionSearchResult[];
};

const RCW_ROOT = path.join(process.cwd(), "public", "rcw");
const USCODE_ROOT = path.join(process.cwd(), "data", "uscode");
const WA_COURTS_ROOT = path.join(process.cwd(), "data", "wa-courts");

let rcwSectionIndexCache: RcwSectionIndexEntry[] | null = null;
let usCodeIndexCache: UsCodeDownloadIndexEntry[] | null = null;
let waOpinionIndexCache: WashingtonOpinionIndexEntry[] | null = null;

function stripHtml(input: string | null | undefined): string {
  if (!input) {
    return "";
  }
  return input.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function truncateText(input: string, limit = 220): string {
  if (!input) {
    return "";
  }
  if (input.length <= limit) {
    return input;
  }
  const truncated = input.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeCut = lastSpace > 40 ? lastSpace : limit;
  return `${truncated.slice(0, safeCut).trim()}…`;
}

function ensureRcwSectionIndex(): RcwSectionIndexEntry[] {
  if (rcwSectionIndexCache) {
    return rcwSectionIndexCache;
  }

  const entries: RcwSectionIndexEntry[] = [];
  let files: string[] = [];
  try {
    files = fs.readdirSync(RCW_ROOT);
  } catch {
    rcwSectionIndexCache = [];
    return rcwSectionIndexCache;
  }

  for (const file of files) {
    if (!file.startsWith("title-") || !file.endsWith(".json")) {
      continue;
    }
    const filePath = path.join(RCW_ROOT, file);
    let raw: unknown;
    try {
      const contents = fs.readFileSync(filePath, "utf-8");
      raw = JSON.parse(contents);
    } catch (error) {
      console.error(`[LibrarySearch] Failed to parse RCW file ${filePath}`, error);
      continue;
    }
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const record = raw as {
      titleNumber?: string;
      titleName?: string;
      chapters?: Array<{
        chapterNumber?: string;
        chapterTitle?: string;
        sections?: Array<{
          sectionNumber?: string;
          caption?: string;
          bodyHtml?: string;
        }>;
      }>;
    };
    const titleNumber = typeof record.titleNumber === "string" ? record.titleNumber : null;
    const titleName = typeof record.titleName === "string" ? record.titleName : null;
    if (!titleNumber || !titleName || !Array.isArray(record.chapters)) {
      continue;
    }
    for (const chapter of record.chapters) {
      if (!chapter || typeof chapter !== "object") {
        continue;
      }
      const chapterNumber = typeof chapter.chapterNumber === "string" ? chapter.chapterNumber : null;
      const chapterTitle = typeof chapter.chapterTitle === "string" ? chapter.chapterTitle : null;
      if (!chapterNumber || !chapterTitle || !Array.isArray(chapter.sections)) {
        continue;
      }
      for (const section of chapter.sections) {
        if (!section || typeof section !== "object") {
          continue;
        }
        const sectionNumber = typeof section.sectionNumber === "string" ? section.sectionNumber : null;
        const caption = typeof section.caption === "string" ? section.caption : null;
        if (!sectionNumber || !caption) {
          continue;
        }
        const bodyText = stripHtml(section.bodyHtml);
        const summary = truncateText(bodyText || caption, 200);
        const searchText = [titleName, chapterTitle, sectionNumber, caption, bodyText]
          .join(" ")
          .toLowerCase();
        const officialUrl = `https://app.leg.wa.gov/RCW/default.aspx?cite=${encodeURIComponent(sectionNumber)}`;
        const appPath = `/library/revised-code-of-washington/rcw/${encodeURIComponent(
          titleNumber
        )}/${encodeURIComponent(chapterNumber)}/${encodeURIComponent(sectionNumber)}`;
        entries.push({
          id: `${titleNumber}-${chapterNumber}-${sectionNumber}`,
          titleNumber,
          titleName,
          chapterNumber,
          chapterTitle,
          sectionNumber,
          caption,
          bodyText,
          summary,
          searchText,
          officialUrl,
          appPath,
        });
      }
    }
  }

  rcwSectionIndexCache = entries;
  return entries;
}

function slugToTitleLabel(slug: string): { label: string; number: string | null } {
  const match = slug.match(/^usc(\d+)([a-z]*)$/i);
  if (!match) {
    return { label: slug.toUpperCase(), number: null };
  }
  const number = match[1]?.replace(/^0+/, "") || null;
  const suffix = match[2] ?? "";
  const suffixPart = suffix ? ` ${suffix.toUpperCase()}` : "";
  return {
    label: `Title ${number ?? ""}${suffixPart}`.trim(),
    number: number,
  };
}

function ensureUsCodeIndex(): UsCodeDownloadIndexEntry[] {
  if (usCodeIndexCache) {
    return usCodeIndexCache;
  }

  const entries: UsCodeDownloadIndexEntry[] = [];
  let releaseDirs: string[] = [];
  try {
    releaseDirs = fs.readdirSync(USCODE_ROOT);
  } catch {
    usCodeIndexCache = [];
    return usCodeIndexCache;
  }

  for (const releaseDir of releaseDirs) {
    const releasePath = path.join(USCODE_ROOT, releaseDir);
    const metadataPath = path.join(releasePath, "release.json");
    if (!fs.existsSync(metadataPath)) {
      continue;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    } catch (error) {
      console.error(`[LibrarySearch] Failed to parse US Code release ${metadataPath}`, error);
      continue;
    }
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const record = raw as {
      releaseLabel?: string;
      downloads?: Array<{ titleSlug?: string; description?: string; href?: string }>;
      source?: string;
    };
    const releaseLabel = typeof record.releaseLabel === "string" ? record.releaseLabel : releaseDir;
    if (!Array.isArray(record.downloads)) {
      continue;
    }
    for (const download of record.downloads) {
      const titleSlug = typeof download?.titleSlug === "string" ? download.titleSlug : null;
      const description = typeof download?.description === "string" ? download.description : "";
      const href = typeof download?.href === "string" ? download.href : null;
      if (!titleSlug || !href) {
        continue;
      }
      const { label: titleLabel, number: titleNumber } = slugToTitleLabel(titleSlug);
      const remoteUrl = new URL(href, "https://uscode.house.gov/download/").toString();
      const localPath = path.join(releasePath, "zip", `${titleSlug}.zip`);
      const hasLocalFile = fs.existsSync(localPath);
      const fileSize = hasLocalFile ? fs.statSync(localPath).size : null;
      const searchText = [titleLabel, description, releaseLabel, titleSlug].join(" ").toLowerCase();
      entries.push({
        id: `${releaseLabel}-${titleSlug}`,
        titleSlug,
        titleLabel,
        titleNumber,
        description,
        releaseLabel,
        remoteUrl,
        localPath: hasLocalFile ? localPath : null,
        fileSize,
        searchText,
      });
    }
  }

  usCodeIndexCache = entries;
  return entries;
}

function ensureWaOpinionIndex(): WashingtonOpinionIndexEntry[] {
  if (waOpinionIndexCache) {
    return waOpinionIndexCache;
  }

  const entries: WashingtonOpinionIndexEntry[] = [];
  let sectionDirs: string[] = [];
  try {
    sectionDirs = fs.readdirSync(WA_COURTS_ROOT);
  } catch {
    waOpinionIndexCache = [];
    return waOpinionIndexCache;
  }

  for (const sectionDir of sectionDirs) {
    const sectionPath = path.join(WA_COURTS_ROOT, sectionDir);
    const stat = fs.statSync(sectionPath);
    if (!stat.isDirectory()) {
      continue;
    }
    const courtLabel = sectionDir
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    let yearDirs: string[] = [];
    try {
      yearDirs = fs.readdirSync(sectionPath);
    } catch {
      continue;
    }
    for (const yearDir of yearDirs) {
      const yearPath = path.join(sectionPath, yearDir);
      let files: string[] = [];
      try {
        files = fs.readdirSync(yearPath);
      } catch {
        continue;
      }
      for (const file of files) {
        if (!file.endsWith(".json")) {
          continue;
        }
        const filePath = path.join(yearPath, file);
        let raw: unknown;
        try {
          raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        } catch (error) {
          console.error(`[LibrarySearch] Failed to parse WA court opinion ${filePath}`, error);
          continue;
        }
        if (!raw || typeof raw !== "object") {
          continue;
        }
        const record = raw as {
          docketNumber?: string;
          docketNumberNormalized?: string;
          caseTitle?: string;
          fileDate?: string;
          division?: string | null;
          fileContains?: string;
          detailUrl?: string;
          pdfUrl?: string;
          pdfPath?: string;
          isSuperseded?: boolean;
          detail?: Record<string, string>;
        };
        const docketNumber = typeof record.docketNumber === "string" ? record.docketNumber : null;
        const docketNumberNormalized =
          typeof record.docketNumberNormalized === "string" ? record.docketNumberNormalized : docketNumber ?? "";
        const caseTitle = typeof record.caseTitle === "string" ? record.caseTitle : null;
        if (!docketNumber || !caseTitle) {
          continue;
        }
        const detailStrings = record.detail ? Object.values(record.detail) : [];
        const summarySource = [record.fileContains ?? "", ...detailStrings].join(" ").trim();
        const summary = truncateText(summarySource || caseTitle, 220);
        const searchText = [caseTitle, docketNumber, record.fileContains ?? "", summarySource, courtLabel]
          .join(" ")
          .toLowerCase();
        entries.push({
          id: `${docketNumberNormalized}-${sectionDir}`,
          docketNumber,
          docketNumberNormalized,
          caseTitle,
          courtLabel,
          division: typeof record.division === "string" ? record.division : null,
          fileDate: typeof record.fileDate === "string" ? record.fileDate : null,
          fileContains: typeof record.fileContains === "string" ? record.fileContains : "",
          detailUrl: typeof record.detailUrl === "string" ? record.detailUrl : null,
          pdfUrl: typeof record.pdfUrl === "string" ? record.pdfUrl : null,
          pdfPath: typeof record.pdfPath === "string" ? record.pdfPath : null,
          summary,
          searchText,
        });
      }
    }
  }

  waOpinionIndexCache = entries;
  return entries;
}

function computeScore(searchText: string, tokens: string[], exactNeedle: string): number {
  let score = 0;
  for (const token of tokens) {
    if (searchText.includes(token)) {
      score += token.length;
    }
  }
  if (exactNeedle && searchText.includes(exactNeedle)) {
    score += Math.max(4, exactNeedle.length / 4);
  }
  return score;
}

export function searchRcwSections(query: string, limit = 8): RcwSectionSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  const tokens = extractSearchTokens(normalized);
  if (!tokens.length) {
    tokens.push(normalized);
  }
  const index = ensureRcwSectionIndex();
  const ranked = index
    .map((entry) => {
      const score = computeScore(entry.searchText, tokens, normalized);
      const sectionMatch = entry.sectionNumber.toLowerCase() === normalized ? 8 : 0;
      const directMatch = entry.sectionNumber.toLowerCase().includes(normalized) ? 4 : 0;
      const total = score + sectionMatch + directMatch;
      return { entry, score: total };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ entry }) => ({
    id: entry.id,
    titleNumber: entry.titleNumber,
    titleName: entry.titleName,
    chapterNumber: entry.chapterNumber,
    chapterTitle: entry.chapterTitle,
    sectionNumber: entry.sectionNumber,
    heading: entry.caption,
    summary: entry.summary,
    appPath: entry.appPath,
    officialUrl: entry.officialUrl,
  }));
}

export function searchUsCodeDownloads(query: string, limit = 6): UsCodeDownloadSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  const tokens = extractSearchTokens(normalized);
  if (!tokens.length) {
    tokens.push(normalized);
  }
  const index = ensureUsCodeIndex();
  const ranked = index
    .map((entry) => {
      const score = computeScore(entry.searchText, tokens, normalized);
      const titleNumberMatch = entry.titleNumber && normalized === entry.titleNumber ? 6 : 0;
      const slugMatch = entry.titleSlug.toLowerCase() === normalized ? 5 : 0;
      const total = score + titleNumberMatch + slugMatch;
      return { entry, score: total };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ entry }) => ({
    id: entry.id,
    titleSlug: entry.titleSlug,
    titleLabel: entry.titleLabel,
    titleNumber: entry.titleNumber,
    description: entry.description,
    releaseLabel: entry.releaseLabel,
    remoteUrl: entry.remoteUrl,
    localPath: entry.localPath,
    fileSize: entry.fileSize,
  }));
}

export function searchWashingtonOpinions(query: string, limit = 6): WashingtonCourtOpinionSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  const tokens = extractSearchTokens(normalized);
  if (!tokens.length) {
    tokens.push(normalized);
  }
  const index = ensureWaOpinionIndex();
  const ranked = index
    .map((entry) => {
      const score = computeScore(entry.searchText, tokens, normalized);
      const docketMatch =
        entry.docketNumber.toLowerCase() === normalized || entry.docketNumberNormalized.toLowerCase() === normalized
          ? 8
          : 0;
      const total = score + docketMatch;
      return { entry, score: total };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ entry }) => ({
    id: entry.id,
    docketNumber: entry.docketNumber,
    docketNumberNormalized: entry.docketNumberNormalized,
    caseTitle: entry.caseTitle,
    courtLabel: entry.courtLabel,
    division: entry.division,
    fileDate: entry.fileDate,
    fileContains: entry.fileContains,
    detailUrl: entry.detailUrl,
    pdfUrl: entry.pdfUrl,
    pdfPath: entry.pdfPath,
    summary: entry.summary,
  }));
}

export function searchLibraryDatasets(
  query: string,
  options: { rcwLimit?: number; uscodeLimit?: number; waOpinionsLimit?: number } = {}
): LibraryDatasetSearchResults {
  return {
    rcwSections: searchRcwSections(query, options.rcwLimit ?? 6),
    uscodeTitles: searchUsCodeDownloads(query, options.uscodeLimit ?? 5),
    waOpinions: searchWashingtonOpinions(query, options.waOpinionsLimit ?? 6),
  };
}
