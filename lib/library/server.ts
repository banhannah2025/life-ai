import type { DocumentData } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { extractSearchTokens } from "@/lib/search/keywords";

import { LIBRARY_CATALOG } from "./resources";
import type {
  LibraryAttachment,
  LibraryBrowseResponse,
  LibraryCollectionHighlight,
  LibraryFacet,
  LibraryFacets,
  LibraryFilters,
  LibraryResource,
} from "./types";

const FIRESTORE_COLLECTION = "libraryEntries";
const MAX_DB_RESULTS = 200;

export async function getLibraryBrowseData(filters: LibraryFilters = {}): Promise<LibraryBrowseResponse> {
  const [databaseResources] = await Promise.all([fetchDatabaseResources()]);
  const merged = mergeResources([...LIBRARY_CATALOG, ...databaseResources]);

  const filtered = applyFilters(merged, filters);
  const sorted = sortResources(filtered, filters.sort);
  const limit = filters.limit ? Math.min(filters.limit, 100) : 60;
  const entries = sorted.slice(0, limit);

  const stats = buildStats(merged, filtered);
  const facets = buildFacets(merged);
  const spotlights = selectSpotlights(merged);
  const collections = buildCollections(merged);

  return {
    entries,
    facets,
    stats,
    spotlights,
    collections,
  };
}

async function fetchDatabaseResources(): Promise<LibraryResource[]> {
  try {
    const firestore = getAdminFirestore();
    const snapshot = await firestore.collection(FIRESTORE_COLLECTION).limit(MAX_DB_RESULTS).get();
    return snapshot.docs.map((doc) => normalizeFirestoreDoc(doc.id, doc.data()));
  } catch (error) {
    console.error("Unable to load library entries from Firestore", error);
    return [];
  }
}

function normalizeFirestoreDoc(id: string, data: DocumentData): LibraryResource {
  const normalizeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((entry) => (typeof entry === "string" ? entry : "")).filter(Boolean) : [];

  const normalizeAuthors = (value: unknown): LibraryResource["authors"] => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((entry) => {
        if (typeof entry === "string" && entry.trim()) {
          return { name: entry.trim() };
        }
        if (entry && typeof entry === "object") {
          const record = entry as Record<string, unknown>;
          const name = typeof record.name === "string" ? record.name : undefined;
          if (!name) {
            return null;
          }
          return {
            name,
            role: typeof record.role === "string" ? record.role : undefined,
            organization: typeof record.organization === "string" ? record.organization : undefined,
            avatarUrl: typeof record.avatarUrl === "string" ? record.avatarUrl : undefined,
          };
        }
        return null;
      })
      .filter((author): author is NonNullable<LibraryResource["authors"][number]> => Boolean(author));
  };

  const tags = normalizeStringArray(data.tags);
  const topics = normalizeStringArray(data.topics);
  const projects = normalizeStringArray(data.projects);
  const authors = normalizeAuthors(data.authors);

  return {
    id,
    title: typeof data.title === "string" ? data.title : "Untitled resource",
    summary: typeof data.summary === "string" ? data.summary : "Summary pending",
    description: typeof data.description === "string" ? data.description : undefined,
    url: typeof data.url === "string" ? data.url : "#",
    source: typeof data.source === "string" ? data.source : "Library Entry",
    sourceType: inferSourceType(data.sourceType),
    contentType: inferContentType(data.contentType),
    format: inferFormat(data.format),
    tags,
    topics,
    projects,
    authors: authors.length ? authors : [{ name: data.source ?? "Contributor" }],
    body: typeof data.body === "string" ? data.body : undefined,
    heroImage: typeof data.heroImage === "string" ? data.heroImage : undefined,
    publishedAt: typeof data.publishedAt === "string" ? data.publishedAt : undefined,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
    featured: Boolean(data.featured),
    interactive: Boolean(data.interactive),
    stage: inferStage(data.stage),
    stats: normalizeStats(data.stats),
    dataSources: normalizeStringArray(data.dataSources),
    attachments: normalizeAttachments(data.attachments),
  };
}

function inferSourceType(input: unknown): LibraryResource["sourceType"] {
  if (input === "external" || input === "database" || input === "internal") {
    return input;
  }
  return "database";
}

function inferContentType(input: unknown): LibraryResource["contentType"] {
  const allowed: LibraryResource["contentType"][] = ["article", "guide", "ebook", "toolkit", "video", "brief", "dataset"];
  if (typeof input === "string" && allowed.includes(input as LibraryResource["contentType"])) {
    return input as LibraryResource["contentType"];
  }
  return "article";
}

function inferFormat(input: unknown): LibraryResource["format"] {
  const allowed: LibraryResource["format"][] = ["web", "pdf", "notion", "video", "audio", "dataset"];
  if (typeof input === "string" && allowed.includes(input as LibraryResource["format"])) {
    return input as LibraryResource["format"];
  }
  return "web";
}

function inferStage(input: unknown): LibraryResource["stage"] {
  const allowed: LibraryResource["stage"][] = ["published", "draft", "beta", "archived"];
  if (typeof input === "string" && allowed.includes(input as LibraryResource["stage"])) {
    return input as LibraryResource["stage"];
  }
  return undefined;
}

function normalizeStats(value: unknown): LibraryResource["stats"] | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const stats = {
    pages: typeof record.pages === "number" ? record.pages : undefined,
    durationMinutes: typeof record.durationMinutes === "number" ? record.durationMinutes : undefined,
    downloads: typeof record.downloads === "number" ? record.downloads : undefined,
    level:
      typeof record.level === "string" && ["intro", "intermediate", "advanced"].includes(record.level)
        ? (record.level as NonNullable<LibraryResource["stats"]>["level"])
        : undefined,
  };
  return Object.values(stats).some((value) => value !== undefined) ? stats : undefined;
}

