import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { copy, del } from "@vercel/blob";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { joinPath, pathToId, sanitizePathSegment } from "@/lib/blob/utils";
import { ensureDefaultFolder } from "@/lib/blob/ensure-default-folder";

function getPrefix(userId: string) {
  return `uploads/${userId}`;
}

function assertWithinPrefix(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) {
    throw new Error("Pathname outside user scope");
  }
}

export async function PATCH(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDefaultFolder(userId);
    const body = await request.json();
    const pathname = typeof body?.pathname === "string" ? body.pathname : "";
    const newNameInput = typeof body?.newName === "string" ? body.newName : "";

    if (!pathname || !newNameInput) {
      return NextResponse.json({ error: "Invalid rename request" }, { status: 400 });
    }

    const prefix = getPrefix(userId);
    assertWithinPrefix(pathname, prefix);

    const relativePath = pathname.replace(`${prefix}/`, "");
    const segments = relativePath.split("/");
    const currentName = segments.pop() ?? relativePath;
    const parentPath = segments.join("/");

    const baseTarget = sanitizePathSegment(newNameInput.replace(/\.[^.]+$/, ""));
    const requestedExtension = newNameInput.includes(".")
      ? newNameInput.slice(newNameInput.lastIndexOf("."))
      : "";
    const originalExtension = currentName.includes(".")
      ? currentName.slice(currentName.lastIndexOf("."))
      : "";

    if (!baseTarget) {
      return NextResponse.json({ error: "New file name is required" }, { status: 400 });
    }

    const newName = `${baseTarget}${requestedExtension || originalExtension}`;

    if (newName === currentName) {
      return NextResponse.json({ pathname, relativePath }, { status: 200 });
    }

    const newRelativePath = parentPath ? `${parentPath}/${newName}` : newName;
    const newFullPath = joinPath(prefix, newRelativePath);

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    await copy(pathname, newFullPath, {
      access: "public",
      token: token ?? undefined,
    });
    await del(pathname, { token: token ?? undefined });

    const firestore = getAdminFirestore();
    const now = Timestamp.now();

    const docId = pathToId(pathname);
    const newDocId = pathToId(newFullPath);
    const docRef = firestore.collection("userFiles").doc(docId);
    const snapshot = await docRef.get();

    if (snapshot.exists) {
      const data = snapshot.data() ?? {};
      await firestore.collection("userFiles").doc(newDocId).set(
        {
          ...data,
          pathname: newFullPath,
          relativePath: newRelativePath,
          parentPath: parentPath ? `${parentPath}/` : "",
          name: newName,
          updatedAt: now,
        },
        { merge: true }
      );
      await docRef.delete();
    }

    return NextResponse.json({ pathname: newFullPath, relativePath: newRelativePath });
  } catch (error) {
    console.error("Failed to rename file", error);
    return NextResponse.json({ error: "Failed to rename file" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDefaultFolder(userId);
    const body = (await request.json().catch(() => null)) as { pathname?: string } | null;
    const pathname = typeof body?.pathname === "string" ? body.pathname : "";

    if (!pathname) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    const prefix = getPrefix(userId);
    assertWithinPrefix(pathname, prefix);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    await del(pathname, { token: token ?? undefined });

    const firestore = getAdminFirestore();
    const docId = pathToId(pathname);
    await firestore.collection("userFiles").doc(docId).delete().catch(() => undefined);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Failed to delete file", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
