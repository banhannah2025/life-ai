'use client';

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { searchDirectory, type SearchResponse, type SearchFilters } from "@/lib/search/client";
import { formatOpinionTitle } from "@/lib/courtlistener/format";
import { cn } from "@/lib/utils";

import { Badge } from "./badge";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./dialog";
import { Label } from "./label";
import { Textarea } from "./textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";
import { Collapsible, CollapsibleContent } from "./collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "./command";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { useOptionalCaseManagement, type CaseRecord } from "@/components/case-management/CaseManagementProvider";
import {
    requestAiSearchAssist,
    requestAiSearchAnswer,
    type AiSearchAnswerCitation,
    type AiSearchAnswerResultInput,
    type AiSearchAssistWebResult,
} from "@/lib/search/ai";
import { extractSearchTokens } from "@/lib/search/keywords";
import { STATE_NAME_TO_CODE, STATE_OPTIONS } from "@/lib/location/states";

type ResearchType = "legal" | "academic" | "ai";

export type AggregatedResult = {
    id: string;
    title: string;
    snippet: string;
    snippetHtml?: string | null;
    type: string;
    href: string;
    external: boolean;
    score: number;
    date?: string | null;
    year?: string | null;
    stateCode?: string | null;
    sourceLabel?: string;
    collection: "primary-law" | "secondary" | "litigation" | "knowledge" | "internet";
    jurisdiction: "federal" | "state" | "agency" | "mixed";
    resourceKey: string;
    resourceLabel: string;
};

type SanitizedWebResult = {
    title: string;
    url: string;
    snippet: string | null;
    source: string | null;
};

type JurisdictionOption = {
    label: string;
    value?: string;
    description?: string;
    defaultSelected?: boolean;
    children?: JurisdictionOption[];
};

type LibSearchBarSearchLifecycle = {
    onStart?: (query: string) => void;
    onSuccess?: (payload: LibSearchSuccessPayload) => void;
    onError?: (context: { query: string | null; error: string }) => void;
};

export type LibSearchSuccessPayload = {
    originalQuery: string;
    effectiveQuery: string;
    results: AggregatedResult[];
    aiAnswer: string | null;
    aiSummary: string | null;
    aiCitations: AiSearchAnswerCitation[] | null;
    aiSources: AiSearchAssistWebResult[] | null;
    infoMessage?: string | null;
};

type LibSearchBarProps = {
    heading?: string;
    description?: string;
    showHeader?: boolean;
    initialResearchType?: ResearchType;
    enabledResearchTypes?: ResearchType[];
    maxResults?: number;
    variant?: "default" | "sidebar";
    searchLifecycle?: LibSearchBarSearchLifecycle;
};

const DEFAULT_RESEARCH_TYPES: ResearchType[] = ["ai"];

const RESEARCH_TYPE_LABELS: Record<ResearchType, string> = {
    legal: "Legal research",
    academic: "Academic research",
    ai: "AI synthesis",
};

function formatList(items: string[]): string {
    if (items.length === 0) {
        return "";
    }
    if (items.length === 1) {
        return items[0];
    }
    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }
    const head = items.slice(0, -1).join(", ");
    const tail = items[items.length - 1];
    return `${head}, and ${tail}`;
}

const FEDERAL_JURISDICTIONS: JurisdictionOption[] = [
    { label: "U.S. Supreme Court", value: "federal:supreme", defaultSelected: true },
    {
        label: "U.S. Courts of Appeals",
        value: "federal:appeals:all",
        defaultSelected: true,
        children: [
            { label: "First Circuit", value: "federal:appeals:first" },
            { label: "Second Circuit", value: "federal:appeals:second" },
            { label: "Third Circuit", value: "federal:appeals:third" },
            { label: "Fourth Circuit", value: "federal:appeals:fourth" },
            { label: "Fifth Circuit", value: "federal:appeals:fifth" },
            { label: "Sixth Circuit", value: "federal:appeals:sixth" },
            { label: "Seventh Circuit", value: "federal:appeals:seventh" },
            { label: "Eighth Circuit", value: "federal:appeals:eighth" },
            { label: "Ninth Circuit", value: "federal:appeals:ninth" },
            { label: "Tenth Circuit", value: "federal:appeals:tenth" },
            { label: "Eleventh Circuit", value: "federal:appeals:eleventh" },
            { label: "D.C. Circuit", value: "federal:appeals:dc" },
            { label: "Federal Circuit", value: "federal:appeals:federal" },
        ],
    },
    {
        label: "U.S. District Courts",
        value: "federal:district:all",
        defaultSelected: true,
        children: [
            { label: "District of Columbia", value: "federal:district:dc" },
            { label: "Southern District of New York", value: "federal:district:ny-southern" },
            { label: "Northern District of California", value: "federal:district:ca-northern" },
            { label: "Eastern District of Texas", value: "federal:district:tx-eastern" },
            { label: "Western District of Washington", value: "federal:district:wa-western" },
        ],
    },
];

const AGENCY_JURISDICTIONS: JurisdictionOption[] = [
    { label: "All Federal Agencies & Boards", value: "agency:all", defaultSelected: true },
    { label: "Securities and Exchange Commission", value: "agency:sec" },
    { label: "National Labor Relations Board", value: "agency:nlrb" },
    { label: "Federal Trade Commission", value: "agency:ftc" },
    { label: "International Tribunals", value: "agency:international" },
];

const STATE_COURT_OPTIONS: Record<string, JurisdictionOption[]> = STATE_OPTIONS.reduce<
    Record<string, JurisdictionOption[]>
>((acc, state) => {
    acc[state.code] = [
        { label: `${state.name} Supreme Court`, value: `state:${state.code}:supreme`, defaultSelected: true },
        { label: `${state.name} Appellate Courts`, value: `state:${state.code}:appeals` },
        { label: `${state.name} Trial Courts`, value: `state:${state.code}:trial` },
    ];
    return acc;
}, {});

STATE_COURT_OPTIONS.ALL = [
    { label: "All State Supreme Courts", value: "state:all:supreme", defaultSelected: true },
    { label: "All State Appellate Courts", value: "state:all:appeals", defaultSelected: true },
    { label: "All State Trial Courts", value: "state:all:trial" },
];

const legalCollections = [
    { value: "primary-law", label: "Primary Law (cases, statutes, regulations)", defaultChecked: true },
    { value: "secondary", label: "Secondary Sources & Treatises", defaultChecked: true },
    { value: "litigation", label: "Litigation Analytics & Dockets" },
    { value: "knowledge", label: "Firm Knowledge Base" },
    { value: "internet", label: "Live Web Sources", defaultChecked: true },
];

const BASE_WEIGHTS: Record<string, number> = {
    profile: 0.55,
    post: 0.6,
    channel: 0.5,
    opinion: 0.78,
    waOpinion: 0.77,
    waCourtRule: 0.75,
    recap: 0.8,
    govDocument: 0.82,
    libraryItem: 0.85,
    federalRegister: 0.8,
    ecfr: 0.78,
    regulations: 0.76,
    openStates: 0.74,
    localDoc: 0.88,
    rcw: 0.73,
    uscode: 0.72,
    websearch: 0.68,
};

const LEGAL_RESOURCE_PRIORITY: Record<string, number> = {
    courtlistener: 0,
    waopinions: 1,
    courtrules: 2,
    rcw: 3,
    uscode: 4,
    recap: 5,
    govinfo: 6,
    ecfr: 7,
    regulations: 8,
    federalregister: 9,
    openstates: 10,
    websearch: 11,
    knowledge: 12,
};


export const COLLECTION_LABELS: Record<AggregatedResult["collection"], string> = {
    "primary-law": "Primary Law",
    secondary: "Secondary Sources",
    litigation: "Litigation & Dockets",
    knowledge: "Knowledge Base",
    internet: "Live Web",
};

export const JURISDICTION_LABELS: Record<AggregatedResult["jurisdiction"], string> = {
    federal: "Federal",
    state: "State",
    agency: "Administrative",
    mixed: "Multi-Jurisdiction",
};

const DEFAULT_COLLECTION_VALUES = new Set(legalCollections.filter((item) => item.defaultChecked).map((item) => item.value));

type JurisdictionCategory = "federal" | "state" | "agency" | "mixed";

type LegalFilters = {
    jurisdictions: Set<JurisdictionCategory>;
    collections: Set<string>;
    dateRange: "any" | "5y" | "2y" | "1y" | "90d";
    phraseBoost: string;
    state?: string | null;
};