function normalizeAttachments(value: unknown): NonNullable<LibraryResource["attachments"]> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const attachments = value
    .map((entry) => {
      if (typeof entry === "object" && entry !== null) {
        const record = entry as Record<string, unknown>;
        const label = typeof record.label === "string" ? record.label : undefined;
        const url = typeof record.url === "string" ? record.url : undefined;
        if (label && url) {
          const normalized: LibraryAttachment = {
            label,
            url,
          };
          if (typeof record.format === "string") {
            normalized.format = record.format;
          }
          return normalized;
        }
      }
      return null;
    })
    .filter((item): item is LibraryAttachment => Boolean(item));

  return attachments.length ? attachments : undefined;
}

function mergeResources(resources: LibraryResource[]): LibraryResource[] {
  const map = new Map<string, LibraryResource>();
  for (const resource of resources) {
    map.set(resource.id, resource);
  }
  return Array.from(map.values());
}

function applyFilters(resources: LibraryResource[], filters: LibraryFilters): LibraryResource[] {
  const tokens = filters.query
    ? extractSearchTokens(filters.query)
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length >= 2)
    : [];

  return resources.filter((resource) => {
    if (filters.featured && !resource.featured) {
      return false;
    }
    if (filters.topics?.length && !resource.topics.some((topic) => filters.topics!.includes(topic))) {
      return false;
    }
    if (filters.projects?.length && !resource.projects.some((project) => filters.projects!.includes(project))) {
      return false;
    }
    if (filters.authors?.length) {
      const names = resource.authors.map((author) => author.name);
      if (!names.some((name) => filters.authors!.includes(name))) {
        return false;
      }
    }
    if (filters.formats?.length && !filters.formats.includes(resource.format)) {
      return false;
    }
    if (filters.contentTypes?.length && !filters.contentTypes.includes(resource.contentType)) {
      return false;
    }
    if (filters.sources?.length && !filters.sources.includes(resource.source)) {
      return false;
    }

    if (tokens.length) {
      const haystack = [
        resource.title,
        resource.summary,
        resource.description ?? "",
        resource.body ?? "",
        resource.tags.join(" "),
        resource.topics.join(" "),
        resource.projects.join(" "),
        resource.authors.map((author) => author.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesAll = tokens.every((token) => haystack.includes(token));
      if (!matchesAll) {
        return false;
      }
    }

    return true;
  });
}

function sortResources(resources: LibraryResource[], sort: LibraryFilters["sort"]): LibraryResource[] {
  const sorted = [...resources];
  switch (sort) {
    case "featured":
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || compareRecency(a, b));
    case "alpha":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "longform":
      return sorted.sort((a, b) => (b.stats?.pages ?? 0) - (a.stats?.pages ?? 0));
    case "recent":
    default:
      return sorted.sort(compareRecency);
  }
}

function compareRecency(a: LibraryResource, b: LibraryResource): number {
  const dateA = getDateValue(a);
  const dateB = getDateValue(b);
  if (dateA === dateB) {
    return a.title.localeCompare(b.title);
  }
  return dateB - dateA;
}

function getDateValue(resource: LibraryResource): number {
  const dateString = resource.updatedAt ?? resource.publishedAt;
  const timestamp = dateString ? Date.parse(dateString) : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildStats(allResources: LibraryResource[], filteredResources: LibraryResource[]) {
  return {
    total: allResources.length,
    filtered: filteredResources.length,
    featured: allResources.filter((resource) => resource.featured).length,
    projects: new Set(allResources.flatMap((resource) => resource.projects)).size,
    authors: new Set(allResources.flatMap((resource) => resource.authors.map((author) => author.name))).size,
    sources: new Set(allResources.map((resource) => resource.source)).size,
  };
}

function buildFacets(resources: LibraryResource[]): LibraryFacets {
  return {
    topics: buildFacet(resources.flatMap((resource) => resource.topics)),
    projects: buildFacet(resources.flatMap((resource) => resource.projects)),
    authors: buildFacet(resources.flatMap((resource) => resource.authors.map((author) => author.name))),
    contentTypes: buildFacet(resources.map((resource) => resource.contentType)),
    formats: buildFacet(resources.map((resource) => resource.format)),
    sources: buildFacet(resources.map((resource) => resource.source)),
  };
}

function buildFacet(values: string[]): LibraryFacet[] {
  const tally = new Map<string, number>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    tally.set(value, (tally.get(value) ?? 0) + 1);
  }
  return Array.from(tally.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function selectSpotlights(resources: LibraryResource[]): LibraryResource[] {
  const featured = resources.filter((resource) => resource.featured);
  if (featured.length >= 3) {
    return featured.sort(compareRecency).slice(0, 4);
  }
  return resources.sort(compareRecency).slice(0, 4);
}

function buildCollections(resources: LibraryResource[]): LibraryCollectionHighlight[] {
  const map = new Map<string, { count: number; lead: LibraryResource }>();
  for (const resource of resources) {
    if (!resource.projects.length) {
      continue;
    }
    for (const project of resource.projects) {
      const existing = map.get(project);
      if (!existing) {
        map.set(project, { count: 1, lead: resource });
      } else {
        existing.count += 1;
        if (getDateValue(resource) > getDateValue(existing.lead)) {
          existing.lead = resource;
        }
      }
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([project, data]) => ({
      project,
      count: data.count,
      headline: data.lead.summary,
      lead: data.lead,
    }));
}
