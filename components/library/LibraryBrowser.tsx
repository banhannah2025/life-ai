'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import { BookOpen, Filter, LayoutGrid, Rows, Sparkles, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LibraryBrowseResponse, LibraryFacet, LibraryResource } from "@/lib/library/types";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "featured" | "alpha" | "longform";

export function LibraryBrowser() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortOption>("recent");
  const [query, setQuery] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [data, setData] = useState<LibraryBrowseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debouncedQuery] = useDebounce(query, 350);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    }
    selectedTopics.forEach((topic) => params.append("topic", topic));
    selectedProjects.forEach((project) => params.append("project", project));
    selectedAuthors.forEach((author) => params.append("author", author));
    selectedFormats.forEach((format) => params.append("format", format));
    selectedContentTypes.forEach((contentType) => params.append("contentType", contentType));
    params.set("sort", sort);

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(`/api/library?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load library data");
        }
        return response.json() as Promise<LibraryBrowseResponse>;
      })
      .then((payload) => {
        setData(payload);
      })
      .catch((fetchError) => {
        if (fetchError.name === "AbortError") {
          return;
        }
        console.error(fetchError);
        setError(fetchError.message ?? "Unexpected error");
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, selectedTopics, selectedProjects, selectedAuthors, selectedFormats, selectedContentTypes, sort]);

  const hasFilters =
    Boolean(debouncedQuery) ||
    selectedTopics.length > 0 ||
    selectedProjects.length > 0 ||
    selectedAuthors.length > 0 ||
    selectedFormats.length > 0 ||
    selectedContentTypes.length > 0;

  const resetFilters = () => {
    setQuery("");
    setSelectedTopics([]);
    setSelectedProjects([]);
    setSelectedAuthors([]);
    setSelectedFormats([]);
    setSelectedContentTypes([]);
    setSort("recent");
  };

  const topicFacets = useMemo(() => {
    if (!data?.facets.topics) {
      return [];
    }
    return data.facets.topics.slice(0, 14);
  }, [data]);
  const projectFacets = data?.facets.projects ?? [];
  const authorFacets = data?.facets.authors ?? [];
  const formatFacets = data?.facets.formats ?? [];
  const typeFacets = data?.facets.contentTypes ?? [];
  const stats = data?.stats;
  const entries = data?.entries ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-emerald-100/80 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive library
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Browse research, playbooks, and datasets</h2>
            <p className="text-sm text-slate-600">
              Filter by topic, project, author, or format. Everything you find here can be attached to matters or saved for
              later inside the research workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-2 rounded-lg border border-slate-200 p-1">
              <ViewToggleButton
                icon={LayoutGrid}
                label="Grid"
                active={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              />
              <ViewToggleButton
                icon={Rows}
                label="List"
                active={viewMode === "list"}
                onClick={() => setViewMode("list")}
              />
            </div>
            <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
              <SelectTrigger className="w-44 border-slate-200">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Newest first</SelectItem>
                <SelectItem value="featured">Featured picks</SelectItem>
                <SelectItem value="alpha">A → Z</SelectItem>
                <SelectItem value="longform">Longest reads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex-1">
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by keyword, citation, or tool…"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <MultiSelectFilter
                label="Projects"
                facets={projectFacets}
                selected={selectedProjects}
                onToggle={(value) => toggleItem(value, setSelectedProjects)}
              />
              <MultiSelectFilter
                label="Authors"
                facets={authorFacets}
                selected={selectedAuthors}
                onToggle={(value) => toggleItem(value, setSelectedAuthors)}
              />
              <MultiSelectFilter
                label="Format"
                facets={formatFacets}
                selected={selectedFormats}
                onToggle={(value) => toggleItem(value, setSelectedFormats)}
              />
              <MultiSelectFilter
                label="Type"
                facets={typeFacets}
                selected={selectedContentTypes}
                onToggle={(value) => toggleItem(value, setSelectedContentTypes)}
              />
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>

          {topicFacets.length ? (
            <div className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70">
              <div className="flex flex-wrap gap-2 px-3 py-2">
                {topicFacets.map((facet) => {
                  const active = selectedTopics.includes(facet.value);
                  return (
                    <button
                      key={facet.value}
                      type="button"
                      onClick={() => toggleItem(facet.value, setSelectedTopics)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-transparent bg-white text-slate-600 hover:border-slate-200"
                      )}
                    >
                      {facet.label}
                      <span className="text-[10px] text-slate-500">{facet.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {stats ? (
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <SummaryBadge label="Total resources" value={stats.total} />
          <SummaryBadge label="Visible now" value={stats.filtered} />
          <SummaryBadge label="Featured" value={stats.featured} />
          <SummaryBadge label="Projects" value={stats.projects} />
          <SummaryBadge label="Authors" value={stats.authors} />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {data?.spotlights?.length ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-base font-semibold">Spotlight shelves</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.spotlights.map((entry) => (
              <SpotlightCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ) : null}

      {data?.collections?.length ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Tag className="h-4 w-4 text-slate-500" />
            <h3 className="text-base font-semibold">Project shelves</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.collections.map((collection) => (
              <Card key={collection.project} className="border-slate-200 shadow-sm">
                <CardHeader className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-emerald-700">{collection.count} items</div>
                  <h4 className="text-lg font-semibold text-slate-900">{collection.project}</h4>
                  <p className="text-sm text-slate-600">{collection.headline}</p>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline" size="sm">
                    <Link href={collection.lead.url} target={collection.lead.sourceType === "external" ? "_blank" : undefined}>
                      Explore highlight
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">All resources</h3>
          <span className="text-xs uppercase tracking-wide text-slate-500">{entries.length} shown</span>
        </div>
        <Separator />
        {isLoading ? (
          <LoadingGrid viewMode={viewMode} />
        ) : entries.length ? (
          <ResourceResults entries={entries} viewMode={viewMode} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
            No resources match the current filters. Try clearing a filter or switching topics.
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

type ViewToggleButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
};

function ViewToggleButton({ icon: Icon, label, active, onClick }: ViewToggleButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn("gap-2", active ? "bg-emerald-600 text-white" : "text-slate-600")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}

type MultiSelectFilterProps = {
  label: string;
  facets: LibraryFacet[];
  selected: string[];
  onToggle: (value: string) => void;
};

function MultiSelectFilter({ label, facets, selected, onToggle }: MultiSelectFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-3.5 w-3.5" />
          {label}
          {selected.length ? <Badge variant="secondary">{selected.length}</Badge> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <div className="max-h-64 overflow-y-auto">
          {facets.length ? (
            facets.map((facet) => (
              <DropdownMenuCheckboxItem
                key={facet.value}
                checked={selected.includes(facet.value)}
                onCheckedChange={() => onToggle(facet.value)}
              >
                <span className="flex-1 truncate">{facet.label}</span>
                <span className="text-xs text-slate-400">{facet.count}</span>
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-slate-500">No options yet.</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SpotlightCard({ entry }: { entry: LibraryResource }) {
  return (
    <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-700">
          <span className="rounded-full bg-white/70 px-2 py-0.5">{entry.contentType}</span>
          <span className="text-slate-400">{entry.format}</span>
        </div>
        <h4 className="text-base font-semibold text-slate-900">{entry.title}</h4>
        <p className="text-sm text-slate-600 line-clamp-3">{entry.summary}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {entry.projects.map((project) => (
            <Badge key={project} variant="outline">
              {project}
            </Badge>
          ))}
        </div>
        <Button asChild size="sm" variant="secondary" className="w-full">
          <Link href={entry.url} target={entry.sourceType === "external" ? "_blank" : undefined}>
            Open resource
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ResourceResults({ entries, viewMode }: { entries: LibraryResource[]; viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {entries.map((entry) => (
          <ResourceCard key={entry.id} entry={entry} layout="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => (
        <ResourceCard key={entry.id} entry={entry} layout="grid" />
      ))}
    </div>
  );
}

function ResourceCard({ entry, layout }: { entry: LibraryResource; layout: ViewMode }) {
  const content = (
    <CardContent className="space-y-3 p-5">
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <Badge variant="outline">{entry.contentType}</Badge>
        <Badge variant="outline">{entry.format}</Badge>
        {entry.stage && entry.stage !== "published" ? (
          <Badge variant="secondary">{entry.stage}</Badge>
        ) : null}
      </div>
      <div className="space-y-2">
        <Link href={entry.url} target={entry.sourceType === "external" ? "_blank" : undefined}>
          <h4 className="text-lg font-semibold text-slate-900 hover:text-emerald-700">{entry.title}</h4>
        </Link>
        <p className="text-sm text-slate-600 line-clamp-3">{entry.summary}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {entry.projects.map((project) => (
          <Badge key={project} variant="secondary">
            {project}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>{entry.authors.map((author) => author.name).join(", ")}</span>
        {entry.publishedAt ? <span>• {new Date(entry.publishedAt).toLocaleDateString()}</span> : null}
        {entry.stats?.pages ? <span>• {entry.stats.pages} pages</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {entry.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={entry.url} target={entry.sourceType === "external" ? "_blank" : undefined}>
            View resource
          </Link>
        </Button>
        {entry.attachments?.length ? (
          <Button asChild size="sm" variant="outline">
            <Link href={entry.attachments[0].url}>Download</Link>
          </Button>
        ) : null}
      </div>
    </CardContent>
  );

  if (layout === "list") {
    return <div className="rounded-xl border border-slate-200 bg-white shadow-sm">{content}</div>;
  }

  return <Card className="border-slate-200 shadow-sm">{content}</Card>;
}

function LoadingGrid({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-48 w-full rounded-xl" />
      ))}
    </div>
  );
}

function toggleItem(value: string, setState: (updater: (previous: string[]) => string[]) => void) {
  setState((previous) => {
    if (previous.includes(value)) {
      return previous.filter((entry) => entry !== value);
    }
    return [...previous, value];
  });
}
