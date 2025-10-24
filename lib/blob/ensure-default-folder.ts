import { createFolder } from "@vercel/blob";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  DEFAULT_FOLDER_LABEL,
  DEFAULT_FOLDER_SLUG,
  DEFAULT_FOLDER_RELATIVE_PATH,
  ensureTrailingSlash,
  joinPath,
  pathToId,
} from "./utils";

export async function ensureDefaultFolder(userId: string) {
  const firestore = getAdminFirestore();
  const uploadsPrefix = ensureTrailingSlash(`uploads/${userId}`);
  const relativePath = DEFAULT_FOLDER_RELATIVE_PATH;
  const pathname = ensureTrailingSlash(joinPath(uploadsPrefix, DEFAULT_FOLDER_SLUG));
  const docId = pathToId(pathname);
  const docRef = firestore.collection("userFolders").doc(docId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    try {
      await createFolder(pathname, {
        token: token ?? undefined,
      });
    } catch (error) {
      // Ignore errors if the folder already exists remotely.
      const message = error instanceof Error ? error.message : String(error);
      if (!/already exists|409/.test(message)) {
        throw error;
      }
    }

    const now = Timestamp.now();
    await docRef.set(
      {
        userId,
        name: DEFAULT_FOLDER_LABEL,
        pathname,
        relativePath,
        parentPath: "",
        createdAt: now,
        updatedAt: now,
        isDefault: true,
      },
      { merge: true }
    );
  } else if (!snapshot.data()?.isDefault) {
    await docRef.set(
      {
        isDefault: true,
        name: snapshot.data()?.name ?? DEFAULT_FOLDER_LABEL,
      },
      { merge: true }
    );
  }

  return { pathname, relativePath };
}
