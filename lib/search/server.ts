import { getAdminFirestore } from "@/lib/firebase/admin";
import { DEFAULT_USER_PROFILE, type UserProfile } from "@/lib/profile/schema";

import { extractSearchTokens } from "./keywords";

const PROFILE_COLLECTION = "profiles";

export type ProfileSearchResult = {
  id: string;
  fullName: string;
  profile: UserProfile;
};

function isIndexMissingError(error: unknown): boolean {
  return error instanceof Error && /FAILED_PRECONDITION/.test(error.message);
}

export async function searchProfiles(query: string, limit = 10): Promise<ProfileSearchResult[]> {
  const tokens = extractSearchTokens(query).slice(0, 5);
  if (!tokens.length) {
    return [];
  }

  const [firstToken, ...rest] = tokens;
  let snapshot;
  try {
    snapshot = await getAdminFirestore()
      .collection(PROFILE_COLLECTION)
      .where("searchKeywords", "array-contains", firstToken)
      .orderBy("updatedAt", "desc")
      .limit(limit * 2)
      .get();
  } catch (error) {
    if (!isIndexMissingError(error)) {
      throw error;
    }
    snapshot = await getAdminFirestore()
      .collection(PROFILE_COLLECTION)
      .where("searchKeywords", "array-contains", firstToken)
      .limit(limit * 4)
      .get();
  }

  if (!snapshot.size) {
    return [];
  }

  const matches = snapshot.docs
    .filter((doc) => {
      if (!rest.length) {
        return true;
      }
      const data = doc.data() as UserProfile & { searchKeywords?: string[] };
      const keywords = data.searchKeywords ?? [];
      return rest.every((token) => keywords.includes(token));
    })
    .map((doc) => {
      const data = doc.data() as UserProfile & { updatedAt?: { toDate?: () => Date } };
      const profile: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        ...data,
        updatedAt: data.updatedAt && typeof data.updatedAt === "object" && "toDate" in data.updatedAt
          ? (data.updatedAt as { toDate: () => Date }).toDate()
          : data.updatedAt ?? null,
      };
      const fullName =
        [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.headline || "Life-AI member";

      return {
        id: doc.id,
        fullName,
        profile,
      };
    })
    .sort((a, b) => {
      const aTime = a.profile.updatedAt?.getTime?.() ?? 0;
      const bTime = b.profile.updatedAt?.getTime?.() ?? 0;
      return bTime - aTime;
    });

  return matches.slice(0, limit);
}
