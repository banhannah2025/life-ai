import { NextResponse } from "next/server";

import { getLibraryBrowseData } from "@/lib/library/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;
  const topics = url.searchParams.getAll("topic");
  const projects = url.searchParams.getAll("project");
  const authors = url.searchParams.getAll("author");
  const formats = url.searchParams.getAll("format");
  const contentTypes = url.searchParams.getAll("contentType");
  const sources = url.searchParams.getAll("source");
  const sortParam = (url.searchParams.get("sort") ?? undefined) as
    | "recent"
    | "featured"
    | "alpha"
    | "longform"
    | undefined;
  const featuredFlag = url.searchParams.get("featured");
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "", 10);

  const filters = {
    query,
    topics: topics.length ? topics : undefined,
    projects: projects.length ? projects : undefined,
    authors: authors.length ? authors : undefined,
    formats: formats.length ? formats : undefined,
    contentTypes: contentTypes.length ? contentTypes : undefined,
    sources: sources.length ? sources : undefined,
    featured: featuredFlag === "true" ? true : undefined,
    sort: sortParam,
    limit: Number.isFinite(limitParam) ? limitParam : undefined,
  } as const;

  const payload = await getLibraryBrowseData(filters);
  return NextResponse.json(payload);
}
