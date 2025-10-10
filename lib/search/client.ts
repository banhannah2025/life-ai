import type { UserProfile } from "@/lib/profile/schema";
import type { SocialPostDTO } from "@/lib/social/client";

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
    } catch (error) {
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
};

export async function searchDirectory(query: string, type: "all" | "profiles" | "posts" = "all", limit = 10): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: limit.toString(),
  });

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