function createDefaultJurisdictionSelection(): Set<string> {
    return new Set([
        "federal:supreme",
        "federal:appeals:all",
        "federal:district:all",
        "agency:all",
        "state:all:supreme",
        "state:all:appeals",
        "state:all:trial",
    ]);
}

function mapJurisdictionValueToCategory(value: string): JurisdictionCategory {
    if (value.startsWith("federal:")) {
        return "federal";
    }
    if (value.startsWith("state:")) {
        return "state";
    }
    if (value.startsWith("agency:")) {
        return "agency";
    }
    return "mixed";
}

function deriveJurisdictionCategories(values: Set<string>): Set<JurisdictionCategory> {
    const categories = new Set<JurisdictionCategory>();
    if (values.size === 0) {
        return new Set(["federal", "state", "agency", "mixed"]);
    }
    values.forEach((value) => {
        categories.add(mapJurisdictionValueToCategory(value));
    });
    return categories;
}

function isWithinDateRange(dateString: string | null | undefined, range: LegalFilters["dateRange"]): boolean {
    if (range === "any" || !dateString) {
        return true;
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return false;
    }
    const now = new Date();
    const msInDay = 86_400_000;
    const diffDays = (now.getTime() - date.getTime()) / msInDay;
    switch (range) {
        case "5y":
            return diffDays <= 1825;
        case "2y":
            return diffDays <= 730;
        case "1y":
            return diffDays <= 365;
        case "90d":
            return diffDays <= 90;
        default:
            return true;
    }
}

export function formatResultDate(dateString: string | null | undefined): string | null {
    if (!dateString) {
        return null;
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

function extractYear(dateString: string | null | undefined): string | null {
    if (!dateString) {
        return null;
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.getFullYear().toString();
}

function computeScore(query: string, base: number, text: string): number {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    let score = base;
    const haystack = text.toLowerCase();
    for (const token of tokens) {
        if (haystack.includes(token)) {
            score += 0.05;
        }
    }
    return Math.min(1, score);
}

function truncateText(text: string, maxLength = 220): string {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }
    const truncated = normalized.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    const safeCut = lastSpace > 40 ? lastSpace : maxLength;
    return `${truncated.slice(0, safeCut).trim()}…`;
}

function getPriority(result: AggregatedResult, researchType: ResearchType): number {
    if (researchType === "legal") {
        if (result.resourceKey in LEGAL_RESOURCE_PRIORITY) {
            return LEGAL_RESOURCE_PRIORITY[result.resourceKey];
        }
        return 99;
    }

    return 5;
}

const SEARCH_STOPWORDS = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "have",
    "has",
    "shall",
    "must",
    "should",
    "would",
    "could",
    "will",
    "are",
    "was",
    "were",
    "been",
    "being",
    "what",
    "when",
    "where",
    "why",
    "which",
    "whose",
    "whom",
    "into",
    "onto",
    "about",
    "under",
    "over",
    "upon",
    "between",
    "within",
    "without",
    "among",
]);

