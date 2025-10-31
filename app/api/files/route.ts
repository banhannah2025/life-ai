import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { list } from "@vercel/blob";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { ensureDefaultFolder } from "@/lib/blob/ensure-default-folder";
import { DEFAULT_FOLDER_LABEL } from "@/lib/blob/utils";

function computeParentPath(path: string, isFolder: boolean) {
  const normalized = isFolder ? path.replace(/\/+$/, "") : path;
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash === -1) {
    return "";
  }
  return normalized.slice(0, lastSlash + 1);
}

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefix = `uploads/${userId}/`;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const defaultFolder = await ensureDefaultFolder(userId);
    const blobs = await list({ prefix, token: token ?? undefined, mode: "expanded" });
    const firestore = getAdminFirestore();

    const filesSnapshot = await firestore
      .collection("userFiles")
      .where("userId", "==", userId)
      .get();

    const fileMetadata = new Map<string, Record<string, unknown>>();
    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      const pathname = data.pathname as string | undefined;
      if (pathname) {
        fileMetadata.set(pathname, data);
      }
    });

    const foldersSnapshot = await firestore
      .collection("userFolders")
      .where("userId", "==", userId)
      .get();

    const folderMap = new Map<string, Record<string, unknown>>();

    const ensureFolder = (relativePath: string, source: string) => {
      if (!relativePath || folderMap.has(relativePath)) {
        return;
      }

      const clean = relativePath.replace(/\/+$/, "");
      const name = clean.split("/").pop() ?? clean;
      const pathname = `${prefix}${relativePath}`;

      folderMap.set(relativePath, {
        type: "folder",
        name,
        pathname,
        relativePath,
        parentPath: computeParentPath(relativePath, true),
        createdAt: null,
        updatedAt: null,
        source,
      });
    };

    foldersSnapshot.forEach((doc) => {
      const data = doc.data();
      const pathname = data.pathname as string | undefined;
      if (!pathname) {
        return;
      }

      const relativePath = pathname.replace(prefix, "");
      folderMap.set(relativePath, {
        type: "folder",
        name: data.name ?? relativePath.replace(/\/+$/, ""),
        pathname,
        relativePath,
        parentPath: computeParentPath(relativePath, true),
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
        source: "firestore",
        isDefault: data.isDefault ?? false,
      });
    });

    if (defaultFolder.relativePath && !folderMap.has(defaultFolder.relativePath)) {
      folderMap.set(defaultFolder.relativePath, {
        type: "folder",
        name: DEFAULT_FOLDER_LABEL,
        pathname: defaultFolder.pathname,
        relativePath: defaultFolder.relativePath,
        parentPath: "",
        createdAt: null,
        updatedAt: null,
        source: "derived",
        isDefault: true,
      });
    } else {
      const existingDefault = folderMap.get(defaultFolder.relativePath);
      if (existingDefault) {
        existingDefault.isDefault = true;
        existingDefault.name = existingDefault.name || DEFAULT_FOLDER_LABEL;
      }
    }

    const items: Array<Record<string, unknown>> = [];

    for (const blob of blobs.blobs) {
      const relativePath = blob.pathname.replace(prefix, "");
      const metadata = fileMetadata.get(blob.pathname) ?? {};
      const parentPath = computeParentPath(relativePath, false);

      if (parentPath) {
        ensureFolder(parentPath, "derived");
      }

      const blobDetails = blob as typeof blob & { contentType?: string };
      const metadataContentType =
        typeof metadata.contentType === "string" ? (metadata.contentType as string) : undefined;

      const baseItem: Record<string, unknown> = {
        type: "file",
        name: relativePath.split("/").pop() ?? blob.pathname,
        pathname: blob.pathname,
        relativePath,
        parentPath,
        size: blob.size,
        contentType: metadataContentType ?? blobDetails.contentType ?? null,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        uploadedAt: blob.uploadedAt,
        source: "blob",
      };

      items.push({ ...baseItem, ...metadata });
    }

    for (const folder of folderMap.values()) {
      items.push(folder);
    }

    return NextResponse.json({ items, defaultFolder });
  } catch (error) {
    console.error("Failed to list files", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
