'use client';

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { searchDirectory, type SearchResponse, type SearchFilters } from "@/lib/search/client";
import { formatOpinionTitle } from "@/lib/courtlistener/format";

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
import { Input } from "./input";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Textarea } from "./textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "./command";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useOptionalCaseManagement, type CaseRecord } from "@/components/case-management/CaseManagementProvider";
import { Switch } from "./switch";
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

type AggregatedResult = {
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

const academicDisciplines = [
    { value: "law", label: "Law & Legal Studies" },
    { value: "business", label: "Business & Management" },
    { value: "social-sciences", label: "Social Sciences" },
    { value: "stem", label: "STEM" },
    { value: "humanities", label: "Humanities" },
];

const academicSources = [
    { value: "journals", label: "Peer-reviewed journals", defaultChecked: true },
    { value: "treatises", label: "Treatises & books" },
    { value: "news", label: "News & commentary" },
    { value: "working", label: "Working papers & preprints" },
];

const aiScopes = [
    { value: "legal", label: "Legal databases" },
    { value: "academic", label: "Academic publications" },
    { value: "news", label: "News & current awareness" },
    { value: "knowledge", label: "Internal knowledge base" },
];

const aiOutputStyles = [
    { value: "brief", label: "Briefing note (concise)" },
    { value: "memo", label: "Research memo (detailed)" },
    { value: "strategy", label: "Strategy outline (actionable)" },
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

const LEGAL_RESOURCE_PAGE_SIZE = 5;

const COLLECTION_LABELS: Record<AggregatedResult["collection"], string> = {
    "primary-law": "Primary Law",
    secondary: "Secondary Sources",
    litigation: "Litigation & Dockets",
    knowledge: "Knowledge Base",
    internet: "Live Web",
};

const JURISDICTION_LABELS: Record<AggregatedResult["jurisdiction"], string> = {
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

function formatResultDate(dateString: string | null | undefined): string | null {
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
    webResults?: AiSearchAssistWebResult[] | null
): AggregatedResult[] {
    const results: AggregatedResult[] = [];
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
    const minimumTokenMatches =
        !isLegal || meaningfulTokens.length === 0
            ? 0
            : meaningfulTokens.length <= 2
                ? meaningfulTokens.length
                : Math.min(4, Math.max(1, Math.ceil(meaningfulTokens.length * 0.5)));

    const shouldIncludeCollection = (collection: AggregatedResult["collection"]) =>
        !isLegal || activeCollections.has(collection);
    const shouldIncludeJurisdiction = (jurisdiction: AggregatedResult["jurisdiction"]) =>
        !isLegal ||
        activeJurisdictions.size === 0 ||
        activeJurisdictions.has(jurisdiction) ||
        (jurisdiction === "mixed" && (activeJurisdictions.has("mixed") || activeJurisdictions.size >= 3));

    const maybeBoostScore = (item: AggregatedResult) => {
        if (!phrase) {
            return;
        }
        const haystack = `${item.title} ${item.snippet}`.toLowerCase();
        if (haystack.includes(phrase)) {
            item.score = Math.min(1, item.score + 0.12);
        }
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
        if (isLegal && !shouldIncludeCollection(item.collection)) {
            return;
        }
        if (isLegal && !shouldIncludeJurisdiction(item.jurisdiction)) {
            return;
        }
        if (isLegal && !isWithinDateRange(item.date, dateRange)) {
            return;
        }
        if (stateFilter && item.jurisdiction === "state") {
            if (!item.stateCode || item.stateCode.toUpperCase() !== stateFilter) {
                return;
            }
        }
        if (minimumTokenMatches > 0) {
            const haystack = `${item.title} ${item.snippet ?? ""} ${item.snippetHtml ?? ""}`;
            if (!meetsTokenThreshold(haystack, meaningfulTokens, minimumTokenMatches)) {
                return;
            }
        }
        const normalizedResourceLabel = (item.resourceLabel ?? item.sourceLabel ?? item.type).slice(0, 160);
        const normalizedSourceLabel = (item.sourceLabel ?? normalizedResourceLabel).slice(0, 120);
        item.resourceLabel = normalizedResourceLabel;
        item.sourceLabel = normalizedSourceLabel;
        maybeBoostScore(item);
        results.push(item);
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

    const maxResults = researchType === "legal" ? 60 : 10;

    return results
        .sort((a, b) => {
            const priorityDiff = getPriority(a, researchType) - getPriority(b, researchType);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return b.score - a.score;
        })
        .slice(0, maxResults);
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

export function LibSearchBar() {
    const [researchType, setResearchType] = useState<ResearchType>("legal");
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
    const [resourcePages, setResourcePages] = useState<Record<string, number>>({});
    const [aiAssistEnabled, setAiAssistEnabled] = useState(false);
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

    const legalResourceBuckets = useMemo(() => {
        if (researchType !== "legal") {
            return [];
        }
        const map = new Map<
            string,
            {
                key: string;
                label: string;
                results: AggregatedResult[];
            }
        >();
        for (const entry of results) {
            const key = entry.resourceKey ?? "misc";
            const existing = map.get(key);
            if (existing) {
                existing.results.push(entry);
            } else {
                map.set(key, {
                    key,
                    label: entry.resourceLabel ?? entry.sourceLabel ?? entry.type,
                    results: [entry],
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => {
            const priorityA = LEGAL_RESOURCE_PRIORITY[a.key] ?? 99;
            const priorityB = LEGAL_RESOURCE_PRIORITY[b.key] ?? 99;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return a.label.localeCompare(b.label);
        });
    }, [results, researchType]);

    useEffect(() => {
        setResourcePages({});
    }, [results, researchType]);

    useEffect(() => {
        if (researchType !== "legal") {
            setIsAdvancedOpen(false);
        }
    }, [researchType]);

    useEffect(() => {
        if (!aiAssistEnabled) {
            setAiAssistSummary(null);
            setAiAssistQuery(null);
            setAiAssistSources(null);
            setAiAssistAnswer(null);
            setAiAssistCitations(null);
        }
    }, [aiAssistEnabled]);

    const handleNextPage = (resourceKey: string, label: string, totalCount: number) => {
        const current = resourcePages[resourceKey] ?? 0;
        const currentCount = Math.min((current + 1) * LEGAL_RESOURCE_PAGE_SIZE, totalCount);
        if (currentCount >= totalCount) {
            toast.info(`No additional ${label} results available.`);
            return;
        }
        const next = current + 1;
        const nextCount = Math.min((next + 1) * LEGAL_RESOURCE_PAGE_SIZE, totalCount);
        setResourcePages((previous) => ({
            ...previous,
            [resourceKey]: next,
        }));
        toast.info(`Loaded more ${label} results`, {
            description: `Showing results ${currentCount + 1}–${nextCount} of ${totalCount}.`,
        });
    };

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            setError("Enter a keyword, citation, or phrase to begin searching.");
            setResults([]);
            setLastQuery(null);
            return;
        }

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
            if (aiAssistEnabled) {
                try {
                    const assist = await requestAiSearchAssist(trimmed, researchType);
                    const rewritten = assist.searchQuery?.trim();
                    if (rewritten) {
                        effectiveQuery = rewritten;
                    }
                    setAiAssistSummary(
                        assist.summary?.trim() || "AI assist refined your query for better matching.",
                    );
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
                } catch (assistError) {
                    console.error(assistError);
                    toast.error(
                        assistError instanceof Error ? assistError.message : "AI assist unavailable. Using original query.",
                    );
                    setAiAssistSources(null);
                    assistWebResults = null;
                }
            }

            const searchMode = researchType === "legal" ? "legal" : "all";
            let legalFilters: LegalFilters | undefined;
            let requestFilters: SearchFilters | undefined;

            if (researchType === "legal") {
                const jurisdictionCategories = deriveJurisdictionCategories(selectedJurisdictions);
                const collectionsCopy = new Set(selectedCollections);
                legalFilters = {
                    jurisdictions: jurisdictionCategories,
                    collections: collectionsCopy,
                    dateRange: selectedDateRange,
                    phraseBoost,
                    state: selectedState,
                };

                const trimmedPhrase = phraseBoost.trim();
                requestFilters = {
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
            }

            const perSourceLimit = researchType === "legal" ? 25 : 10;
            const response = await searchDirectory(effectiveQuery, searchMode, perSourceLimit, requestFilters);
            const aggregated = aggregateSearchResults(effectiveQuery, response, researchType, legalFilters, assistWebResults);
            setResults(aggregated);
            setLastQuery(effectiveQuery);
            let answerContext: AiSearchAnswerResultInput[] = [];
            if (aiAssistEnabled) {
                const eligibleAggregated = aggregated.filter((item) => item.external && isValidHttpUrl(item.href));
                if (eligibleAggregated.length > 0) {
                    answerContext = eligibleAggregated.slice(0, 8).map((item, index) => ({
                        title: item.title.slice(0, 400),
                        snippet: item.snippet?.slice(0, 1600) ?? null,
                        url: item.href,
                        source: (item.sourceLabel ?? item.resourceLabel ?? item.type ?? `Result ${index + 1}`).slice(0, 120),
                        date: item.date ?? item.year ?? null,
                    }));
                } else if (assistWebResults && assistWebResults.length > 0) {
                    answerContext = assistWebResults
                        .filter((source) => isValidHttpUrl(source.url))
                        .slice(0, 6)
                        .map((source, index) => ({
                            title: source.title.slice(0, 400),
                            snippet: source.snippet?.slice(0, 1600) ?? null,
                            url: source.url ?? null,
                            source: (source.source ?? `Web ${index + 1}`).slice(0, 120),
                            date: null,
                        }));
                }
            }

            let answerGenerated = false;
            if (aiAssistEnabled && answerContext.length > 0) {
                try {
                    const answer = await requestAiSearchAnswer(trimmed, researchType, answerContext);
                    setAiAssistAnswer(answer.answer);
                    setAiAssistCitations(answer.citations.length ? answer.citations : null);
                    answerGenerated = true;
                } catch (answerError) {
                    console.error(answerError);
                    toast.error(
                        answerError instanceof Error ? answerError.message : "AI answer unavailable. Showing results only."
                    );
                    setAiAssistAnswer(null);
                    setAiAssistCitations(null);
                }
            } else {
                setAiAssistAnswer(null);
                setAiAssistCitations(null);
            }

            if (aggregated.length === 0) {
                if (answerGenerated) {
                    setError(
                        "No direct database matches were found. Review the AI synthesis above and check connector credentials or filters."
                    );
                } else {
                    setError("No matches found. Try refining your keywords or adjusting filters.");
                }
            }
        } catch (searchError) {
            console.error(searchError);
            setError(searchError instanceof Error ? searchError.message : "Search failed. Please try again.");
            setResults([]);
            setLastQuery(null);
        } finally {
            setIsSearching(false);
        }
    }

    return (
        <div className="flex w-full justify-center">
            <form
                className="flex w-full max-w-6xl flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
                noValidate
                onSubmit={handleSubmit}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold text-slate-900">Unified Research</h2>
                        <p className="text-sm text-slate-500">
                            Switch between legal, academic, and synthesis modes without losing context. Results appear below the form.
                        </p>
                    </div>

                    <RadioGroup
                        value={researchType}
                        onValueChange={(value) => setResearchType(value as ResearchType)}
                        className="flex flex-col gap-2 md:flex-row"
                        aria-label="Research type"
                    >
                        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                            <RadioGroupItem id="research-type-legal" value="legal" />
                            <Label htmlFor="research-type-legal" className="text-sm text-slate-700">
                                Legal research
                            </Label>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                            <RadioGroupItem id="research-type-academic" value="academic" />
                            <Label htmlFor="research-type-academic" className="text-sm text-slate-700">
                                Academic research
                            </Label>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                            <RadioGroupItem id="research-type-ai" value="ai" />
                            <Label htmlFor="research-type-ai" className="text-sm text-slate-700">
                                AI synthesis (beta)
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Switch
                            id="ai-assist-toggle"
                            checked={aiAssistEnabled}
                            onCheckedChange={(checked) => {
                                const next = !!checked;
                                setAiAssistEnabled(next);
                                if (!next) {
                                    setAiAssistSummary(null);
                                    setAiAssistQuery(null);
                                    setAiAssistSources(null);
                                    setAiAssistAnswer(null);
                                    setAiAssistCitations(null);
                                }
                            }}
                        />
                        <Label htmlFor="ai-assist-toggle" className="text-sm text-slate-700">
                            Natural language AI assist
                        </Label>
                        <Badge variant="outline" className="text-[10px] uppercase text-emerald-700">
                            Beta
                        </Badge>
                        <span className="text-xs text-slate-500">Use Groq to rewrite complex questions into precise queries.</span>
                    </div>
                    {aiAssistEnabled && (aiAssistSummary || aiAssistAnswer) ? (
                        <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900">
                            <Sparkles className="mt-0.5 h-4 w-4" />
                            <div className="space-y-2">
                                {aiAssistAnswer ? (
                                    <div className="space-y-2">
                                        <p className="font-semibold uppercase tracking-wide text-emerald-700">
                                            AI research answer
                                        </p>
                                        <p>{aiAssistAnswer}</p>
                                        {aiAssistCitations ? (
                                            <ul className="list-inside list-disc text-xs text-emerald-800">
                                                {aiAssistCitations.map((citation) => (
                                                    <li key={`citation-${citation.ref}`}>
                                                        [${citation.ref}] {citation.label}
                                                        {citation.url ? (
                                                            <>
                                                                {" "}
                                                                <Link
                                                                    href={citation.url}
                                                                    className="text-emerald-700 underline"
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
                                {aiAssistSummary ? <p>{aiAssistSummary}</p> : null}
                                {aiAssistQuery ? (
                                    <p className="text-xs text-emerald-800">
                                        Query used: <span className="font-semibold">{aiAssistQuery}</span>
                                    </p>
                                ) : null}
                                {aiAssistSources && aiAssistSources.length > 0 ? (
                                    <div className="rounded-md border border-emerald-200 bg-white/80 px-2 py-2 text-xs text-emerald-900">
                                        <p className="font-semibold uppercase tracking-wide text-emerald-700">Live sources</p>
                                        <ul className="mt-1 space-y-1">
                                            {aiAssistSources.map((source, index) => (
                                                <li key={`${source.title}-${index}`}>
                                                    [{index + 1}] {source.title}
                                                    {source.url ? (
                                                        <>
                                                            {" "}
                                                            <Link
                                                                href={source.url}
                                                                className="text-emerald-700 underline"
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
                    ) : null}
                </div>

                {researchType === "legal" ? (
                    <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="space-y-4">
                        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Advanced search</p>
                                <p className="text-xs text-slate-500">
                                    Narrow by jurisdiction, collection, date range, and phrase boosts. Defaults target primary federal and state sources.
                                </p>
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 inline-flex items-center gap-2 transition md:mt-0 data-[state=open]:bg-slate-900 data-[state=open]:text-white"
                                >
                                    <span>{isAdvancedOpen ? "Hide filters" : "Show filters"}</span>
                                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="grid gap-6 lg:grid-cols-3">
                                <section className="space-y-4">
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
                                            triggerLabel="Select tribunals"
                                            options={AGENCY_JURISDICTIONS}
                                            selectedValues={selectedJurisdictions}
                                            onToggle={toggleJurisdiction}
                                            isSelected={isJurisdictionSelected}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-700">Collections</p>
                                        <div className="space-y-2">
                                            {legalCollections.map((collection) => {
                                                const inputId = `collection-${collection.value}`;
                                                return (
                                                    <div key={collection.value} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={inputId}
                                                            checked={selectedCollections.has(collection.value)}
                                                            onCheckedChange={(checked) => handleCollectionChange(collection.value, checked)}
                                                        />
                                                        <Label htmlFor={inputId} className="text-sm text-slate-700">
                                                            {collection.label}
                                                        </Label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">State focus</Label>
                                    <Select value={selectedState} onValueChange={setSelectedState}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a state" />
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
                                    <JurisdictionMultiSelect
                                        triggerLabel={
                                            selectedState === "ALL"
                                                ? "State courts"
                                                : `${selectedStateLabel} courts`
                                        }
                                        options={selectedState === "ALL" ? STATE_COURT_OPTIONS.ALL ?? [] : STATE_COURT_OPTIONS[selectedState] ?? []}
                                        selectedValues={selectedJurisdictions}
                                        onToggle={toggleJurisdiction}
                                        isSelected={isJurisdictionSelected}
                                        emptyMessage="Select a state to refine court targets."
                                    />
                                </section>

                                <section className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">Date range</Label>
                                    <Select
                                        value={selectedDateRange}
                                        onValueChange={(value) => setSelectedDateRange(value as LegalFilters["dateRange"])}
                                    >
                                        <SelectTrigger>
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
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Phrase boost</Label>
                                        <p className="text-xs text-slate-500">
                                            Highlight the core issue you&apos;re investigating. We&apos;ll use it to suggest stronger matches.
                                        </p>
                                        <Textarea
                                            rows={5}
                                            placeholder='e.g. "foreseeable harm in transitional housing"'
                                            value={phraseBoost}
                                            onChange={(event) => setPhraseBoost(event.target.value)}
                                        />
                                    </div>
                                </section>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ) : null}

                <div className="space-y-3">
                    <Label htmlFor="library-keywords" className="text-sm font-semibold text-slate-700">
                        Keyword or citation
                    </Label>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        <Input
                            id="library-keywords"
                            type="search"
                            placeholder='e.g. duty of care "negligence" /s foreseeability'
                            className="h-12 flex-1 text-base md:text-lg"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        <Button type="submit" className="h-12 md:px-8" disabled={isSearching}>
                            {isSearching
                                ? "Searching..."
                                : researchType === "legal"
                                    ? "Search Library"
                                    : researchType === "academic"
                                        ? "Search Academic"
                                        : "Run AI Research"}
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                        {researchType === "legal"
                            ? "Use connectors like AND, OR, /s, and /p to shape precise legal searches."
                            : researchType === "academic"
                                ? "Combine keywords with filters to surface journals, books, and working papers."
                                : "The assistant will unify legal, academic, and news sources for a single narrative output."}
                    </p>
                </div>


                {researchType === "academic" && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <section className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700">Discipline</Label>
                            <Select defaultValue="law">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select discipline" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicDisciplines.map((discipline) => (
                                        <SelectItem key={discipline.value} value={discipline.value}>
                                            {discipline.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </section>
                        <section className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700">Sources</Label>
                            <div className="space-y-2">
                                {academicSources.map((source) => {
                                    const inputId = `academic-${source.value}`;
                                    return (
                                        <div key={source.value} className="flex items-center gap-2">
                                            <Checkbox id={inputId} defaultChecked={source.defaultChecked} />
                                            <Label htmlFor={inputId} className="text-sm text-slate-700">
                                                {source.label}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                        <section className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700">Notes</Label>
                            <Textarea rows={5} placeholder="Capture focus questions, jurisdictions, or populations of interest" />
                        </section>
                    </div>
                )}

                {researchType === "ai" && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700">AI scope</Label>
                            <Select defaultValue="legal">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select scope" />
                                </SelectTrigger>
                                <SelectContent>
                                    {aiScopes.map((scope) => (
                                        <SelectItem key={scope.value} value={scope.value}>
                                            {scope.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </section>
                        <section className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700">Output style</Label>
                            <Select defaultValue="brief">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select output style" />
                                </SelectTrigger>
                                <SelectContent>
                                    {aiOutputStyles.map((style) => (
                                        <SelectItem key={style.value} value={style.value}>
                                            {style.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Textarea rows={5} placeholder="Add instructions or goals for the AI synopsis" />
                        </section>
                    </div>
                )}

                <section aria-live="polite" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Search results</h3>
                        {lastQuery ? (
                            <span className="text-xs text-slate-500">
                                {researchType === "legal"
                                    ? `Showing up to ${LEGAL_RESOURCE_PAGE_SIZE} results per resource for “${lastQuery}”`
                                    : `Showing up to 10 matches for “${lastQuery}”`}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-500">Enter a query to view matching resources</span>
                        )}
                    </div>

                    {error ? (
                        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                            {error}
                        </p>
                    ) : null}

                    {results.length > 0 ? (
                        researchType === "legal" ? (
                            legalResourceBuckets.length > 0 ? (
                                <Accordion type="multiple" className="space-y-3">
                                    {legalResourceBuckets.map((bucket) => {
                                        const currentPage = resourcePages[bucket.key] ?? 0;
                                        const visibleCount = Math.min(
                                            bucket.results.length,
                                            (currentPage + 1) * LEGAL_RESOURCE_PAGE_SIZE
                                        );
                                        const visibleResults = bucket.results.slice(0, visibleCount);
                                        const hasMore = visibleCount < bucket.results.length;
                                        return (
                                            <AccordionItem
                                                key={bucket.key}
                                                value={bucket.key}
                                                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                                            >
                                                <AccordionTrigger className="px-4 py-3 text-base font-semibold text-slate-900">
                                                    <div className="flex w-full items-center justify-between gap-4">
                                                        <span>{bucket.label}</span>
                                                        <span className="text-xs font-normal text-slate-500">
                                                            {visibleCount} of {bucket.results.length}
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-3 px-4 pb-4">
                                                    {visibleResults.map((result) => {
                                                        const formattedDate = formatResultDate(result.date ?? null);
                                                        const matchQuality = Math.round(result.score * 100);
                                                        return (
                                                            <div
                                                                key={result.id}
                                                                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
                                                            >
                                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                                    <div className="space-y-2">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <Badge variant="outline">
                                                                                {result.sourceLabel ?? bucket.label}
                                                                            </Badge>
                                                                            <Badge variant="secondary">
                                                                                {COLLECTION_LABELS[result.collection]}
                                                                            </Badge>
                                                                            <Badge variant="secondary">
                                                                                {JURISDICTION_LABELS[result.jurisdiction]}
                                                                            </Badge>
                                                                            <Badge variant="outline">{matchQuality}% match</Badge>
                                                                        </div>
                                                                        <h5 className="text-base font-semibold text-slate-900">
                                                                            {result.title}
                                                                        </h5>
                                                                        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
                                                                            {formattedDate ? <span>{formattedDate}</span> : null}
                                                                            {result.year && (!formattedDate || !formattedDate.includes(result.year)) ? (
                                                                                <span>{result.year}</span>
                                                                            ) : null}
                                                                        </div>
                                                                        {result.snippetHtml ? (
                                                                            <p
                                                                                className="text-sm leading-relaxed text-slate-600"
                                                                                dangerouslySetInnerHTML={{ __html: result.snippetHtml }}
                                                                            />
                                                                        ) : (
                                                                            <p className="text-sm leading-relaxed text-slate-600">{result.snippet}</p>
                                                                        )}
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
                                                                            View document
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {hasMore ? (
                                                        <div className="pt-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="inline-flex items-center gap-2"
                                                                onClick={() =>
                                                                    handleNextPage(bucket.key, bucket.label, bucket.results.length)
                                                                }
                                                            >
                                                                Next
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : null}
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            ) : (
                                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                    No legal resources matched your filters. Try broadening the jurisdiction or collections.
                                </p>
                            )
                        ) : (
                            <div className="space-y-4">
                                {results.map((result) => (
                                    <div
                                        key={result.id}
                                        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline">{result.sourceLabel ?? result.type}</Badge>
                                                <Badge variant="secondary">
                                                    {Math.round(result.score * 100)}% match quality
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {caseManagement && attachableClients.length ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs text-slate-700"
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
                                                    Open {result.external ? "source" : "in Life-AI"}
                                                </Link>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-semibold text-slate-900">{result.title}</h4>
                                            {result.snippetHtml ? (
                                                <p
                                                    className="text-sm leading-relaxed text-slate-600"
                                                    dangerouslySetInnerHTML={{ __html: result.snippetHtml }}
                                                />
                                            ) : (
                                                <p className="text-sm text-slate-600">{result.snippet}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : !error && lastQuery ? (
                        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            No matches yet—try a different keyword or broaden your filters.
                        </p>
                    ) : null}
                </section>
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
