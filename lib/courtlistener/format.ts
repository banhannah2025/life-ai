import type { CourtListenerOpinion } from "./types";

function normalize(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalize(entry);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (typeof value === "object") {
    const candidate =
      (value as { name?: unknown; title?: unknown; label?: unknown; abbr?: unknown }).name ??
      (value as { name?: unknown; title?: unknown; label?: unknown; abbr?: unknown }).title ??
      (value as { name?: unknown; title?: unknown; label?: unknown; abbr?: unknown }).label ??
      (value as { name?: unknown; title?: unknown; label?: unknown; abbr?: unknown }).abbr;
    if (candidate) {
      return normalize(candidate);
    }
    return null;
  }

  try {
    return String(value).trim();
  } catch {
    return null;
  }
}

export function formatOpinionTitle(opinion: CourtListenerOpinion): string {
  const parties = normalize(opinion.caseNameShort) ?? normalize(opinion.caseName) ?? "Unnamed Matter";
  const citation = normalize(opinion.citation);
  const docket = normalize(opinion.docketNumber);
  const courtSegment = normalize(opinion.courtCitation) ?? normalize(opinion.court);
  const year = normalize(opinion.year);

  let title = parties;
  const trailingSegments: string[] = [];

  if (citation) {
    trailingSegments.push(citation);
  } else if (courtSegment || year) {
    const segments: string[] = [];
    if (courtSegment) {
      segments.push(courtSegment);
    }
    if (year && (!courtSegment || !courtSegment.includes(year))) {
      segments.push(year);
    }
    if (segments.length > 0) {
      trailingSegments.push(segments.join(" "));
    }
  } else if (year) {
    trailingSegments.push(year);
  }

  if (trailingSegments.length > 0) {
    title = `${title}, ${trailingSegments.join(", ")}`;
  }

  if (docket) {
    title = `${title} (No. ${docket})`;
  }

  return title;
}
