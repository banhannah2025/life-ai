'use client';

import { useState } from "react";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";

type ResearchType = "legal" | "academic" | "ai";

const legalJurisdictionGroups = [
    {
        label: "Federal Courts",
        options: [
            { value: "us-supreme", label: "U.S. Supreme Court" },
            { value: "us-appeals", label: "Federal Circuit Courts" },
            { value: "us-district", label: "Federal District Courts" },
        ],
    },
    {
        label: "State Courts",
        options: [
            { value: "state-supreme", label: "State Supreme Courts" },
            { value: "state-appellate", label: "State Appellate Courts" },
            { value: "state-trial", label: "State Trial Courts" },
        ],
    },
    {
        label: "Administrative & International",
        options: [
            { value: "agencies", label: "Federal Agencies" },
            { value: "intl-tribunals", label: "International Tribunals" },
            { value: "custom", label: "Custom jurisdiction list" },
        ],
    },
];

const legalCollections = [
    { value: "primary-law", label: "Primary Law (cases, statutes, regulations)", defaultChecked: true },
    { value: "secondary", label: "Secondary Sources & Treatises", defaultChecked: true },
    { value: "litigation", label: "Litigation Analytics & Dockets" },
    { value: "knowledge", label: "Firm Knowledge Base" },
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

export function LibSearchBar() {
    const [researchType, setResearchType] = useState<ResearchType>("legal");

    return (
        <div className="flex w-full justify-center">
            <form
                className="flex w-full max-w-6xl flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
                noValidate
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold text-slate-900">Unified Research</h2>
                        <p className="text-sm text-slate-500">
                            Switch between legal and academic research modes without losing context.
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
                        />
                        <Button type="submit" className="h-12 md:px-8">
                            {researchType === "legal"
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

                {researchType === "legal" ? (
                    <>
                        <div className="grid gap-6 lg:grid-cols-3">
                            <section className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700">
                                    Jurisdictions
                                </Label>
                                <p className="text-xs text-slate-500">
                                    Select one or more courts to target your query.
                                </p>
                                <div className="space-y-4">
                                    {legalJurisdictionGroups.map((group) => (
                                        <div key={group.label} className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                {group.label}
                                            </p>
                                            <div className="space-y-2">
                                                {group.options.map((option) => {
                                                    const inputId = `jurisdiction-${option.value}`;
                                                    return (
                                                        <div key={option.value} className="flex items-center gap-2">
                                                            <Checkbox id={inputId} />
                                                            <Label htmlFor={inputId} className="text-sm text-slate-700">
                                                                {option.label}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <Checkbox id="jurisdiction-select-all" />
                                    <Label htmlFor="jurisdiction-select-all" className="text-xs font-medium text-slate-600">
                                        Search across all supported jurisdictions
                                    </Label>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Collections</p>
                                <div className="space-y-2">
                                    {legalCollections.map((collection) => {
                                        const inputId = `collection-${collection.value}`;
                                        return (
                                            <div key={collection.value} className="flex items-center gap-2">
                                                <Checkbox id={inputId} defaultChecked={collection.defaultChecked} />
                                                <Label htmlFor={inputId} className="text-sm text-slate-700">
                                                    {collection.label}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="space-y-3 pt-3">
                                    <Label htmlFor="library-practice" className="text-sm font-semibold text-slate-700">
                                        Practice focus
                                    </Label>
                                    <Select defaultValue="general">
                                        <SelectTrigger
                                            id="library-practice"
                                            className="w-full justify-between"
                                            aria-label="Practice focus"
                                        >
                                            <SelectValue placeholder="Select practice area" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General litigation</SelectItem>
                                            <SelectItem value="corporate">Corporate &amp; M&amp;A</SelectItem>
                                            <SelectItem value="ip">Intellectual property</SelectItem>
                                            <SelectItem value="labor">Labor &amp; employment</SelectItem>
                                            <SelectItem value="tax">Tax</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Research mode</p>
                                <RadioGroup defaultValue="natural" className="gap-2">
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem id="library-mode-natural" value="natural" />
                                        <Label htmlFor="library-mode-natural" className="text-sm text-slate-700">
                                            Natural language
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem id="library-mode-terms" value="terms" />
                                        <Label htmlFor="library-mode-terms" className="text-sm text-slate-700">
                                            Terms &amp; connectors
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem id="library-mode-citation" value="citation" />
                                        <Label htmlFor="library-mode-citation" className="text-sm text-slate-700">
                                            Citation lookup
                                        </Label>
                                    </div>
                                </RadioGroup>
                                <div className="space-y-3 pt-3">
                                    <Label htmlFor="library-date-range" className="text-sm font-semibold text-slate-700">
                                        Date range
                                    </Label>
                                    <Select defaultValue="all">
                                        <SelectTrigger
                                            id="library-date-range"
                                            className="w-full justify-between"
                                            aria-label="Date range"
                                        >
                                            <SelectValue placeholder="Select date range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All dates</SelectItem>
                                            <SelectItem value="5y">Last 5 years</SelectItem>
                                            <SelectItem value="1y">Last 12 months</SelectItem>
                                            <SelectItem value="90d">Last 90 days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="library-save-query" />
                                    <Label htmlFor="library-save-query" className="text-xs font-medium text-slate-600">
                                        Save this query to workspace
                                    </Label>
                                </div>
                            </section>
                        </div>
                    </>
                ) : researchType === "academic" ? (
                    <>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <section className="space-y-3">
                                <Label htmlFor="academic-discipline" className="text-sm font-semibold text-slate-700">
                                    Discipline focus
                                </Label>
                                <Select defaultValue="law">
                                    <SelectTrigger
                                        id="academic-discipline"
                                        className="w-full justify-between"
                                        aria-label="Discipline"
                                    >
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

                                <Label htmlFor="academic-database" className="text-sm font-semibold text-slate-700">
                                    Database
                                </Label>
                                <Select defaultValue="hein">
                                    <SelectTrigger
                                        id="academic-database"
                                        className="w-full justify-between"
                                        aria-label="Database"
                                    >
                                        <SelectValue placeholder="Select database" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hein">HeinOnline</SelectItem>
                                        <SelectItem value="lexis">Lexis Academic</SelectItem>
                                        <SelectItem value="westlaw">Westlaw Campus Research</SelectItem>
                                        <SelectItem value="google-scholar">Google Scholar</SelectItem>
                                        <SelectItem value="ssrn">SSRN &amp; preprint servers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </section>

                            <section className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700">
                                    Source types
                                </Label>
                                <div className="space-y-2">
                                    {academicSources.map((source) => {
                                        const inputId = `academic-source-${source.value}`;
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

                                <Label htmlFor="academic-year-start" className="text-sm font-semibold text-slate-700">
                                    Publication year (from)
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input id="academic-year-start" type="number" placeholder="2000" className="h-11" />
                                    <span className="text-slate-500">to</span>
                                    <Input id="academic-year-end" type="number" placeholder="2024" className="h-11" />
                                </div>
                            </section>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <section className="space-y-3">
                                <Label htmlFor="academic-author" className="text-sm font-semibold text-slate-700">
                                    Author filter
                                </Label>
                                <Input id="academic-author" placeholder="e.g. Cass Sunstein" className="h-11" />

                                <Label htmlFor="academic-institution" className="text-sm font-semibold text-slate-700">
                                    Institution / affiliation
                                </Label>
                                <Input
                                    id="academic-institution"
                                    placeholder="e.g. Harvard Law School"
                                    className="h-11"
                                />
                            </section>

                            <section className="space-y-3">
                                <Label htmlFor="academic-language" className="text-sm font-semibold text-slate-700">
                                    Language
                                </Label>
                                <Select defaultValue="english">
                                    <SelectTrigger
                                        id="academic-language"
                                        className="w-full justify-between"
                                        aria-label="Language"
                                    >
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="english">English</SelectItem>
                                        <SelectItem value="spanish">Spanish</SelectItem>
                                        <SelectItem value="french">French</SelectItem>
                                        <SelectItem value="german">German</SelectItem>
                                        <SelectItem value="mandarin">Mandarin</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                    <Checkbox id="academic-peer-review" defaultChecked />
                                    <Label htmlFor="academic-peer-review" className="text-sm text-slate-700">
                                        Require peer-reviewed sources
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="academic-open-access" />
                                    <Label htmlFor="academic-open-access" className="text-sm text-slate-700">
                                        Limit to open-access content
                                    </Label>
                                </div>
                            </section>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <section className="space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Scope</p>
                                <p className="text-xs text-slate-500">
                                    Choose which datasets the AI agent should pull from.
                                </p>
                                <div className="space-y-2">
                                    {aiScopes.map((scope) => {
                                        const inputId = `ai-scope-${scope.value}`;
                                        return (
                                            <div key={scope.value} className="flex items-center gap-2">
                                                <Checkbox id={inputId} defaultChecked />
                                                <Label htmlFor={inputId} className="text-sm text-slate-700">
                                                    {scope.label}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="space-y-3 pt-4">
                                    <Label htmlFor="ai-priority-jurisdiction" className="text-sm font-semibold text-slate-700">
                                        Priority jurisdiction
                                    </Label>
                                    <Select defaultValue="us">
                                        <SelectTrigger
                                            id="ai-priority-jurisdiction"
                                            className="w-full justify-between"
                                            aria-label="Priority jurisdiction"
                                        >
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="us">United States</SelectItem>
                                            <SelectItem value="uk">United Kingdom</SelectItem>
                                            <SelectItem value="eu">European Union</SelectItem>
                                            <SelectItem value="intl">International mix</SelectItem>
                                            <SelectItem value="custom">Custom (specify below)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Output preferences</p>
                                <RadioGroup defaultValue="memo" className="space-y-2">
                                    {aiOutputStyles.map((style) => {
                                        const inputId = `ai-output-${style.value}`;
                                        return (
                                            <div key={style.value} className="flex items-center gap-2">
                                                <RadioGroupItem id={inputId} value={style.value} />
                                                <Label htmlFor={inputId} className="text-sm text-slate-700">
                                                    {style.label}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="ai-length" className="text-sm font-semibold text-slate-700">
                                        Target length
                                    </Label>
                                    <Select defaultValue="standard">
                                        <SelectTrigger
                                            id="ai-length"
                                            className="w-full justify-between"
                                            aria-label="Target length"
                                        >
                                            <SelectValue placeholder="Select length" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bullet">Bullet digest (1-2 pages)</SelectItem>
                                            <SelectItem value="standard">Standard memo (3-5 pages)</SelectItem>
                                            <SelectItem value="deep">Comprehensive report (8+ pages)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>
                        </div>

                        <section className="space-y-3">
                            <Label htmlFor="ai-guidance" className="text-sm font-semibold text-slate-700">
                                Guidance for the AI team
                            </Label>
                            <Textarea
                                id="ai-guidance"
                                placeholder="Outline client goals, risk posture, preferred authorities, or internal documents to incorporate."
                                className="min-h-[140px]"
                            />
                            <div className="flex items-center gap-2">
                                <Checkbox id="ai-notify" defaultChecked />
                                <Label htmlFor="ai-notify" className="text-xs font-medium text-slate-600">
                                    Notify me when the synthesized brief is ready
                                </Label>
                            </div>
                        </section>
                    </>
                )}
            </form>
        </div>
    );
}
