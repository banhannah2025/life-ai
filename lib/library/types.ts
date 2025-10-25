export type LibraryAuthor = {
  id?: string;
  name: string;
  role?: string;
  organization?: string;
  avatarUrl?: string;
};

export type LibraryAttachment = {
  label: string;
  url: string;
  format?: string;
};

export type LibraryResource = {
  id: string;
  title: string;
  summary: string;
  description?: string;
  url: string;
  source: string;
  sourceType: "internal" | "external" | "database";
  contentType: "article" | "guide" | "ebook" | "toolkit" | "video" | "brief" | "dataset";
  format: "web" | "pdf" | "notion" | "video" | "audio" | "dataset";
  tags: string[];
  topics: string[];
  projects: string[];
  authors: LibraryAuthor[];
  body?: string;
  heroImage?: string;
  publishedAt?: string;
  updatedAt?: string;
  featured?: boolean;
  interactive?: boolean;
  stage?: "published" | "draft" | "beta" | "archived";
  stats?: {
    pages?: number;
    durationMinutes?: number;
    downloads?: number;
    level?: "intro" | "intermediate" | "advanced";
  };
  dataSources?: string[];
  attachments?: LibraryAttachment[];
};

export type LibraryFacet = {
  value: string;
  label: string;
  count: number;
};

export type LibraryFacets = {
  topics: LibraryFacet[];
  projects: LibraryFacet[];
  authors: LibraryFacet[];
  contentTypes: LibraryFacet[];
  formats: LibraryFacet[];
  sources: LibraryFacet[];
};

export type LibraryFilters = {
  query?: string;
  topics?: string[];
  projects?: string[];
  authors?: string[];
  formats?: string[];
  contentTypes?: string[];
  sources?: string[];
  featured?: boolean;
  sort?: "recent" | "featured" | "alpha" | "longform";
  limit?: number;
};

export type LibraryCollectionHighlight = {
  project: string;
  count: number;
  headline: string;
  lead: LibraryResource;
};

export type LibraryBrowseResponse = {
  entries: LibraryResource[];
  facets: LibraryFacets;
  stats: {
    total: number;
    filtered: number;
    featured: number;
    projects: number;
    authors: number;
    sources: number;
  };
  spotlights: LibraryResource[];
  collections: LibraryCollectionHighlight[];
};
