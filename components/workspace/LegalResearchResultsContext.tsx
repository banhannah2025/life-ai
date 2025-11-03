'use client';

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

import type { AggregatedResult, LibSearchSuccessPayload } from "@/components/ui/LibSearchBar";
import type { AiSearchAnswerCitation, AiSearchAssistWebResult } from "@/lib/search/ai";

type LegalResearchResultsStatus = "idle" | "loading" | "ready" | "error";

export type LegalResearchResultsState = {
    status: LegalResearchResultsStatus;
    originalQuery: string | null;
    effectiveQuery: string | null;
    aiAnswer: string | null;
    aiSummary: string | null;
    aiCitations: AiSearchAnswerCitation[] | null;
    aiSources: AiSearchAssistWebResult[] | null;
    results: AggregatedResult[];
    infoMessage: string | null;
    errorMessage: string | null;
    lastUpdated: number | null;
};

const initialState: LegalResearchResultsState = {
    status: "idle",
    originalQuery: null,
    effectiveQuery: null,
    aiAnswer: null,
    aiSummary: null,
    aiCitations: null,
    aiSources: null,
    results: [],
    infoMessage: null,
    errorMessage: null,
    lastUpdated: null,
};

type StartAction = { type: "START"; query: string };
type SuccessAction = { type: "SUCCESS"; payload: LibSearchSuccessPayload };
type ErrorAction = { type: "ERROR"; query: string | null; error: string };
type ResetAction = { type: "RESET" };

type Action = StartAction | SuccessAction | ErrorAction | ResetAction;

function reducer(state: LegalResearchResultsState, action: Action): LegalResearchResultsState {
    switch (action.type) {
        case "START":
            return {
                status: "loading",
                originalQuery: action.query,
                effectiveQuery: null,
                aiAnswer: null,
                aiSummary: null,
                aiCitations: null,
                aiSources: null,
                results: [],
                infoMessage: null,
                errorMessage: null,
                lastUpdated: state.lastUpdated,
            };
        case "SUCCESS":
            return {
                status: "ready",
                originalQuery: action.payload.originalQuery,
                effectiveQuery: action.payload.effectiveQuery,
                aiAnswer: action.payload.aiAnswer ?? null,
                aiSummary: action.payload.aiSummary ?? null,
                aiCitations: action.payload.aiCitations ?? null,
                aiSources: action.payload.aiSources ?? null,
                results: action.payload.results,
                infoMessage: action.payload.infoMessage ?? null,
                errorMessage: null,
                lastUpdated: Date.now(),
            };
        case "ERROR":
            return {
                status: "error",
                originalQuery: action.query,
                effectiveQuery: null,
                aiAnswer: null,
                aiSummary: null,
                aiCitations: null,
                aiSources: null,
                results: [],
                infoMessage: null,
                errorMessage: action.error,
                lastUpdated: Date.now(),
            };
        case "RESET":
            return initialState;
        default:
            return state;
    }
}

type LegalResearchResultsContextValue = {
    state: LegalResearchResultsState;
    beginSearch: (query: string) => void;
    completeSearch: (payload: LibSearchSuccessPayload) => void;
    failSearch: (context: { query: string | null; error: string }) => void;
    reset: () => void;
};

const LegalResearchResultsContext = createContext<LegalResearchResultsContextValue | null>(null);

export function LegalResearchResultsProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const contextValue = useMemo<LegalResearchResultsContextValue>(
        () => ({
            state,
            beginSearch: (query: string) => dispatch({ type: "START", query }),
            completeSearch: (payload: LibSearchSuccessPayload) => dispatch({ type: "SUCCESS", payload }),
            failSearch: (context: { query: string | null; error: string }) =>
                dispatch({ type: "ERROR", query: context.query, error: context.error }),
            reset: () => dispatch({ type: "RESET" }),
        }),
        [state],
    );

    return (
        <LegalResearchResultsContext.Provider value={contextValue}>
            {children}
        </LegalResearchResultsContext.Provider>
    );
}

export function useLegalResearchResults() {
    const context = useContext(LegalResearchResultsContext);
    if (!context) {
        throw new Error("useLegalResearchResults must be used within a LegalResearchResultsProvider.");
    }
    return context;
}
