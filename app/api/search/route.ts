import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { serializeChannel, serializePost } from "@/lib/social/serialization";
import { searchPosts } from "@/lib/social/server/posts";
import { searchChannels } from "@/lib/social/server/channels";
import { searchProfiles } from "@/lib/search/server";
import { searchCourtListenerOpinions, searchCourtListenerRecapDockets } from "@/lib/courtlistener/server";
import { searchGovInfoDocuments } from "@/lib/govinfo/server";
import { searchLibraryOfCongress } from "@/lib/loc/server";
import { searchFederalRegisterDocuments } from "@/lib/federalregister/server";
import { searchEcfrDocuments } from "@/lib/ecfr/server";
import { searchRegulationsDocuments } from "@/lib/regulations/server";
import { searchOpenStatesBills } from "@/lib/openstates/server";
import { searchLocalLibraryResources } from "@/lib/library/resources";
import { searchLibraryDatasets } from "@/lib/library/datasets";

function toProfileResult(response: Awaited<ReturnType<typeof searchProfiles>>[number]) {
  const { id, fullName, profile } = response;
  return {
    id,
    fullName,
    headline: profile.headline ?? "",
    location: profile.location ?? "",
    company: profile.company ?? "",
    role: profile.role ?? "",
    avatarUrl: profile.avatarUrl ?? "",
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type") ?? "all";
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 25) : 10;
  const collectionsParam = url.searchParams.get("collections") ?? "";
  const jurisdictionsParam = url.searchParams.get("jurisdictions") ?? "";
  const stateParam = (url.searchParams.get("state") ?? "").trim().toUpperCase();
  const selectedCollections = new Set(
    collectionsParam
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
  const selectedJurisdictions = new Set(
    jurisdictionsParam
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
  const stateFilter = stateParam && stateParam !== "ALL" && stateParam.length === 2 ? stateParam : null;

  if (!query) {
    return NextResponse.json({
      profiles: [],
      posts: [],
      channels: [],
      opinions: [],
      recapDockets: [],
      govDocuments: [],
      libraryItems: [],
      federalRegisterDocuments: [],
      ecfrDocuments: [],
      regulationsDocuments: [],
      openStatesBills: [],
      waOpinions: [],
      rcwSections: [],
      uscodeTitles: [],
      localDocuments: [],
    });
  }

  const searchAll = type === "all";
  const searchLegal = type === "legal";

  const hasCollection = (collection: string) =>
    !searchLegal || selectedCollections.size === 0 || selectedCollections.has(collection);
  const hasJurisdiction = (jurisdiction: "federal" | "state" | "agency") =>
    !searchLegal ||
    selectedJurisdictions.size === 0 ||
    selectedJurisdictions.has(jurisdiction) ||
    selectedJurisdictions.has("mixed");

  const canAccessPrimaryLaw = hasCollection("primary-law");
  const canAccessSecondary = hasCollection("secondary");
  const canAccessKnowledge = hasCollection("knowledge");
  const canAccessLitigation = hasCollection("litigation");
  const includeFederal = hasJurisdiction("federal");
  const includeState = hasJurisdiction("state");
  const includeAgency = hasJurisdiction("agency");

  const shouldSearchProfiles = !searchLegal && (searchAll || type === "profiles");
  const shouldSearchPosts = !searchLegal && (searchAll || type === "posts");
  const shouldSearchChannels = !searchLegal && (searchAll || type === "channels");
  const shouldSearchOpinions =
    (searchAll || searchLegal || type === "opinions") && canAccessPrimaryLaw && (includeFederal || includeState);
  const shouldSearchWaLocalOpinions =
    (searchAll || searchLegal || type === "opinions" || type === "waopinions") &&
    canAccessPrimaryLaw &&
    includeState;
  const shouldSearchRcw =
    (searchAll || searchLegal || type === "rcw") && canAccessPrimaryLaw && includeState;
  const shouldSearchUsCode =
    (searchAll || searchLegal || type === "uscode") && canAccessPrimaryLaw && includeFederal;
  const shouldSearchRecap =
    (searchAll || searchLegal || type === "recap") &&
    (canAccessLitigation || canAccessPrimaryLaw) &&
    (includeFederal || includeState);
  const shouldSearchGovDocuments =
    (searchAll || searchLegal || type === "govinfo") && canAccessPrimaryLaw && includeFederal;
  const shouldSearchLibrary = searchAll || type === "loc";
  const shouldSearchFederalRegister =
    (searchAll || searchLegal || type === "federalregister") && canAccessPrimaryLaw && includeAgency;
  const shouldSearchEcfr =
    (searchAll || searchLegal || type === "ecfr") && canAccessPrimaryLaw && includeAgency;
  const shouldSearchRegulations =
    (searchAll || searchLegal || type === "regulations") && canAccessPrimaryLaw && includeAgency;
  const shouldSearchOpenStates =
    (searchAll || searchLegal || type === "openstates") && (canAccessPrimaryLaw || canAccessLitigation) && includeState;
  const shouldSearchLocal =
    (searchAll || searchLegal || type === "library") && (canAccessSecondary || canAccessKnowledge);

  const [
    profileMatches,
    postMatches,
    channelMatches,
    opinionMatches,
    recapMatches,
    govDocumentMatches,
    libraryMatches,
    federalRegisterMatches,
    ecfrMatches,
    regulationsMatches,
    openStatesMatches,
    localResourceMatches,
  ] = await Promise.all([
    shouldSearchProfiles ? searchProfiles(query, limit) : Promise.resolve([]),
    shouldSearchPosts ? searchPosts({ query, limit, viewerId: userId ?? null }) : Promise.resolve([]),
    shouldSearchChannels ? searchChannels({ query, limit, viewerId: userId ?? null }) : Promise.resolve([]),
    shouldSearchOpinions
      ? searchCourtListenerOpinions(query, limit, {
          includeFederal,
          includeState,
          includeAgency,
          stateFilter,
        })
      : Promise.resolve([]),
    shouldSearchRecap
      ? searchCourtListenerRecapDockets(query, limit, {
          includeFederal,
          includeState,
          includeAgency,
          stateFilter,
        })
      : Promise.resolve([]),
    shouldSearchGovDocuments ? searchGovInfoDocuments(query, limit) : Promise.resolve([]),
    shouldSearchLibrary ? searchLibraryOfCongress(query, limit) : Promise.resolve([]),
    shouldSearchFederalRegister ? searchFederalRegisterDocuments(query, limit) : Promise.resolve([]),
    shouldSearchEcfr ? searchEcfrDocuments(query, limit) : Promise.resolve([]),
    shouldSearchRegulations ? searchRegulationsDocuments(query, limit) : Promise.resolve([]),
    shouldSearchOpenStates ? searchOpenStatesBills(query, limit) : Promise.resolve([]),
    shouldSearchLocal ? Promise.resolve(searchLocalLibraryResources(query, limit)) : Promise.resolve([]),
  ]);

  const datasetResults =
    shouldSearchRcw || shouldSearchUsCode || shouldSearchWaLocalOpinions
      ? searchLibraryDatasets(query, {
          rcwLimit: limit,
          uscodeLimit: limit,
          waOpinionsLimit: limit,
        })
      : { rcwSections: [], uscodeTitles: [], waOpinions: [] };

  const rcwMatches = shouldSearchRcw ? datasetResults.rcwSections : [];
  const uscodeMatches = shouldSearchUsCode ? datasetResults.uscodeTitles : [];
  const waLocalOpinionMatches = shouldSearchWaLocalOpinions ? datasetResults.waOpinions : [];

  return NextResponse.json({
    profiles: profileMatches.map(toProfileResult),
    posts: postMatches.map(serializePost),
    channels: channelMatches.map(serializeChannel),
    opinions: opinionMatches,
    recapDockets: recapMatches,
    govDocuments: govDocumentMatches,
    libraryItems: libraryMatches,
    federalRegisterDocuments: federalRegisterMatches,
    ecfrDocuments: ecfrMatches,
    regulationsDocuments: regulationsMatches,
    openStatesBills: openStatesMatches,
    waOpinions: waLocalOpinionMatches,
    rcwSections: rcwMatches,
    uscodeTitles: uscodeMatches,
    localDocuments: localResourceMatches,
  });
}
