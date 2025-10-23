import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { copy, createFolder, del, list } from "@vercel/blob";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  ensureTrailingSlash,
  joinPath,
  pathToId,
  sanitizePathSegment,
} from "@/lib/blob/utils";
import { ensureDefaultFolder } from "@/lib/blob/ensure-default-folder";

function getPrefix(userId: string) {
  return ensureTrailingSlash(`uploads/${userId}`);
}

function assertWithinPrefix(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) {
    throw new Error("Pathname outside user scope");
  }
}

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDefaultFolder(userId);
    const body = await request.json();
    const nameInput = typeof body?.name === "string" ? body.name : "";
    const parentPathInput = typeof body?.parentPath === "string" ? body.parentPath : "";

    const sanitizedName = sanitizePathSegment(nameInput);

    if (!sanitizedName) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const prefix = getPrefix(userId);
    const relativeParent = parentPathInput ? parentPathInput.replace(/^\/+|\/+$/g, "") : "";
    const relativeFolder = ensureTrailingSlash(joinPath(relativeParent, sanitizedName));
    const fullPath = ensureTrailingSlash(joinPath(prefix, relativeFolder));

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    await createFolder(fullPath, { token: token ?? undefined });

    const firestore = getAdminFirestore();
    const docId = pathToId(fullPath);
    const now = Timestamp.now();
    await firestore.collection("userFolders").doc(docId).set(
      {
        userId,
        name: sanitizedName,
        pathname: fullPath,
        relativePath: relativeFolder,
        parentPath: relativeParent ? `${relativeParent}/` : "",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ pathname: fullPath, relativePath: relativeFolder }, { status: 201 });
  } catch (error) {
    console.error("Failed to create folder", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const defaultFolder = await ensureDefaultFolder(userId);
    const body = await request.json();
    const pathname = typeof body?.pathname === "string" ? body.pathname : "";
    const newNameInput = typeof body?.newName === "string" ? body.newName : "";

    if (!pathname || !newNameInput) {
      return NextResponse.json({ error: "Invalid rename request" }, { status: 400 });
    }

    const sanitizedNewName = sanitizePathSegment(newNameInput);

    if (!sanitizedNewName) {
      return NextResponse.json({ error: "New folder name is required" }, { status: 400 });
    }

    const prefix = getPrefix(userId);
    assertWithinPrefix(pathname, prefix);

    if (ensureTrailingSlash(pathname) === defaultFolder.pathname) {
      return NextResponse.json({ error: "The default folder cannot be renamed" }, { status: 400 });
    }

    const relativePath = pathname.replace(prefix, "");
    const parentPath = relativePath.replace(/[^/]+\/?$/, "");
    const newRelativePath = ensureTrailingSlash(joinPath(parentPath, sanitizedNewName));
    const newFullPath = ensureTrailingSlash(joinPath(prefix, newRelativePath));

    if (newFullPath === pathname) {
      return NextResponse.json({ pathname, relativePath }, { status: 200 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    const folderPrefix = ensureTrailingSlash(pathname);
    const blobs = await list({ prefix: folderPrefix, token: token ?? undefined, mode: "expanded" });

    for (const blob of blobs.blobs) {
      const suffix = blob.pathname.slice(folderPrefix.length);
      const destinationPath = `${newFullPath}${suffix.replace(/^\//, "")}`;
      await copy(blob.pathname, destinationPath, {
        access: "public",
        token: token ?? undefined,
      });
      await del(blob.pathname, { token: token ?? undefined });
    }

    const firestore = getAdminFirestore();
    const now = Timestamp.now();

    const foldersSnapshot = await firestore
      .collection("userFolders")
      .where("userId", "==", userId)
      .get();

    const batch = firestore.batch();

    foldersSnapshot.forEach((doc) => {
      const data = doc.data();
      const folderPathname = data.pathname as string | undefined;
      if (!folderPathname || !ensureTrailingSlash(folderPathname).startsWith(folderPrefix)) {
        return;
      }

      const newPathname = ensureTrailingSlash(folderPathname).replace(folderPrefix, newFullPath);
      const newRelative = newPathname.replace(prefix, "");
      const newParent = newRelative.replace(/[^/]+\/?$/, "");

      batch.set(
        firestore.collection("userFolders").doc(pathToId(newPathname)),
        {
          ...data,
          name: folderPathname === pathname ? sanitizedNewName : data.name,
          pathname: newPathname,
          relativePath: newRelative,
          parentPath: newParent,
          updatedAt: now,
        },
        { merge: true }
      );

      if (folderPathname !== pathname) {
        batch.delete(doc.ref);
      }
    });

    const filesSnapshot = await firestore
      .collection("userFiles")
      .where("userId", "==", userId)
      .get();

    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      const filePath = data.pathname as string | undefined;
      if (!filePath || !filePath.startsWith(folderPrefix)) {
        return;
      }

      const newPath = filePath.replace(folderPrefix, newFullPath);
      const newRelative = newPath.replace(prefix, "");
      const newParent = newRelative.replace(/[^/]+\/?$/, "");

      batch.set(
        firestore.collection("userFiles").doc(pathToId(newPath)),
        {
          ...data,
          pathname: newPath,
          relativePath: newRelative,
          parentPath: newParent,
          updatedAt: now,
        },
        { merge: true }
      );

      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ pathname: newFullPath, relativePath: newRelativePath });
  } catch (error) {
    console.error("Failed to rename folder", error);
    return NextResponse.json({ error: "Failed to rename folder" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const defaultFolder = await ensureDefaultFolder(userId);
    const body = (await request.json().catch(() => null)) as { pathname?: string } | null;
    const pathnameInput = typeof body?.pathname === "string" ? body.pathname : "";

    if (!pathnameInput) {
      return NextResponse.json({ error: "Folder path is required" }, { status: 400 });
    }

    const prefix = getPrefix(userId);
    assertWithinPrefix(pathnameInput, prefix);

    const normalizedPath = ensureTrailingSlash(pathnameInput);
    if (normalizedPath === defaultFolder.pathname) {
      return NextResponse.json({ error: "The default folder cannot be deleted" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const firestore = getAdminFirestore();

    const toDelete: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await list({
        prefix: normalizedPath,
        token: token ?? undefined,
        mode: "expanded",
        cursor,
      });
      toDelete.push(...result.blobs.map((blob) => blob.pathname));
      cursor = result.hasMore && result.cursor ? result.cursor : undefined;
    } while (cursor);

    if (toDelete.length) {
      await del(toDelete, { token: token ?? undefined });
    }

    const foldersSnapshot = await firestore
      .collection("userFolders")
      .where("userId", "==", userId)
      .get();
    const filesSnapshot = await firestore
      .collection("userFiles")
      .where("userId", "==", userId)
      .get();

    const batch = firestore.batch();

    foldersSnapshot.forEach((doc) => {
      const data = doc.data();
      const folderPathname = data.pathname as string | undefined;
      if (folderPathname && ensureTrailingSlash(folderPathname).startsWith(normalizedPath)) {
        batch.delete(doc.ref);
      }
    });

    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      const filePath = data.pathname as string | undefined;
      if (filePath && filePath.startsWith(normalizedPath)) {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to delete folder", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
