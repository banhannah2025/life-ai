import { getAdminFirestore } from "@/lib/firebase/admin";
import { idToPath } from "@/lib/blob/utils";

export type UserDocumentRecord = {
  id: string;
  userId: string;
  title?: string;
  name?: string;
  docType?: string;
  pathname: string;
  relativePath?: string;
  parentPath?: string;
  url?: string;
  downloadUrl?: string;
  contentType?: string;
  size?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function getDocumentForUser(userId: string, docId: string) {
  const firestore = getAdminFirestore();
  const docRef = firestore.collection("userFiles").doc(docId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as UserDocumentRecord | undefined;

  if (!data || data.userId !== userId) {
    return null;
  }

  const { id: _ignoredId, ...rest } = data;
  void _ignoredId;

  return {
    ...rest,
    id: docId,
  } satisfies UserDocumentRecord;
}

export function documentIdToPath(docId: string) {
  return idToPath(docId);
}
