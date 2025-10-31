import type { CourtListenerOpinion, CourtListenerRecapDocket } from "@/lib/courtlistener/types";
import type { FederalRegisterDocument } from "@/lib/federalregister/types";
import type { GovInfoDocument } from "@/lib/govinfo/types";
import type { LibraryOfCongressItem } from "@/lib/loc/types";
import type { EcfrDocument } from "@/lib/ecfr/types";
import type { LibraryResource } from "@/lib/library/types";
import type {
  RcwSectionSearchResult,
  UsCodeDownloadSearchResult,
  WaCourtRuleSearchResult,
  WashingtonCourtOpinionSearchResult,
} from "@/lib/library/datasets";
import type { OpenStatesBill } from "@/lib/openstates/types";
import type { RegulationsDocument } from "@/lib/regulations/types";
import type { UserProfile } from "@/lib/profile/schema";
import type { SocialPostDTO } from "@/lib/social/client";
import type { SocialChannelDTO } from "@/lib/social/client";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

type ApiError = Error & {
  status?: number;
  details?: unknown;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    let details: unknown;
    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
      if (data?.details) {
        details = data.details;
      }
    } catch {
      // swallow
    }
    const error = new Error(message || "Request failed") as ApiError;
    error.status = response.status;
    if (details) {
      error.details = details;
    }
    throw error;
  }

  return response.json() as Promise<T>;
}

export type ProfileSearchResult = {
  id: string;
  fullName: string;
  headline: string;
  location: string;
  company: string;
  role: string;
  avatarUrl: string;
};

export type SearchResponse = {
  profiles: ProfileSearchResult[];
  posts: SocialPostDTO[];
  channels: SocialChannelDTO[];
  opinions: CourtListenerOpinion[];
  recapDockets: CourtListenerRecapDocket[];
  govDocuments: GovInfoDocument[];
  libraryItems: LibraryOfCongressItem[];
  federalRegisterDocuments: FederalRegisterDocument[];
  ecfrDocuments: EcfrDocument[];
  regulationsDocuments: RegulationsDocument[];
  openStatesBills: OpenStatesBill[];
  waOpinions: WashingtonCourtOpinionSearchResult[];
  rcwSections: RcwSectionSearchResult[];
  uscodeTitles: UsCodeDownloadSearchResult[];
  waCourtRules: WaCourtRuleSearchResult[];
  localDocuments: LibraryResource[];
};

export type SearchFilters = {
  jurisdictions?: string[];
  collections?: string[];
  dateRange?: "any" | "5y" | "2y" | "1y" | "90d";
  phraseBoost?: string;
  state?: string;
};

export async function searchDirectory(
  query: string,
  type:
    | "all"
    | "profiles"
    | "posts"
    | "channels"
    | "legal"
    | "opinions"
    | "recap"
    | "waopinions"
    | "rcw"
    | "uscode"
    | "courtrules"
    | "govinfo"
    | "loc"
    | "federalregister"
    | "ecfr"
    | "regulations"
    | "openstates" = "all",
  limit = 10,
  filters?: SearchFilters
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: limit.toString(),
  });

  if (filters?.jurisdictions?.length) {
    params.set("jurisdictions", filters.jurisdictions.join(","));
  }
  if (filters?.collections?.length) {
    params.set("collections", filters.collections.join(","));
  }
  if (filters?.dateRange) {
    params.set("dateRange", filters.dateRange);
  }
  if (filters?.phraseBoost) {
    params.set("phraseBoost", filters.phraseBoost);
  }
  if (filters?.state && filters.state !== "ALL") {
    params.set("state", filters.state);
  }

  return handleResponse<SearchResponse>(await fetch(`/api/search?${params.toString()}`, { cache: "no-store" }));
}

export async function fetchPublicProfile(userId: string): Promise<UserProfile> {
  const data = await handleResponse<{ profile: UserProfile & { updatedAt: string | null } }>(
    await fetch(`/api/profiles/${userId}`, {
      headers: JSON_HEADERS,
      cache: "no-store",
    })
  );

  const { profile } = data;

  return {
    ...profile,
    updatedAt: profile.updatedAt ? new Date(profile.updatedAt) : null,
  };
}
