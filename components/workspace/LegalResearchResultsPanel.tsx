'use client';

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Fragment } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    COLLECTION_LABELS,
    JURISDICTION_LABELS,
    formatResultDate,
    type AggregatedResult,
} from "@/components/ui/LibSearchBar";
import { useLegalResearchResults } from "@/components/workspace/LegalResearchResultsContext";

type LegalResearchResultsPanelProps = {
    className?: string;
};

const PRIMARY_RESOURCE_KEYS = new Set<string>([
    "courtlistener",
    "waopinions",
    "courtrules",
    "rcw",
    "uscode",
    "recap",
    "govinfo",
    "ecfr",
    "regulations",
    "federalregister",
    "openstates",
]);

function isPrimaryAuthority(result: AggregatedResult): boolean {
    const key = typeof result.resourceKey === "string" ? result.resourceKey.toLowerCase() : "";
    if (key && PRIMARY_RESOURCE_KEYS.has(key)) {
        return true;
    }
    return result.collection === "primary-law" || result.collection === "litigation";
}

type ResultCardProps = {
    result: AggregatedResult;
    variant?: "primary" | "secondary";
};

function ResultCard({ result, variant = "primary" }: ResultCardProps) {
    const formattedDate = formatResultDate(result.date ?? null);
    const matchQuality = Number.isFinite(result.score) ? Math.min(100, Math.round(result.score * 100)) : null;
    const containerClassName = cn(
        "flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md md:flex-row md:items-start md:justify-between",
        variant === "primary" ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-200"
    );

    return (
        <div className={containerClassName}>
            <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-tight text-slate-500">
                    <Badge variant="outline">{result.sourceLabel ?? result.type}</Badge>
                    <Badge variant="secondary">{COLLECTION_LABELS[result.collection]}</Badge>
                    <Badge variant="secondary">{JURISDICTION_LABELS[result.jurisdiction]}</Badge>
                    {typeof matchQuality === "number" ? <Badge variant="outline">{matchQuality}% match</Badge> : null}
                </div>
                <h4 className="text-base font-semibold text-slate-900">{result.title}</h4>
                {result.snippetHtml ? (
                    <div
                        className="prose prose-sm max-w-none text-slate-600"
                        dangerouslySetInnerHTML={{ __html: result.snippetHtml }}
                    />
                ) : (
                    <p className="text-sm text-slate-600 break-words">{result.snippet}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                    {formattedDate ? <span>{formattedDate}</span> : null}
                    {result.year && (!formattedDate || !formattedDate.includes(result.year)) ? <span>{result.year}</span> : null}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
                <Button
                    asChild
                    variant="link"
                    className="px-0 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                    <Link
                        href={result.href}
                        target={result.external ? "_blank" : undefined}
                        rel={result.external ? "noopener noreferrer" : undefined}
                    >
                        View source
                    </Link>
                </Button>
            </div>
        </div>
    );
}

type NormalizedCitation = {
    ref: string | number;
    label: string;
    url?: string | null;
};

type NormalizedHighlight = {
    title: string;
    url?: string | null;
    snippet?: string | null;
    source?: string | null;
};

function AiSynthesisBlock({
    answer,
    summary,
    refinedQuery,
    citations,
    sources,
}: {
    answer: string | null;
    summary: string | null;
    refinedQuery: string | null;
    citations?: ReadonlyArray<NormalizedCitation> | null;
    sources?: ReadonlyArray<NormalizedHighlight> | null;
}) {
    const hasContent =
        Boolean(answer) ||
        Boolean(summary) ||
        (Array.isArray(sources) && sources.length > 0);
    if (!hasContent) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-3 text-sm text-slate-700">
                    {answer ? (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">AI synthesis</p>
                            <p className="whitespace-pre-wrap leading-relaxed">{answer}</p>
                            {Array.isArray(citations) && citations.length > 0 ? (
                                <ul className="space-y-1 text-xs text-emerald-700">
                                    {citations.map((citation) => (
                                        <li key={`citation-${citation.ref}`}>
                                            [{String(citation.ref)}] {citation.label}
                                            {citation.url ? (
                                                <Fragment>
                                                    {" "}
                                                    <Link
                                                        href={citation.url}
                                                        className="text-emerald-600 underline"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        {citation.url}
                                                    </Link>
                                                </Fragment>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                    {summary ? <p className="text-sm leading-relaxed text-slate-600">{summary}</p> : null}
                    {refinedQuery ? (
                        <p className="text-xs text-slate-500">
                            Refined query: <span className="font-medium text-slate-700">{refinedQuery}</span>
                        </p>
                    ) : null}
                    {Array.isArray(sources) && sources.length > 0 ? (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Source highlights</p>
                            <ul className="mt-2 space-y-1 text-xs text-emerald-800">
                                {sources.map((source, index) => (
                                    <li key={`${source.title}-${index}`}>
                                        [{index + 1}] {source.title}
                                        {source.url ? (
                                            <Fragment>
                                                {" "}
                                                <Link
                                                    href={source.url}
                                                    className="text-emerald-600 underline"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {source.url}
                                                </Link>
                                            </Fragment>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export function LegalResearchResultsPanel({ className }: LegalResearchResultsPanelProps) {
    const { state, reset } = useLegalResearchResults();
    const {
        status,
        originalQuery,
        effectiveQuery,
        results,
        aiAnswer,
        aiSummary,
        aiCitations,
        aiSources,
        infoMessage,
        errorMessage,
    } = state;

    const containerClassName = cn(
        "space-y-6 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm",
        className,
    );

    const normalizedCitations = Array.isArray(aiCitations)
        ? aiCitations.map<NormalizedCitation>((citation) => ({
              ref: citation.ref,
              label: citation.label,
              url: citation.url,
          }))
        : null;

    const normalizedSources = Array.isArray(aiSources)
        ? aiSources.map<NormalizedHighlight>((source) => ({
              title: source.title,
              url: source.url ?? null,
              snippet: source.snippet ?? null,
              source: source.source ?? null,
          }))
        : null;

    const activeQuery = effectiveQuery ?? originalQuery;
    const isLoading = status === "loading";
    const isError = status === "error";
    const isReady = status === "ready";
    const primaryResults = isReady ? results.filter(isPrimaryAuthority) : [];
    const secondaryResults = isReady ? results.filter((result) => !isPrimaryAuthority(result)) : [];
    const hasPrimaryResults = primaryResults.length > 0;
    const hasSecondaryResults = secondaryResults.length > 0;
    const hasAnyResults = hasPrimaryResults || hasSecondaryResults;

    return (
        <section className={containerClassName}>
            <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">AI legal research</p>
                    <h2 className="text-xl font-semibold text-slate-900">Synthesis &amp; blended results</h2>
                </div>
                {activeQuery ? (
                    <p className="text-sm text-slate-500">
                        Latest query: <span className="font-medium text-slate-700">“{activeQuery}”</span>
                    </p>
                ) : null}
                {status !== "idle" ? (
                    <Button variant="ghost" size="sm" onClick={reset} className="self-start sm:self-auto">
                        Back to workspace
                    </Button>
                ) : null}
            </header>

            {status === "idle" ? (
                <p className="text-sm text-slate-600">
                    Run a query from the AI sidebar to populate this workspace with synthesis and top matching sources.
                </p>
            ) : null}

            {isLoading ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                        Generating a cross-source synthesis
                        {originalQuery ? (
                            <>
                                {" "}
                                for “{originalQuery}”
                            </>
                        ) : null}
                        …
                    </span>
                </div>
            ) : null}

            {isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">We couldn’t complete that search.</p>
                    <p className="mt-1">{errorMessage ?? "Try again in a moment or adjust your filters."}</p>
                </div>
            ) : null}

            {isReady ? (
                <>
                    <AiSynthesisBlock
                        answer={aiAnswer}
                        summary={aiSummary}
                        refinedQuery={effectiveQuery}
                        citations={normalizedCitations}
                        sources={normalizedSources}
                    />
                    {infoMessage ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            {infoMessage}
                        </div>
                    ) : null}
                    {hasAnyResults ? (
                        <div className="space-y-6">
                            {hasPrimaryResults ? (
                                <div className="space-y-3">
                                    <h3 className="text-base font-semibold text-slate-900">Primary authorities</h3>
                                    <div className="space-y-4">
                                        {primaryResults.map((result) => (
                                            <ResultCard key={result.id} result={result} variant="primary" />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {hasSecondaryResults ? (
                                <div className="space-y-3">
                                    <h3 className="text-base font-semibold text-slate-900">Secondary &amp; contextual sources</h3>
                                    <div className="space-y-4">
                                        {secondaryResults.map((result) => (
                                            <ResultCard key={result.id} result={result} variant="secondary" />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {!hasAnyResults && !infoMessage ? (
                        <p className="text-sm text-slate-500">
                            No matching sources were returned. Try broadening your filters or refining the prompt.
                        </p>
                    ) : null}
                </>
            ) : null}
        </section>
    );
}