function isValidHttpUrl(input: string | null | undefined): input is string {
    if (!input) {
        return false;
    }
    try {
        const url = new URL(input);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function normalizeTextValue(value: unknown, fallback = ""): string {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || fallback;
    }
    if (Array.isArray(value)) {
        const combined = value
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter(Boolean)
            .join(" ")
            .trim();
        return combined || fallback;
    }
    if (value === null || value === undefined) {
        return fallback;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return fallback;
}

function meetsTokenThreshold(text: string, tokens: string[], minimumMatches: number): boolean {
    if (!tokens.length || minimumMatches <= 0) {
        return true;
    }
    const haystack = text.toLowerCase();
    let matches = 0;
    for (const token of tokens) {
        if (haystack.includes(token)) {
            matches += 1;
            if (matches >= minimumMatches) {
                return true;
            }
        }
    }
    return matches >= minimumMatches;
}

function aggregateSearchResults(
    query: string,
    data: SearchResponse,
    researchType: ResearchType,
    filters?: LegalFilters,
    webResults?: AiSearchAssistWebResult[] | null,
    maxResultsOverride?: number
): AggregatedResult[] {
    const bucketedResults = new Map<string, AggregatedResult[]>();
    const fallbackBucketedResults = new Map<string, AggregatedResult[]>();
    const isLegal = researchType === "legal";
    const isAcademic = researchType === "academic";
    const includeProfiles = !isLegal;
    const includePosts = !isLegal;
    const includeChannels = !isLegal;
    const includeOpinions = isLegal || researchType === "ai";
    const includeRecap = isLegal || researchType === "ai";
    const includeWaOpinions = isLegal || researchType === "ai";
    const includeCourtRules = isLegal || researchType === "ai";
    const includeGovDocuments = isLegal || isAcademic || researchType === "ai";
    const includeLibraryItems = isAcademic || researchType === "ai";
    const includeFederalRegister = isLegal || researchType === "ai";
    const includeEcfr = isLegal || researchType === "ai";
    const includeRegulations = isLegal || researchType === "ai";
    const includeOpenStates = isLegal || researchType === "ai";
    const includeLocalDocuments = isLegal || researchType === "ai";
    const includeRcwSections = isLegal || researchType === "ai";
    const includeUsCodeDownloads = isLegal || researchType === "ai";

    const activeCollections =
        filters?.collections && filters.collections.size > 0 ? filters.collections : new Set(legalCollections.map((c) => c.value));
    const activeJurisdictions =
        filters?.jurisdictions && filters.jurisdictions.size > 0
            ? filters.jurisdictions
            : new Set<JurisdictionCategory>(["federal", "state", "agency", "mixed"]);
    const phrase = filters?.phraseBoost?.trim().toLowerCase() ?? "";
    const dateRange = filters?.dateRange ?? "any";
    const stateFilter = filters?.state && filters.state !== "ALL" ? filters.state : null;
    const enforceCollections = filters?.collections ? filters.collections.size > 0 : false;
    const enforceJurisdictions = filters?.jurisdictions ? filters.jurisdictions.size > 0 : false;
    const enforceDateRange = filters?.dateRange ? filters.dateRange !== "any" : false;
    const meaningfulTokens =
        isLegal
            ? Array.from(
                  new Set(
                      extractSearchTokens(query)
                          .map((token) => token.trim())
                          .filter((token) => token.length >= 3 && !SEARCH_STOPWORDS.has(token))
                  )
              )
            : [];
    const minimumTokenMatches = 0;

    const shouldIncludeCollection = (collection: AggregatedResult["collection"]) => {
        if (!isLegal && !enforceCollections) {
            return true;
        }
        return activeCollections.has(collection);
    };
    const shouldIncludeJurisdiction = (jurisdiction: AggregatedResult["jurisdiction"]) => {
        if (!isLegal && !enforceJurisdictions) {
            return true;
        }
        return (
            activeJurisdictions.size === 0 ||
            activeJurisdictions.has(jurisdiction) ||
            (jurisdiction === "mixed" && (activeJurisdictions.has("mixed") || activeJurisdictions.size >= 3))
        );
    };

    const maybeBoostScore = (item: AggregatedResult) => {
        if (!phrase) {
            return;
        }
        const haystack = `${item.title} ${item.snippet}`.toLowerCase();
        if (haystack.includes(phrase)) {
            item.score = Math.min(1, item.score + 0.12);
        }
    };

    const storeInBucket = (map: Map<string, AggregatedResult[]>, key: string, entry: AggregatedResult) => {
        const bucket = map.get(key) ?? [];
        bucket.push(entry);
        bucket.sort((a, b) => b.score - a.score);
        if (bucket.length > 5) {
            bucket.length = 5;
        }
        map.set(key, bucket);
    };

    const pushIfAllowed = (item: AggregatedResult) => {
        if (!item.resourceKey) {
            item.resourceKey = "misc";
        }
        if (!item.resourceLabel) {
            item.resourceLabel = item.sourceLabel ?? item.type;
        }
        if (item.external) {
            if (!isValidHttpUrl(item.href)) {
                return;
            }
        } else if (!item.href || item.href === "#") {
            return;
        }
        if ((isLegal || enforceCollections) && !shouldIncludeCollection(item.collection)) {
            return;
        }
        if ((isLegal || enforceJurisdictions) && !shouldIncludeJurisdiction(item.jurisdiction)) {
            return;
        }
        if ((isLegal || enforceDateRange) && !isWithinDateRange(item.date, dateRange)) {
            return;
        }
        if (stateFilter && item.jurisdiction === "state") {
            if (!item.stateCode || item.stateCode.toUpperCase() !== stateFilter) {
                return;
            }
        }
        const normalizedResourceLabel = (item.resourceLabel ?? item.sourceLabel ?? item.type).slice(0, 160);
        const normalizedSourceLabel = (item.sourceLabel ?? normalizedResourceLabel).slice(0, 120);
        item.resourceLabel = normalizedResourceLabel;
        item.sourceLabel = normalizedSourceLabel;
        maybeBoostScore(item);

        const key = (item.resourceKey ?? "misc").toLowerCase();
        item.resourceKey = key;
        const haystack = `${item.title} ${item.snippet ?? ""} ${item.snippetHtml ?? ""}`;
        const passesTokenThreshold =
            minimumTokenMatches === 0 || meetsTokenThreshold(haystack, meaningfulTokens, minimumTokenMatches);
        const targetBuckets = passesTokenThreshold ? bucketedResults : fallbackBucketedResults;
        storeInBucket(targetBuckets, key, item);
    };

    if (includeProfiles) {
        for (const profile of data.profiles) {
            const text = `${profile.fullName} ${profile.headline ?? ""} ${profile.location ?? ""}`;
            pushIfAllowed({
                id: `profile-${profile.id}`,
                title: profile.fullName,
                snippet: profile.headline || profile.location || "Community profile",
                snippetHtml: null,
                type: "Team member",
                href: `/people/${profile.id}`,
                external: false,
                score: computeScore(query, BASE_WEIGHTS.profile, text),
                collection: "knowledge",
                jurisdiction: "mixed",
                resourceKey: "profiles",
                resourceLabel: "Directory Profiles",
                stateCode: null,
            });
        }
    }

    if (includePosts) {
        for (const post of data.posts) {
            const preview = post.content.replace(/\s+/g, " ").slice(0, 160);
            const authorLabel = post.author.name?.split(" ")[0] || post.author.name || "Community";
            pushIfAllowed({
                id: `post-${post.id}`,
                title: `${authorLabel} – Social update`,
                snippet: preview || "Community post",
                snippetHtml: null,
                type: "Community post",
                href: `/social?post=${post.id}`,
                external: false,
                score: computeScore(query, BASE_WEIGHTS.post, post.content),
                collection: "knowledge",
                jurisdiction: "mixed",
                resourceKey: "posts",
                resourceLabel: "Community Posts",
                stateCode: null,
            });
        }
    }

    if (includeChannels) {
        for (const channel of data.channels) {
            const text = `${channel.name} ${channel.description ?? ""}`;
            pushIfAllowed({
                id: `channel-${channel.id}`,
                title: channel.name,
                snippet: channel.description ?? "Social channel",
                snippetHtml: null,
                type: "Channel",
                href: `/social?channel=${channel.id}`,
                external: false,
                score: computeScore(query, BASE_WEIGHTS.channel, text),
                collection: "knowledge",
                jurisdiction: "mixed",
                resourceKey: "channels",
                resourceLabel: "Channels",
                stateCode: null,
            });
        }
    }

    if (includeOpinions) {
        for (const opinion of data.opinions) {
            const text = `${opinion.caseName} ${opinion.citation ?? ""} ${opinion.precedentialStatus ?? ""}`;
            const fallbackSummary =
                opinion.citation || opinion.precedentialStatus || opinion.docketNumber || "Court opinion";
            const jurisdiction = opinion.jurisdictionCategory ?? "mixed";
            pushIfAllowed({
                id: `opinion-${opinion.id}`,
                title: formatOpinionTitle(opinion),
                snippet: opinion.snippet ?? fallbackSummary,
                snippetHtml: opinion.snippetHighlighted ?? null,
                type: "CourtListener opinion",
                href: opinion.absoluteUrl ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.opinion, text),
                date: opinion.dateFiled,
                year: opinion.year,
                collection: "primary-law",
                jurisdiction,
                sourceLabel: "CourtListener",
                resourceKey: "courtlistener",
                resourceLabel: "CourtListener",
                stateCode: opinion.stateCode ?? null,
            });
        }
    }

    if (includeRecap) {
        for (const docket of data.recapDockets ?? []) {
            const text = `${docket.caseName} ${docket.docketNumber ?? ""} ${docket.natureOfSuit ?? ""} ${docket.cause ?? ""}`;
            const snippet =
                docket.snippet ?? docket.natureOfSuit ?? docket.cause ?? "Recent RECAP docket entry";
            const jurisdiction = docket.jurisdictionCategory ?? "mixed";
            pushIfAllowed({
                id: `recap-${docket.id}`,
                title: docket.docketNumber ? `${docket.caseName} (Docket ${docket.docketNumber})` : docket.caseName,
                snippet,
                snippetHtml: null,
                type: "RECAP docket",
                href: docket.absoluteUrl ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.recap, text),
                date: docket.dateFiled,
                year: extractYear(docket.dateFiled ?? null),
                collection: "litigation",
                jurisdiction,
                sourceLabel: "CourtListener RECAP",
                resourceKey: "recap",
                resourceLabel: "CourtListener RECAP",
                stateCode: docket.stateCode ?? null,
            });
        }
    }

    if (includeWaOpinions) {
        for (const opinion of data.waOpinions ?? []) {
            const text = `${opinion.caseTitle} ${opinion.docketNumber} ${opinion.fileContains}`;
            const snippet = opinion.summary || opinion.fileContains || "Washington appellate opinion";
            pushIfAllowed({
                id: `wa-opinion-${opinion.id}`,
                title: `${opinion.caseTitle} (Docket ${opinion.docketNumber})`,
                snippet,
                snippetHtml: null,
                type: opinion.courtLabel,
                href: opinion.detailUrl ?? opinion.pdfUrl ?? "#",
                external: Boolean(opinion.detailUrl || opinion.pdfUrl),
                score: computeScore(query, BASE_WEIGHTS.waOpinion, text),
                date: opinion.fileDate,
                year: extractYear(opinion.fileDate ?? null),
                collection: "primary-law",
                jurisdiction: "state",
                sourceLabel: "Washington Courts",
                resourceKey: "waopinions",
                resourceLabel: "Washington Courts",
                stateCode: "WA",
            });
        }
    }

    if (includeCourtRules) {
        for (const rule of data.waCourtRules ?? []) {
            const text = `${rule.ruleNumber} ${rule.title} ${rule.setName} ${rule.groupName}`;
            const snippet = rule.category || `${rule.setAbbreviation} • ${rule.setName}`;
            pushIfAllowed({
                id: `courtrule-${rule.id}`,
                title: `${rule.ruleNumber} – ${rule.title}`,
                snippet,
                snippetHtml: null,
                type: `${rule.setAbbreviation} (${rule.groupName})`,
                href: rule.pdfUrl ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.waCourtRule, text),
                collection: "primary-law",
                jurisdiction: "state",
                sourceLabel: "Washington Court Rules",
                resourceKey: "courtrules",
                resourceLabel: "Washington Court Rules",
                stateCode: "WA",
            });
        }
    }

    if (includeGovDocuments) {
        for (const doc of data.govDocuments) {
            const text = `${doc.title} ${doc.collectionName ?? ""} ${doc.citation ?? ""}`;
            pushIfAllowed({
                id: `gov-${doc.packageId}`,
                title: doc.title,
                snippet: doc.citation || doc.collectionName || "Government document",
                snippetHtml: null,
                type: "GovInfo",
                href: doc.url ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.govDocument, text),
                date: doc.documentDate ?? null,
                year: extractYear(doc.documentDate ?? null),
                collection: "primary-law",
                jurisdiction: "federal",
                sourceLabel: doc.collectionName ? `GovInfo — ${doc.collectionName}` : "GovInfo",
                resourceKey: "govinfo",
                resourceLabel: "GovInfo",
                stateCode: null,
            });
        }
    }

    if (includeLibraryItems) {
        for (const item of data.libraryItems) {
            const text = `${item.title} ${item.description ?? ""} ${(item.subjects || []).join(" ")}`;
            pushIfAllowed({
                id: `loc-${item.id}`,
                title: item.title,
                snippet: item.description || item.subjects.slice(0, 3).join(" · ") || "Library of Congress entry",
                snippetHtml: null,
                type: "Library of Congress",
                href: item.url ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.libraryItem, text),
                collection: "secondary",
                jurisdiction: "federal",
                sourceLabel: "Library of Congress",
                resourceKey: "loc",
                resourceLabel: "Library of Congress",
                year: extractYear(item.date ?? null),
                stateCode: null,
            });
        }
    }

    if (includeFederalRegister) {
        for (const item of data.federalRegisterDocuments) {
            const text = `${item.title} ${item.agencies.join(" ")}`;
            pushIfAllowed({
                id: `fr-${item.id}`,
                title: item.title,
                snippet: item.agencies.join(" · ") || item.documentType || "Federal Register notice",
                snippetHtml: null,
                type: "Federal Register",
                href: item.htmlUrl ?? item.pdfUrl ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.federalRegister, text),
                date: item.publicationDate ?? null,
                year: extractYear(item.publicationDate ?? null),
                collection: "primary-law",
                jurisdiction: "agency",
                sourceLabel: "Federal Register",
                resourceKey: "federalregister",
                resourceLabel: "Federal Register",
                stateCode: null,
            });
        }
    }

    if (includeEcfr) {
        for (const item of data.ecfrDocuments) {
            const text = `${item.title} ${item.citation ?? ""} ${item.section ?? ""}`;
            pushIfAllowed({
                id: `ecfr-${item.id}`,
                title: item.title,
                snippet: item.citation || item.section || "Code of Federal Regulations entry",
                snippetHtml: null,
                type: "eCFR",
                href: item.url ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.ecfr, text),
                date: item.lastModified ?? null,
                year: extractYear(item.lastModified ?? null),
                collection: "primary-law",
                jurisdiction: "agency",
                sourceLabel: "eCFR",
                resourceKey: "ecfr",
                resourceLabel: "eCFR",
                stateCode: null,
            });
        }
    }

    if (includeRegulations) {
        for (const item of data.regulationsDocuments) {
            const text = `${item.title} ${item.agency ?? ""} ${item.docketId ?? ""}`;
            pushIfAllowed({
                id: `regs-${item.id}`,
                title: item.title,
                snippet: item.agency || item.docketId || "Regulations.gov document",
                snippetHtml: null,
                type: "Regulations.gov",
                href: item.url ?? "#",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.regulations, text),
                date: item.postedDate ?? null,
                year: extractYear(item.postedDate ?? null),
                collection: "primary-law",
                jurisdiction: "agency",
                sourceLabel: "Regulations.gov",
                resourceKey: "regulations",
                resourceLabel: "Regulations.gov",
                stateCode: null,
            });
        }
    }

    if (includeOpenStates) {
        for (const bill of data.openStatesBills) {
            const text = `${bill.title} ${bill.identifier} ${bill.jurisdiction ?? ""}`;
            pushIfAllowed({
                id: `openstates-${bill.id}`,
                title: `${bill.identifier} – ${bill.title}`,
                snippet: bill.jurisdiction || bill.session || "Open States bill",
                snippetHtml: null,
                type: "Open States",
                href: bill.url ?? "https://openstates.org",
                external: true,
                score: computeScore(query, BASE_WEIGHTS.openStates, text),
                date: bill.latestActionDate ?? null,
                year: extractYear(bill.latestActionDate ?? null),
                collection: "litigation",
                jurisdiction: "state",
                sourceLabel: "Open States",
                resourceKey: "openstates",
                resourceLabel: "Open States",
                stateCode: bill.jurisdiction ? STATE_NAME_TO_CODE[bill.jurisdiction.toLowerCase()] ?? null : null,
            });
        }
    }

    if (includeRcwSections) {
        for (const section of data.rcwSections ?? []) {
            const text = `${section.sectionNumber} ${section.heading} ${section.summary}`;
            pushIfAllowed({
                id: `rcw-${section.id}`,
                title: `RCW ${section.sectionNumber} – ${section.heading}`,
                snippet: section.summary,
                snippetHtml: null,
                type: "RCW",
                href: section.appPath,
                external: false,
                score: computeScore(query, BASE_WEIGHTS.rcw, text),
                collection: "primary-law",
                jurisdiction: "state",
                sourceLabel: "Washington RCW",
                resourceKey: "rcw",
                resourceLabel: "RCW",
                stateCode: "WA",
            });
        }
    }

    if (includeUsCodeDownloads) {
        for (const item of data.uscodeTitles ?? []) {
            const text = `${item.titleLabel} ${item.description} ${item.releaseLabel}`;
            const snippetParts = [item.description, item.localPath ? "Cached locally" : "Remote bundle"]
                .filter(Boolean)
                .join(" • ");
            pushIfAllowed({
                id: `uscode-${item.id}`,
                title: `${item.titleLabel} (Release ${item.releaseLabel})`,
                snippet: snippetParts || "U.S. Code XML download",
                snippetHtml: null,
                type: "U.S. Code XML",
                href: item.remoteUrl,
                external: true,
                score: computeScore(query, BASE_WEIGHTS.uscode, text),
                collection: "primary-law",
                jurisdiction: "federal",
                sourceLabel: "Office of the Law Revision Counsel",
                resourceKey: "uscode",
                resourceLabel: "U.S. Code",
                stateCode: null,
            });
        }
    }

    const localDocs = includeLocalDocuments ? data.localDocuments ?? [] : [];

    if (includeLocalDocuments) {
        for (const doc of localDocs) {
            if (!doc.url) {
                continue;
            }
            const text = `${doc.title} ${doc.summary ?? ""} ${doc.body ?? ""}`;
            const lowerSource = doc.source.toLowerCase();
            const isGuidance = lowerSource.includes("guide") || lowerSource.includes("analysis") || lowerSource.includes("knowledge");
            const isInternal = lowerSource.includes("life-ai");
            const collection: AggregatedResult["collection"] = isInternal ? "knowledge" : isGuidance ? "secondary" : "knowledge";
            const jurisdiction: AggregatedResult["jurisdiction"] =
                doc.tags.includes("federal register") || doc.tags.includes("federal") ? "federal" : "mixed";
            const summary = doc.summary?.trim();
            const fallbackBody = truncateText(doc.body ?? "", 180);
            pushIfAllowed({
                id: `local-${doc.id}`,
                title: doc.title,
                snippet: summary || fallbackBody || "Knowledge base entry",
                snippetHtml: null,
                type: doc.source,
                href: doc.url,
                external: !doc.url.startsWith("/"),
                score: computeScore(query, BASE_WEIGHTS.localDoc, text),
                collection,
                jurisdiction,
                sourceLabel: doc.source,
                resourceKey: "knowledge",
                resourceLabel: "Knowledge Base",
                stateCode: null,
            });
        }
    }

    if (webResults && webResults.length > 0 && researchType !== "academic") {
        webResults.forEach((result, index) => {
            if (!result?.title) {
                return;
            }
            if (!isValidHttpUrl(result.url)) {
                return;
            }
            const snippet = result.snippet ? truncateText(result.snippet, 260) : "Web search result";
            const label = result.source?.trim() ? result.source.trim().slice(0, 120) : "Live web";
            pushIfAllowed({
                id: `web-${index}-${result.title.slice(0, 32)}`,
                title: truncateText(result.title, 180),
                snippet,
                snippetHtml: null,
                type: label,
                href: result.url!,
                external: true,
                score: computeScore(query, BASE_WEIGHTS.websearch, `${result.title} ${snippet}`),
                collection: "internet",
                jurisdiction: "mixed",
                sourceLabel: label,
                resourceKey: "websearch",
                resourceLabel: "Live Web",
                stateCode: null,
                date: null,
                year: null,
            });
        });
    }

    const maxResults =
        typeof maxResultsOverride === "number"
            ? maxResultsOverride
            : researchType === "legal"
                ? 60
                : 5;

    const bucketPriorityOverrides: Record<string, number> = {
        courtlistener: -200,
        uscode: -150,
        rcw: -140,
    };
    const computeBucketPriority = (map: Map<string, AggregatedResult[]>, key: string): number => {
        const normalized = key.toLowerCase();
        if (normalized in bucketPriorityOverrides) {
            return bucketPriorityOverrides[normalized];
        }
        if (isLegal) {
            if (normalized === "waopinions") {
                return -120;
            }
            if (normalized === "courtrules") {
                return -110;
            }
        }
        const sample = map.get(key)?.[0];
        if (sample) {
            return getPriority({ ...sample, resourceKey: normalized }, researchType);
        }
        return 99;
    };

    const collectBuckets = (map: Map<string, AggregatedResult[]>) => {
        const combined: AggregatedResult[] = [];
        const keys = Array.from(map.keys());
        keys.sort((a, b) => {
            const priorityDiff = computeBucketPriority(map, a) - computeBucketPriority(map, b);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return a.localeCompare(b);
        });
        for (const key of keys) {
            const bucket = map.get(key);
            if (!bucket) {
                continue;
            }
            const sortedBucket = [...bucket].sort((a, b) => b.score - a.score);
            combined.push(...sortedBucket);
        }
        return combined;
    };

    let combinedResults = collectBuckets(bucketedResults);

    if (combinedResults.length === 0 && fallbackBucketedResults.size > 0) {
        combinedResults = collectBuckets(fallbackBucketedResults);
    }

    const bucketKeys = combinedResults.length
        ? Array.from(new Set(combinedResults.map((entry) => entry.resourceKey ?? "misc")))
        : Array.from(fallbackBucketedResults.keys());

    const dynamicLimit = isLegal ? Math.max(maxResults, bucketKeys.length * 5) : maxResults;

    if (combinedResults.length === 0) {
        return combinedResults;
    }

    combinedResults = combinedResults.slice(0, dynamicLimit);

    const seen = new Set<string>();
    const deduped: AggregatedResult[] = [];
    for (const entry of combinedResults) {
        const key = `${entry.resourceKey ?? "misc"}::${entry.id}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        deduped.push(entry);
    }

    return deduped;
}

type JurisdictionMultiSelectProps = {
    triggerLabel: string;
    options: JurisdictionOption[];
    selectedValues: Set<string>;
    onToggle: (value: string) => void;
    isSelected: (value: string | undefined) => boolean;
    emptyMessage?: string;
};

function countSelectedJurisdictions(
    options: JurisdictionOption[],
    selectedValues: Set<string>
): number {
    let count = 0;
    for (const option of options) {
        if (option.value && selectedValues.has(option.value)) {
            count += 1;
        }
        if (option.children?.length) {
            count += countSelectedJurisdictions(option.children, selectedValues);
        }
    }
    return count;
}

function renderJurisdictionOptionItems(
    options: JurisdictionOption[],
    depth: number,
    onToggle: (value: string) => void,
    isSelected: (value: string | undefined) => boolean
): ReactNode[] {
    return options.flatMap((option) => {
        const key = option.value ?? `${option.label}-${depth}`;
        const selected = option.value ? isSelected(option.value) : false;
        const elements: React.ReactNode[] = [
            <CommandItem
                key={key}
                value={option.value ?? option.label}
                disabled={!option.value}
                onSelect={() => {
                    if (option.value) {
                        onToggle(option.value);
                    }
                }}
            >
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 12 }}>
                        {option.value ? (
                            <Check className={`h-4 w-4 ${selected ? "opacity-100" : "opacity-0"} transition-opacity`} />
                        ) : (
                            <span className="h-4 w-4" />
                        )}
                        <span className="text-sm text-slate-700">{option.label}</span>
                    </div>
                    {option.description ? (
                        <span className="text-xs text-slate-500">{option.description}</span>
                    ) : null}
                </div>
            </CommandItem>,
        ];

        if (option.children?.length) {
            elements.push(...renderJurisdictionOptionItems(option.children, depth + 1, onToggle, isSelected));
        }

        return elements;
    });
}

function JurisdictionMultiSelect({
    triggerLabel,
    options,
    selectedValues,
    onToggle,
    isSelected,
    emptyMessage,
}: JurisdictionMultiSelectProps) {
    const selectedCount = useMemo(() => countSelectedJurisdictions(options, selectedValues), [options, selectedValues]);
    const buttonLabel =
        selectedCount > 0 ? `${triggerLabel} (${selectedCount})` : triggerLabel;

    if (!options.length) {
        return (
            <Button type="button" variant="outline" disabled className="w-full justify-between">
                <span className="text-left text-sm">{emptyMessage ?? "No jurisdictions available"}</span>
                <ChevronDown className="h-4 w-4 opacity-40" />
            </Button>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between">
                    <span className="flex-1 truncate text-left text-sm">{buttonLabel}</span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Filter courts..." />
                    <CommandEmpty>No courts found.</CommandEmpty>
                    <CommandList>{renderJurisdictionOptionItems(options, 0, onToggle, isSelected)}</CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function LibSearchBar({
    heading,
    description,
    showHeader = false,
    initialResearchType,
    enabledResearchTypes,
    maxResults,
    variant = "default",
    searchLifecycle,
}: LibSearchBarProps = {}) {
    const resolvedResearchTypes = useMemo<ResearchType[]>(() => {
        const source = enabledResearchTypes ?? DEFAULT_RESEARCH_TYPES;
        const unique: ResearchType[] = [];
        for (const entry of source) {
            if (!unique.includes(entry)) {
                unique.push(entry);
            }
        }
        return unique.length > 0 ? unique : DEFAULT_RESEARCH_TYPES;
    }, [enabledResearchTypes]);

    const researchType: ResearchType =
        initialResearchType && resolvedResearchTypes.includes(initialResearchType)
            ? initialResearchType
            : resolvedResearchTypes[0] ?? "ai";

    const researchModeLabels = useMemo(
        () => resolvedResearchTypes.map((type) => RESEARCH_TYPE_LABELS[type].toLowerCase()),
        [resolvedResearchTypes]
    );
    const isSidebar = variant === "sidebar";
    const resolvedHeading = heading ?? "Research Console";
    const resolvedDescription =
        description ??
        (researchModeLabels.length
            ? `Switch between ${formatList(researchModeLabels)} modes without losing context. Results appear below the form.`
            : null);
    const formWrapperClassName = isSidebar ? "flex h-full w-full" : "flex w-full justify-center";
    const formClassName = isSidebar
        ? "flex h-full w-full flex-col gap-6"
        : "flex w-full max-w-6xl flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-lg";
    const effectiveMaxResults =
        typeof maxResults === "number" ? maxResults : isSidebar ? 25 : 5;
    const shouldShowHeaderBlock = showHeader && Boolean(resolvedHeading || resolvedDescription);
    const queryShellClassName = cn(
        "flex flex-col gap-4",
        isSidebar ? "" : "rounded-2xl border border-slate-900/10 bg-slate-900 p-6 text-slate-100 shadow-lg"
    );
    const textareaClassName = isSidebar
        ? "min-h-[96px] resize-none rounded-lg border border-slate-200 bg-white/95 p-3 text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
        : "min-h-[96px] resize-none border-none bg-white/10 text-base text-white placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-400";
    const advancedContentClassName = cn(
        "mt-4 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg",
        isSidebar && "mt-3 space-y-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm"
    );
    const advancedLayoutClassName = isSidebar ? "space-y-4" : "grid gap-6 lg:grid-cols-3";
    const advancedSectionClassName = isSidebar
        ? "space-y-3 rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm"
        : "space-y-4";
    const checkboxRowClassName = isSidebar
        ? "flex items-center gap-3 rounded-lg bg-white/80 px-2.5 py-1.5 text-sm text-slate-700"
        : "flex items-center gap-3 text-sm text-slate-700";
    const synthesisContainerClassName = cn(
        "mt-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg",
        isSidebar && "rounded-xl border border-emerald-200 bg-white/95 p-4 shadow-sm"
    );
    const resultCardClassName = cn(
        "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md",
        isSidebar && "rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm"
    );
    const emptyStateClassName = cn(
        "rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600",
        isSidebar && "rounded-xl"
    );
    const errorCalloutClassName = cn(
        "rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700",
        isSidebar && "rounded-xl"
    );
    const shouldRenderInlineResults = !isSidebar;

    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<AggregatedResult[]>([]);
    const [lastQuery, setLastQuery] = useState<string | null>(null);
    const [selectedJurisdictions, setSelectedJurisdictions] = useState<Set<string>>(createDefaultJurisdictionSelection);
    const [selectedState, setSelectedState] = useState<string>("ALL");
    const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
        () => new Set(DEFAULT_COLLECTION_VALUES)
    );
    const [selectedDateRange, setSelectedDateRange] = useState<LegalFilters["dateRange"]>("any");
    const [phraseBoost, setPhraseBoost] = useState("");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [aiAssistSummary, setAiAssistSummary] = useState<string | null>(null);
    const [aiAssistQuery, setAiAssistQuery] = useState<string | null>(null);
    const [aiAssistSources, setAiAssistSources] = useState<AiSearchAssistWebResult[] | null>(null);
    const [aiAssistAnswer, setAiAssistAnswer] = useState<string | null>(null);
    const [aiAssistCitations, setAiAssistCitations] = useState<AiSearchAnswerCitation[] | null>(null);
    const previousSelectedStateRef = useRef<string>("ALL");
    const caseManagement = useOptionalCaseManagement();
    const [attachDialogOpen, setAttachDialogOpen] = useState(false);
    const [attachmentNotes, setAttachmentNotes] = useState("");
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
    const [resultPendingAttachment, setResultPendingAttachment] = useState<AggregatedResult | null>(null);
    const attachableClients = caseManagement?.state.clients ?? [];
    const casesByClient = useMemo(() => {
        if (!caseManagement) {
            return new Map<string, CaseRecord[]>();
        }
        const map = new Map<string, CaseRecord[]>();
        caseManagement.state.clients.forEach((client) => {
            const clientCases = client.caseIds
                .map((caseId) => caseManagement.state.cases.find((matter) => matter.id === caseId))
                .filter((matter): matter is CaseRecord => Boolean(matter));
            map.set(client.id, clientCases);
        });
        return map;
    }, [caseManagement]);
    const availableCases = selectedClientId ? casesByClient.get(selectedClientId) ?? [] : [];

    const selectedStateLabel = useMemo(() => {
        if (selectedState === "ALL") {
            return "All states";
        }
        return STATE_OPTIONS.find((state) => state.code === selectedState)?.name ?? selectedState;
    }, [selectedState]);

    const toggleJurisdiction = useCallback((value: string) => {
        setSelectedJurisdictions((previous) => {
            const next = new Set(previous);
            if (next.has(value)) {
                next.delete(value);
            } else {
                next.add(value);
            }
            return next;
        });
    }, []);

    const isJurisdictionSelected = useCallback(
        (value: string | undefined): boolean => {
            if (!value) {
                return false;
            }
            return selectedJurisdictions.has(value);
        },
        [selectedJurisdictions]
    );

    const handleCollectionChange = (value: string, checked: CheckedState) => {
        setSelectedCollections((previous) => {
            const next = new Set(previous);
            if (checked === true) {
                next.add(value);
            } else if (checked === false) {
                next.delete(value);
            }
            return next;
        });
    };

    useEffect(() => {
        setSelectedJurisdictions((previous) => {
            const next = new Set(previous);
            const priorState = previousSelectedStateRef.current;
            if (priorState !== "ALL") {
                for (const value of Array.from(next)) {
                    if (value.startsWith(`state:${priorState}:`)) {
                        next.delete(value);
                    }
                }
            }

            if (selectedState === "ALL") {
                (STATE_COURT_OPTIONS.ALL ?? []).forEach((option) => {
                    if (option.defaultSelected && option.value) {
                        next.add(option.value);
                    }
                });
            } else {
                (STATE_COURT_OPTIONS.ALL ?? []).forEach((option) => {
                    if (option.value) {
                        next.delete(option.value);
                    }
                });
                const stateOptions = STATE_COURT_OPTIONS[selectedState] ?? [];
                stateOptions.forEach((option) => {
                    if (option.defaultSelected && option.value) {
                        next.add(option.value);
                    }
                });
            }

            previousSelectedStateRef.current = selectedState;
            return next;
        });
    }, [selectedState]);

    const handleOpenAttachmentDialog = (result: AggregatedResult) => {
        if (!caseManagement) {
            toast.error("Case management is not available for this workspace.");
            return;
        }
        const defaultClientId =
            attachableClients.find((client) => (casesByClient.get(client.id)?.length ?? 0) > 0)?.id ?? "";
        setSelectedClientId(defaultClientId);
        if (defaultClientId) {
            const firstCase = casesByClient.get(defaultClientId)?.[0];
            setSelectedCaseIds(firstCase ? new Set([firstCase.id]) : new Set());
        } else {
            setSelectedCaseIds(new Set());
        }
        setAttachmentNotes(result.snippet ?? "");
        setResultPendingAttachment(result);
        setAttachDialogOpen(true);
    };

    const handleToggleAttachmentCase = (caseId: string, checked: boolean) => {
        setSelectedCaseIds((previous) => {
            const next = new Set(previous);
            if (checked) {
                next.add(caseId);
            } else {
                next.delete(caseId);
            }
            return next;
        });
    };

    const handleConfirmAttachment = () => {
        if (!caseManagement || !resultPendingAttachment) {
            toast.error("Unable to attach research right now.");
            return;
        }
        if (!selectedClientId) {
            toast.error("Select a client to attach this research.");
            return;
        }
        if (selectedCaseIds.size === 0) {
            toast.error("Select at least one case before attaching.");
            return;
        }

        const selectedCases = Array.from(selectedCaseIds);
        const summary =
            attachmentNotes.trim() ||
            resultPendingAttachment.snippet ||
            "Library research attached for follow-up.";
        const jurisdictionLabel = JURISDICTION_LABELS[resultPendingAttachment.jurisdiction] ?? "Mixed";
        const authorityLabel =
            resultPendingAttachment.sourceLabel ??
            COLLECTION_LABELS[resultPendingAttachment.collection] ??
            "External Source";

        try {
            caseManagement.createResearchItem({
                caseIds: selectedCases,
                title: resultPendingAttachment.title,
                issue: lastQuery ?? resultPendingAttachment.title,
                jurisdiction: jurisdictionLabel,
                status: "In Progress",
                nextAction: undefined,
                analysts: [],
                summary,
                authorities: [
                    {
                        citation: resultPendingAttachment.title,
                        court: authorityLabel,
                        holding: summary,
                    },
                ],
                tags: [resultPendingAttachment.collection, resultPendingAttachment.resourceKey]
                    .filter(Boolean)
                    .map((item) => String(item)),
            });
            toast.success("Research attached to selected case(s).");
            setAttachDialogOpen(false);
            setResultPendingAttachment(null);
            setSelectedCaseIds(new Set());
            setAttachmentNotes("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to attach research. Please try again.");
        }
    };

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            const message = "Enter a keyword, citation, or phrase to begin searching.";
            setError(message);
            setResults([]);
            setLastQuery(null);
            searchLifecycle?.onError?.({ query: null, error: message });
            return;
        }

        searchLifecycle?.onStart?.(trimmed);
        setIsSearching(true);
        setError(null);
        try {
            setAiAssistSummary(null);
            setAiAssistQuery(null);
            setAiAssistSources(null);
            setAiAssistAnswer(null);
            setAiAssistCitations(null);

            let effectiveQuery = trimmed;
            let assistWebResults: AiSearchAssistWebResult[] | null = null;
            let summaryText: string | null = null;
            let sourcesList: AiSearchAssistWebResult[] | null = null;
            let answerText: string | null = null;
            let citationsList: AiSearchAnswerCitation[] | null = null;
            let infoMessage: string | null = null;

            try {
                const assist = await requestAiSearchAssist(trimmed, researchType);
                const rewritten = assist.searchQuery?.trim();
                if (rewritten) {
                    effectiveQuery = rewritten;
                }
                const summaryValue = assist.summary?.trim() || "AI assist refined your query for better matching.";
                setAiAssistSummary(summaryValue);
                summaryText = summaryValue;
                setAiAssistQuery(effectiveQuery);
                const rawWebResults = Array.isArray(assist.webResults) ? assist.webResults : [];
                const seenUrls = new Set<string>();
                const sanitizedWebResults: SanitizedWebResult[] = rawWebResults
                    .map((result): SanitizedWebResult | null => {
                        if (
                            !result ||
                            typeof result.title !== "string" ||
                            result.title.trim().length === 0 ||
                            !isValidHttpUrl(result.url)
                        ) {
                            return null;
                        }
                        const trimmedTitle = result.title.trim();
                        const trimmedUrl = (result.url ?? "").trim();
                        if (seenUrls.has(trimmedUrl)) {
                            return null;
                        }
                        seenUrls.add(trimmedUrl);
                        return {
                            title: trimmedTitle,
                            url: trimmedUrl,
                            snippet: result.snippet?.trim() ?? null,
                            source: result.source?.trim() ?? null,
                        };
                    })
                    .filter((entry): entry is SanitizedWebResult => entry !== null);
                assistWebResults = sanitizedWebResults.length ? sanitizedWebResults : null;
                setAiAssistSources(assistWebResults);
                sourcesList = assistWebResults;
            } catch (assistError) {
                console.error(assistError);
                toast.error(
                    assistError instanceof Error ? assistError.message : "AI assist unavailable. Using original query.",
                );
                setAiAssistSources(null);
                summaryText = null;
                sourcesList = null;
                assistWebResults = null;
            }

            const jurisdictionCategories = deriveJurisdictionCategories(selectedJurisdictions);
            const collectionsCopy = new Set(selectedCollections);
            const legalFilters: LegalFilters = {
                jurisdictions: jurisdictionCategories,
                collections: collectionsCopy,
                dateRange: selectedDateRange,
                phraseBoost,
                state: selectedState,
            };

            const trimmedPhrase = phraseBoost.trim();
            const requestFilters: SearchFilters = {
                jurisdictions: Array.from(jurisdictionCategories),
                collections: Array.from(collectionsCopy),
                dateRange: selectedDateRange,
            };
            if (trimmedPhrase) {
                requestFilters.phraseBoost = trimmedPhrase;
            }
            if (selectedState !== "ALL") {
                requestFilters.state = selectedState;
            }

            const refinedQuery = effectiveQuery;
            const response = await searchDirectory(effectiveQuery, "all", Math.max(5, effectiveMaxResults), requestFilters);
            const aggregated = aggregateSearchResults(
                effectiveQuery,
                response,
                researchType,
                legalFilters,
                assistWebResults,
                effectiveMaxResults
            );
            setResults(aggregated);
            setLastQuery(effectiveQuery);
            let answerContext: AiSearchAnswerResultInput[] = [];
            const buildAnswerUrl = (item: AggregatedResult): string | null => {
                const href = typeof item.href === "string" ? item.href : null;
                if (href && isValidHttpUrl(href)) {
                    return href;
                }
                if (!item.external && href && href.startsWith("/") && typeof window !== "undefined") {
                    try {
                        return new URL(href, window.location.origin).toString();
                    } catch {
                        return null;
                    }
                }
                return null;
            };
            const eligibleAggregated = aggregated
                .map((item) => {
                    const url = buildAnswerUrl(item);
                    return { item, url };
                })
                .filter(({ item, url }) => url !== null || item.external);
            if (eligibleAggregated.length > 0) {
                answerContext = eligibleAggregated.slice(0, 8).map(({ item, url }, index) => {
                    const fallbackTitle = `Result ${index + 1}`;
                    const rawTitle = normalizeTextValue(item.title, fallbackTitle);
                    const rawSnippet = normalizeTextValue(item.snippet, "");
                    const rawSource = normalizeTextValue(
                        item.sourceLabel ?? item.resourceLabel ?? item.type,
                        fallbackTitle
                    );
                    const rawDate = normalizeTextValue(item.date ?? item.year ?? null, "");
                    return {
                        title: (rawTitle || fallbackTitle).slice(0, 400),
                        snippet: rawSnippet ? rawSnippet.slice(0, 1600) : null,
                        url,
                        source: rawSource ? rawSource.slice(0, 120) : null,
                        date: rawDate ? rawDate.slice(0, 120) : null,
                    };
                });
            } else if (assistWebResults && assistWebResults.length > 0) {
                answerContext = assistWebResults
                    .filter((source) => isValidHttpUrl(source.url))
                    .slice(0, 6)
                    .map((source, index) => {
                        const fallbackTitle = `Web ${index + 1}`;
                        const rawTitle = normalizeTextValue(source.title, fallbackTitle);
                        const rawSnippet = normalizeTextValue(source.snippet ?? null, "");
                        const rawSource = normalizeTextValue(source.source ?? null, fallbackTitle);
                        return {
                            title: (rawTitle || fallbackTitle).slice(0, 400),
                            snippet: rawSnippet ? rawSnippet.slice(0, 1600) : null,
                            url: source.url ?? null,
                            source: rawSource ? rawSource.slice(0, 120) : null,
                            date: null,
                        };
                    });
            }

            let answerGenerated = false;
            if (answerContext.length > 0) {
                try {
                    const answer = await requestAiSearchAnswer(effectiveQuery, researchType, answerContext);
                    answerText = answer.answer;
                    citationsList = answer.citations.length ? answer.citations : null;
                    setAiAssistAnswer(answerText);
                    setAiAssistCitations(citationsList);
                    answerGenerated = true;
                } catch (answerError) {
                    console.error(answerError);
                    toast.error(
                        answerError instanceof Error ? answerError.message : "AI answer unavailable. Showing results only."
                    );
                    setAiAssistAnswer(null);
                    setAiAssistCitations(null);
                    answerText = null;
                    citationsList = null;
                }
            } else {
                setAiAssistAnswer(null);
                setAiAssistCitations(null);
                answerText = null;
                citationsList = null;
            }

            if (aggregated.length === 0) {
                if (answerGenerated) {
                    const message =
                        "No direct database matches were found. Review the AI synthesis above and check connector credentials or filters.";
                    setError(message);
                    infoMessage = message;
                } else {
                    const message = "No matches found. Try refining your keywords or adjusting filters.";
                    setError(message);
                    infoMessage = message;
                }
            } else {
                infoMessage = null;
            }

            searchLifecycle?.onSuccess?.({
                originalQuery: trimmed,
                effectiveQuery: refinedQuery,
                results: aggregated,
                aiAnswer: answerText,
                aiSummary: summaryText,
                aiCitations: citationsList,
                aiSources: sourcesList,
                infoMessage,
            });
        } catch (searchError) {
            console.error(searchError);
            const message = searchError instanceof Error ? searchError.message : "Search failed. Please try again.";
            setError(message);
            setResults([]);
            setLastQuery(null);
            searchLifecycle?.onError?.({ query: trimmed, error: message });
        } finally {
            setIsSearching(false);
        }
    }

    return (
        <div className={formWrapperClassName}>
            <form className={formClassName} noValidate onSubmit={handleSubmit}>
                {shouldShowHeaderBlock ? (
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        {showHeader && (resolvedHeading || resolvedDescription) ? (
                            <div className="space-y-1">
                                {resolvedHeading ? (
                                    <h2 className="text-2xl font-semibold text-slate-900">{resolvedHeading}</h2>
                                ) : null}
                                {resolvedDescription ? (
                                    <p className="text-sm text-slate-500">{resolvedDescription}</p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className={queryShellClassName}>
                    <div className={cn("flex items-start gap-4", isSidebar && "gap-3") }>
                        {!isSidebar ? (
                            <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-md sm:flex">
                                <Sparkles className="h-5 w-5" />
                            </div>
                        ) : null}
                        <div className="flex-1 space-y-4">
                            <Textarea
                                id="library-keywords"
                                placeholder='Ask anything across cases, statutes, and knowledge—e.g. "How does Washington define duty of care for transitional housing programs?"'
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                className={textareaClassName}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAdvancedOpen((previous) => !previous)}
                                    className={cn(
                                        "inline-flex items-center gap-2 text-xs font-medium transition",
                                        isSidebar ? "text-emerald-700 hover:text-emerald-900" : "text-emerald-100 hover:text-white"
                                    )}
                                >
                                    <ChevronDown
                                        className={cn(
                                            "h-4 w-4 transition-transform",
                                            isAdvancedOpen ? "rotate-180" : "rotate-0"
                                        )}
                                    />
                                    {isAdvancedOpen ? "Hide advanced filters" : "Advanced filters"}
                                </button>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            "hidden text-[11px] uppercase tracking-wide sm:inline",
                                            isSidebar ? "text-emerald-600" : "text-emerald-200"
                                        )}
                                    >
                                        Press ⏎ to send
                                    </span>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className={cn("bg-emerald-500 text-white hover:bg-emerald-400", isSidebar && "px-6")}
                                        disabled={isSearching}
                                    >
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Synthesizing
                                            </>
                                        ) : (
                                            "Ask Life-AI"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="w-full">
                    <CollapsibleContent className={advancedContentClassName}>
                        <div className={advancedLayoutClassName}>
                            <section className={advancedSectionClassName}>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Federal courts</Label>
                                    <JurisdictionMultiSelect
                                        triggerLabel="Select federal courts"
                                        options={FEDERAL_JURISDICTIONS}
                                        selectedValues={selectedJurisdictions}
                                        onToggle={toggleJurisdiction}
                                        isSelected={isJurisdictionSelected}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Administrative &amp; international</Label>
                                    <JurisdictionMultiSelect
                                        triggerLabel="Select agencies"
                                        options={AGENCY_JURISDICTIONS}
                                        selectedValues={selectedJurisdictions}
                                        onToggle={toggleJurisdiction}
                                        isSelected={isJurisdictionSelected}
                                        emptyMessage="Select a scope to focus on agency materials."
                                    />
                                </div>
                            </section>
                            <section className={advancedSectionClassName}>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Collections</Label>
                                    <div className="space-y-1.5">
                                        {legalCollections.map((collection) => {
                                            const inputId = `collection-${collection.value}`;
                                            return (
                                                <label key={collection.value} className={checkboxRowClassName}>
                                                    <Checkbox
                                                        id={inputId}
                                                        checked={selectedCollections.has(collection.value)}
                                                        onCheckedChange={(checked) => handleCollectionChange(collection.value, checked)}
                                                    />
                                                    <span>{collection.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">State focus</Label>
                                    <Select value={selectedState} onValueChange={setSelectedState}>
                                        <SelectTrigger className={isSidebar ? "bg-white" : undefined}>
                                            <SelectValue placeholder="All states" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All states</SelectItem>
                                            {STATE_OPTIONS.map((state) => (
                                                <SelectItem key={state.code} value={state.code}>
                                                    {state.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">State courts</Label>
                                        <JurisdictionMultiSelect
                                            triggerLabel={
                                                selectedState === "ALL"
                                                    ? "Select state courts"
                                                    : `${selectedStateLabel} courts`
                                            }
                                            options={
                                                selectedState === "ALL"
                                                    ? (STATE_COURT_OPTIONS.ALL ?? [])
                                                    : (STATE_COURT_OPTIONS[selectedState] ?? [])
                                            }
                                            selectedValues={selectedJurisdictions}
                                            onToggle={toggleJurisdiction}
                                            isSelected={isJurisdictionSelected}
                                            emptyMessage="Select a state to refine court targets."
                                        />
                                    </div>
                                </div>
                            </section>
                            <section className={advancedSectionClassName}>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Date range</Label>
                                    <Select value={selectedDateRange} onValueChange={(value) => setSelectedDateRange(value as LegalFilters["dateRange"])}>
                                        <SelectTrigger className={isSidebar ? "bg-white" : undefined}>
                                            <SelectValue placeholder="Any time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any time</SelectItem>
                                            <SelectItem value="5y">Last 5 years</SelectItem>
                                            <SelectItem value="2y">Last 2 years</SelectItem>
                                            <SelectItem value="1y">Last 12 months</SelectItem>
                                            <SelectItem value="90d">Last 90 days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Phrase boost</Label>
                                    <Textarea
                                        rows={4}
                                        placeholder='Use a key phrase we should match, e.g. "foreseeable harm in transitional housing"'
                                        value={phraseBoost}
                                        onChange={(event) => setPhraseBoost(event.target.value)}
                                        className={isSidebar ? "min-h-[90px] resize-none rounded-lg border border-slate-200 bg-white/95 p-3" : undefined}
                                    />
                                </div>
                            </section>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {isSearching && !aiAssistAnswer && !aiAssistSummary ? (
                    <div className={cn(
                        "mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800",
                        isSidebar && "rounded-xl"
                    )}>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating a cross-source synthesis…</span>
                    </div>
                ) : null}

                {shouldRenderInlineResults ? (
                    <>
                        {(aiAssistAnswer || aiAssistSummary || (aiAssistSources && aiAssistSources.length > 0)) ? (
                            <div className={synthesisContainerClassName}>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        {aiAssistAnswer ? (
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">AI synthesis</p>
                                                <p className="whitespace-pre-wrap leading-relaxed">{aiAssistAnswer}</p>
                                                {aiAssistCitations ? (
                                                    <ul className="space-y-1 text-xs text-emerald-700">
                                                        {aiAssistCitations.map((citation) => (
                                                            <li key={`citation-${citation.ref}`}>
                                                                [{citation.ref}] {citation.label}
                                                                {citation.url ? (
                                                                    <>
                                                                        {" "}
                                                                        <Link
                                                                            href={citation.url}
                                                                            className="text-emerald-600 underline"
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                        >
                                                                            {citation.url}
                                                                        </Link>
                                                                    </>
                                                                ) : null}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : null}
                                            </div>
                                        ) : null}
                                        {aiAssistSummary ? <p className="text-sm leading-relaxed text-slate-600">{aiAssistSummary}</p> : null}
                                        {aiAssistQuery ? (
                                            <p className="text-xs text-slate-500">
                                                Refined query: <span className="font-medium text-slate-700">{aiAssistQuery}</span>
                                            </p>
                                        ) : null}
                                        {aiAssistSources && aiAssistSources.length > 0 ? (
                                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Source highlights</p>
                                                <ul className="mt-2 space-y-1 text-xs text-emerald-800">
                                                    {aiAssistSources.map((source, index) => (
                                                        <li key={`${source.title}-${index}`}>
                                                            [{index + 1}] {source.title}
                                                            {source.url ? (
                                                                <>
                                                                    {" "}
                                                                    <Link
                                                                        href={source.url}
                                                                        className="text-emerald-600 underline"
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        {source.url}
                                                                    </Link>
                                                                </>
                                                            ) : null}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <section aria-live="polite" className="mt-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">Top matches</h3>
                        {lastQuery ? (
                            <span className="text-xs text-slate-500">
                                Showing {results.length} blended results for “{lastQuery}”
                            </span>
                        ) : (
                            <span className="text-xs text-slate-500">Ask a question to surface sources instantly.</span>
                        )}
                    </div>

                    {error ? <p className={errorCalloutClassName}>{error}</p> : null}

                    {results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((result) => {
                                const formattedDate = formatResultDate(result.date ?? null);
                                const matchQuality = Math.round(result.score * 100);
                                return (
                                    <div
                                        key={result.id}
                                        className={resultCardClassName}
                                    >
                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-tight text-slate-500">
                                                    <Badge variant="outline">{result.sourceLabel ?? result.type}</Badge>
                                                    <Badge variant="secondary">{COLLECTION_LABELS[result.collection]}</Badge>
                                                    <Badge variant="secondary">{JURISDICTION_LABELS[result.jurisdiction]}</Badge>
                                                    <Badge variant="outline">{matchQuality}% match</Badge>
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
                                                    {result.year && (!formattedDate || !formattedDate.includes(result.year)) ? (
                                                        <span>{result.year}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
                                                {caseManagement && attachableClients.length ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full min-w-[140px] text-xs text-slate-700 sm:w-auto"
                                                        onClick={() => handleOpenAttachmentDialog(result)}
                                                    >
                                                        Attach to case
                                                    </Button>
                                                ) : null}
                                                <Link
                                                    href={result.href}
                                                    target={result.external ? "_blank" : undefined}
                                                    rel={result.external ? "noopener noreferrer" : undefined}
                                                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                                                >
                                                    View source
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : lastQuery && !isSearching ? (
                        <p className={emptyStateClassName}>
                            No direct matches found. Try broadening your language or adjusting filters.
                        </p>
                    ) : null}
                        </section>
                    </>
                ) : (
                    <div className="mt-6 space-y-3">
                        {error ? <p className={errorCalloutClassName}>{error}</p> : null}
                        {lastQuery ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800">
                                Delivering AI synthesis and {results.length} blended {results.length === 1 ? "result" : "results"} to the main workspace. Review the center panel for full answers and source breakdowns.
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                Submit a query to populate the main workspace with AI synthesis and prioritized legal authorities.
                            </p>
                        )}
                    </div>
                )}
            </form>
            {caseManagement && (
                <Dialog
                    open={attachDialogOpen}
                    onOpenChange={(open) => {
                        setAttachDialogOpen(open);
                        if (!open) {
                            setResultPendingAttachment(null);
                            setSelectedCaseIds(new Set());
                            setAttachmentNotes("");
                            setSelectedClientId("");
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Attach research to case</DialogTitle>
                            <DialogDescription>
                                Choose a client and matter to link this library finding. The research will appear in the case analysis workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Client</Label>
                                <Select
                                    value={selectedClientId}
                                    onValueChange={(value) => {
                                        setSelectedClientId(value);
                                        if (value) {
                                            const nextCases = casesByClient.get(value) ?? [];
                                            setSelectedCaseIds(nextCases.length ? new Set([nextCases[0].id]) : new Set());
                                        } else {
                                            setSelectedCaseIds(new Set());
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {attachableClients.length ? (
                                            attachableClients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="" disabled>
                                                No clients available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Matters</Label>
                                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
                                    {selectedClientId ? (
                                        availableCases.length ? (
                                            availableCases.map((matter) => {
                                                const checked = selectedCaseIds.has(matter.id);
                                                return (
                                                    <label
                                                        key={matter.id}
                                                        className="flex cursor-pointer items-start gap-2 rounded-md bg-white/80 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                                                    >
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={(value) =>
                                                                handleToggleAttachmentCase(matter.id, value === true)
                                                            }
                                                        />
                                                        <span>
                                                            <span className="block font-medium text-slate-800">{matter.caseName}</span>
                                                            <span className="text-xs text-slate-500">Lead: {matter.leadAttorney}</span>
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-slate-500">No matters found for this client yet.</p>
                                        )
                                    ) : (
                                        <p className="text-sm text-slate-500">Select a client to see available matters.</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attachment-notes">Notes (optional)</Label>
                                <Textarea
                                    id="attachment-notes"
                                    rows={3}
                                    value={attachmentNotes}
                                    onChange={(event) => setAttachmentNotes(event.target.value)}
                                    placeholder="Summarize why this source matters or next steps for the team."
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => {
                                setAttachDialogOpen(false);
                                setResultPendingAttachment(null);
                                setSelectedCaseIds(new Set());
                                setAttachmentNotes("");
                            }}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleConfirmAttachment} disabled={!resultPendingAttachment}>
                                Attach research
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
