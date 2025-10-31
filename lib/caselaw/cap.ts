const CAP_STATIC_ROOT = "https://static.case.law";

type FetchOptions = {
  /**
   * Number of seconds to cache the request in Next.js/Edge runtime.
   */
  revalidate?: number;
};

async function fetchCapJson<T>(path: string, options: FetchOptions = {}): Promise<T | null> {
  const sanitizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${CAP_STATIC_ROOT}/${sanitizedPath}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "force-cache",
      next: options.revalidate ? { revalidate: options.revalidate } : undefined,
    });

    if (!response.ok) {
      console.error(`CAP request failed for ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`CAP request errored for ${url}`, error);
    return null;
  }
}

export type CapReporter = {
  id: number;
  fullName: string;
  shortName: string | null;
  startYear: number | null;
  endYear: number | null;
  slug: string;
  jurisdictions: Array<{ id: number; name: string; nameLong: string }>;
  hollisIds: string[];
};

type CapReporterRaw = {
  id?: number;
  full_name?: string | null;
  short_name?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  slug?: string | null;
  jurisdictions?: Array<{ id?: number; name?: string | null; name_long?: string | null }>;
  harvard_hollis_id?: string[] | null;
};

function toCapReporter(raw: CapReporterRaw): CapReporter | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = typeof raw.id === "number" ? raw.id : null;
  const slug = typeof raw.slug === "string" && raw.slug.trim() ? raw.slug.trim() : null;
  if (!id || !slug) {
    return null;
  }

  const jurisdictions = Array.isArray(raw.jurisdictions)
    ? raw.jurisdictions
        .map((entry) => {
          const jurisdictionId = typeof entry?.id === "number" ? entry.id : null;
          const name = typeof entry?.name === "string" ? entry.name : null;
          const nameLong = typeof entry?.name_long === "string" ? entry?.name_long : null;
          if (!jurisdictionId || !name || !nameLong) {
            return null;
          }
          return { id: jurisdictionId, name, nameLong };
        })
        .filter((entry): entry is { id: number; name: string; nameLong: string } => Boolean(entry))
    : [];

  return {
    id,
    slug,
    fullName: typeof raw.full_name === "string" ? raw.full_name : slug,
    shortName: typeof raw.short_name === "string" ? raw.short_name : null,
    startYear: typeof raw.start_year === "number" ? raw.start_year : null,
    endYear: typeof raw.end_year === "number" ? raw.end_year : null,
    jurisdictions,
    hollisIds: Array.isArray(raw.harvard_hollis_id)
      ? raw.harvard_hollis_id.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [],
  };
}

export async function getCapReporters(): Promise<CapReporter[]> {
  const data = await fetchCapJson<CapReporterRaw[]>("ReportersMetadata.json", { revalidate: 60 * 60 * 12 });
  if (!data) {
    return [];
  }
  return data
    .map(toCapReporter)
    .filter((reporter): reporter is CapReporter => Boolean(reporter))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export type CapJurisdiction = {
  id: number;
  slug: string;
  name: string;
  nameLong: string;
  caseCount: number;
  volumeCount: number;
  reporterCount: number;
  pageCount: number;
  reporters: CapReporter[];
};

type CapJurisdictionRaw = {
  id?: number;
  slug?: string;
  name?: string;
  name_long?: string;
  case_count?: number;
  volume_count?: number;
  reporter_count?: number;
  page_count?: number;
  reporters?: CapReporterRaw[];
};

function toCapJurisdiction(raw: CapJurisdictionRaw): CapJurisdiction | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = typeof raw.id === "number" ? raw.id : null;
  const slug = typeof raw.slug === "string" && raw.slug.trim() ? raw.slug.trim() : null;
  const name = typeof raw.name === "string" ? raw.name : null;
  const nameLong = typeof raw.name_long === "string" ? raw.name_long : null;
  if (!id || !slug || !name || !nameLong) {
    return null;
  }

  const reporters = Array.isArray(raw.reporters)
    ? raw.reporters
        .map(toCapReporter)
        .filter((reporter): reporter is CapReporter => Boolean(reporter))
    : [];

  const normalizeCount = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;

  return {
    id,
    slug,
    name,
    nameLong,
    caseCount: normalizeCount(raw.case_count),
    volumeCount: normalizeCount(raw.volume_count),
    reporterCount: normalizeCount(raw.reporter_count),
    pageCount: normalizeCount(raw.page_count),
    reporters,
  };
}

export async function getCapJurisdictions(): Promise<CapJurisdiction[]> {
  const data = await fetchCapJson<CapJurisdictionRaw[]>("JurisdictionsMetadata.json", { revalidate: 60 * 60 * 12 });
  if (!data) {
    return [];
  }
  return data
    .map(toCapJurisdiction)
    .filter((jurisdiction): jurisdiction is CapJurisdiction => Boolean(jurisdiction))
    .sort((a, b) => a.nameLong.localeCompare(b.nameLong));
}

export type CapVolume = {
  id: string;
  reporterSlug: string;
  volumeNumber: string;
  publicationYear: number | null;
  title: string | null;
  publisher: string | null;
  jurisdictions: Array<{ id: number; name: string; nameLong: string }>;
  folder: string;
  hollisId: string | null;
  redacted: boolean;
};

type CapVolumeRaw = {
  id?: string | null;
  reporter_slug?: string | null;
  volume_number?: string | number | null;
  publication_year?: number | null;
  title?: string | null;
  publisher?: string | null;
  jurisdictions?: Array<{ id?: number; name?: string | null; name_long?: string | null }>;
  volume_folder?: string | null;
  harvard_hollis_id?: string | null;
  redacted?: boolean | null;
};

function toCapVolume(raw: CapVolumeRaw): CapVolume | null {
  const reporterSlug = typeof raw.reporter_slug === "string" ? raw.reporter_slug.trim() : null;
  const folder = typeof raw.volume_folder === "string" ? raw.volume_folder.trim() : null;
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!reporterSlug || !folder || !id) {
    return null;
  }

  const volumeNumberRaw =
    typeof raw.volume_number === "number"
      ? raw.volume_number.toString()
      : typeof raw.volume_number === "string"
        ? raw.volume_number
        : null;

  const jurisdictions = Array.isArray(raw.jurisdictions)
    ? raw.jurisdictions
        .map((entry) => {
          const jurisdictionId = typeof entry?.id === "number" ? entry.id : null;
          const name = typeof entry?.name === "string" ? entry.name : null;
          const nameLong = typeof entry?.name_long === "string" ? entry.name_long : null;
          if (!jurisdictionId || !name || !nameLong) {
            return null;
          }
          return { id: jurisdictionId, name, nameLong };
        })
        .filter((entry): entry is { id: number; name: string; nameLong: string } => Boolean(entry))
    : [];

  return {
    id,
    reporterSlug,
    volumeNumber: volumeNumberRaw ?? folder,
    publicationYear: typeof raw.publication_year === "number" ? raw.publication_year : null,
    title: typeof raw.title === "string" ? raw.title : null,
    publisher: typeof raw.publisher === "string" ? raw.publisher : null,
    jurisdictions,
    folder,
    hollisId: typeof raw.harvard_hollis_id === "string" ? raw.harvard_hollis_id : null,
    redacted: Boolean(raw.redacted),
  };
}

export async function getCapVolumesForReporter(reporterSlug: string): Promise<CapVolume[]> {
  if (!reporterSlug.trim()) {
    return [];
  }

  const safeSlug = reporterSlug.trim();
  const data = await fetchCapJson<CapVolumeRaw[]>(`${safeSlug}/VolumesMetadata.json`, { revalidate: 60 * 60 * 24 });
  if (!data) {
    return [];
  }

  return data
    .map(toCapVolume)
    .filter((volume): volume is CapVolume => Boolean(volume))
    .sort((a, b) => a.volumeNumber.localeCompare(b.volumeNumber, undefined, { numeric: true }));
}

export type CapCaseMetadata = {
  id: number;
  name: string;
  nameAbbreviation: string | null;
  decisionDate: string | null;
  docketNumber: string | null;
  firstPage: string | null;
  lastPage: string | null;
  citation: string | null;
  courtName: string | null;
  jurisdictionName: string | null;
  reporterSlug: string;
  volumeFolder: string;
  casePath: string | null;
  analysis?: {
    charCount?: number;
    wordCount?: number;
    sha256?: string;
  };
  provenance?: {
    source?: string;
    batch?: string;
    dateAdded?: string;
  };
  fileName: string | null;
};

type CapCaseMetadataRaw = {
  id?: number;
  name?: string | null;
  name_abbreviation?: string | null;
  decision_date?: string | null;
  docket_number?: string | null;
  first_page?: string | null;
  last_page?: string | null;
  citations?: Array<{ type?: string | null; cite?: string | null }>;
  court?: { name?: string | null } | null;
  jurisdiction?: { name_long?: string | null; name?: string | null } | null;
  analysis?: {
    char_count?: number | null;
    word_count?: number | null;
    sha256?: string | null;
  } | null;
  provenance?: {
    source?: string | null;
    batch?: string | null;
    date_added?: string | null;
  } | null;
  file_name?: string | null;
};

function toCapCaseMetadata(
  raw: CapCaseMetadataRaw,
  reporterSlug: string,
  volumeFolder: string
): CapCaseMetadata | null {
  const id = typeof raw.id === "number" ? raw.id : null;
  if (!id) {
    return null;
  }

  const officialCitation = Array.isArray(raw.citations)
    ? raw.citations.find((entry) => entry?.type === "official")?.cite ??
      raw.citations.find((entry) => entry?.cite)?.cite ??
      null
    : null;

  return {
    id,
    name: typeof raw.name === "string" ? raw.name : `Case ${id}`,
    nameAbbreviation: typeof raw.name_abbreviation === "string" ? raw.name_abbreviation : null,
    decisionDate: typeof raw.decision_date === "string" ? raw.decision_date : null,
    docketNumber: typeof raw.docket_number === "string" ? raw.docket_number : null,
    firstPage: typeof raw.first_page === "string" ? raw.first_page : null,
    lastPage: typeof raw.last_page === "string" ? raw.last_page : null,
    citation: officialCitation,
    courtName: typeof raw.court?.name === "string" ? raw.court.name : null,
    jurisdictionName:
      typeof raw.jurisdiction?.name_long === "string"
        ? raw.jurisdiction.name_long
        : typeof raw.jurisdiction?.name === "string"
          ? raw.jurisdiction.name
          : null,
    reporterSlug,
    volumeFolder,
    casePath:
      typeof raw.file_name === "string" && raw.file_name.trim()
        ? `/${reporterSlug}/${volumeFolder}/${raw.file_name.trim()}`
        : null,
    analysis: raw.analysis
      ? {
          charCount:
            typeof raw.analysis.char_count === "number" && Number.isFinite(raw.analysis.char_count)
              ? raw.analysis.char_count
              : undefined,
          wordCount:
            typeof raw.analysis.word_count === "number" && Number.isFinite(raw.analysis.word_count)
              ? raw.analysis.word_count
              : undefined,
          sha256: typeof raw.analysis.sha256 === "string" ? raw.analysis.sha256 : undefined,
        }
      : undefined,
    provenance: raw.provenance
      ? {
          source: typeof raw.provenance.source === "string" ? raw.provenance.source : undefined,
          batch: typeof raw.provenance.batch === "string" ? raw.provenance.batch : undefined,
          dateAdded: typeof raw.provenance.date_added === "string" ? raw.provenance.date_added : undefined,
        }
      : undefined,
    fileName: typeof raw.file_name === "string" ? raw.file_name : null,
  };
}

export async function getCapCasesForVolume(reporterSlug: string, volumeFolder: string): Promise<CapCaseMetadata[]> {
  if (!reporterSlug.trim() || !volumeFolder.trim()) {
    return [];
  }

  const safeSlug = reporterSlug.trim();
  const safeVolume = volumeFolder.trim();
  const data = await fetchCapJson<CapCaseMetadataRaw[]>(`${safeSlug}/${safeVolume}/CasesMetadata.json`, {
    revalidate: 60 * 60 * 24,
  });

  if (!data) {
    return [];
  }

  return data
    .map((entry) => toCapCaseMetadata(entry, safeSlug, safeVolume))
    .filter((caseMeta): caseMeta is CapCaseMetadata => Boolean(caseMeta))
    .sort((a, b) => {
      const pageA = a.firstPage ?? "";
      const pageB = b.firstPage ?? "";
      return pageA.localeCompare(pageB, undefined, { numeric: true });
    });
}

export function buildCapVolumeAssetUrl(
  reporterSlug: string,
  volumeFolder: string,
  assetType: "zip" | "pdf" | "tar" | "tar.csv" | "tar.sha256"
): string {
  const sanitizedSlug = reporterSlug.trim();
  const sanitizedFolder = volumeFolder.trim();
  return `${CAP_STATIC_ROOT}/${sanitizedSlug}/${sanitizedFolder}.${assetType}`;
}

export function buildCapCaseJsonUrl(reporterSlug: string, volumeFolder: string, fileName: string): string {
  const sanitizedSlug = reporterSlug.trim();
  const sanitizedFolder = volumeFolder.trim();
  const safeFileName = fileName.replace(/\.json$/i, "");
  return `${CAP_STATIC_ROOT}/${sanitizedSlug}/${sanitizedFolder}/cases/${safeFileName}.json`;
}

export function buildCapCaseHtmlUrl(reporterSlug: string, volumeFolder: string, fileName: string): string {
  const sanitizedSlug = reporterSlug.trim();
  const sanitizedFolder = volumeFolder.trim();
  const safeFileName = fileName.replace(/\.html$/i, "");
  return `${CAP_STATIC_ROOT}/${sanitizedSlug}/${sanitizedFolder}/html/${safeFileName}.html`;
}

export function buildCourtListenerUrl(casePath: string | null): string | null {
  if (!casePath) {
    return null;
  }
  const trimmed = casePath.trim().replace(/^\/+/, "");
  return `https://www.courtlistener.com/${trimmed}`;
}

export function buildCapApiCaseUrl(caseId: number): string {
  return `https://api.case.law/v1/cases/${caseId}/`;
}
