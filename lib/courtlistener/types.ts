export type CourtJurisdictionCategory = "federal" | "state" | "agency" | "mixed";

export type CourtListenerOpinion = {
  id: string;
  caseName: string;
  caseNameShort: string | null;
  docketNumber: string | null;
  citation: string | null;
  dateFiled: string | null;
  precedentialStatus: string | null;
  absoluteUrl: string | null;
  snippet: string | null;
  snippetHighlighted: string | null;
  year: string | null;
  court: string | null;
  courtCitation: string | null;
  courtId: string | null;
  jurisdictionCategory: CourtJurisdictionCategory;
  stateCode: string | null;
};

export type CourtListenerRecapDocket = {
  id: string;
  caseName: string;
  caseNameShort: string | null;
  docketNumber: string | null;
  absoluteUrl: string | null;
  docketEntriesUrl: string | null;
  dateFiled: string | null;
  courtId: string | null;
  courtName: string | null;
  jurisdictionCategory: CourtJurisdictionCategory;
  stateCode: string | null;
  assignedTo: string | null;
  natureOfSuit: string | null;
  cause: string | null;
  appealFrom: string | null;
  recapSource: string | null;
  snippet: string | null;
};
