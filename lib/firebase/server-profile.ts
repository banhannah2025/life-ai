import { getAdminFirestore } from "@/lib/firebase/admin";
import { DEFAULT_USER_PROFILE, type UserProfile } from "@/lib/profile/schema";

const COLLECTION = "profiles";

export async function getPublicUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    return null;
  }

  const snapshot = await getAdminFirestore().collection(COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as UserProfile & { updatedAt?: { toDate?: () => Date } };

  return {
    ...DEFAULT_USER_PROFILE,
    ...data,
    updatedAt: data.updatedAt && typeof data.updatedAt === "object" && "toDate" in data.updatedAt
      ? (data.updatedAt as { toDate: () => Date }).toDate()
      : data.updatedAt ?? null,
  };
}
