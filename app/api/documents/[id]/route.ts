import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { Timestamp } from "firebase-admin/firestore";

import { getDocumentForUser } from "@/lib/blob/documents";
import { getAdminFirestore } from "@/lib/firebase/admin";

async function fetchDocumentContent(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch document content");
  }
  return response.text();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const document = await getDocumentForUser(userId, id);

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!document.downloadUrl) {
      return NextResponse.json({ error: "Document has no content" }, { status: 500 });
    }

    const content = await fetchDocumentContent(document.downloadUrl);

    return NextResponse.json({ content, docType: document.docType ?? "doc" });
  } catch (error) {
    console.error("Failed to load document content", error);
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const document = await getDocumentForUser(userId, id);

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { content?: string; title?: string } | null;

    if (!body?.content && typeof body?.title !== "string") {
      return NextResponse.json({ error: "Content or title is required" }, { status: 400 });
    }

    if (!document.pathname) {
      return NextResponse.json({ error: "Document has no pathname" }, { status: 500 });
    }

    const firestore = getAdminFirestore();
    const inferredContentType =
      document.contentType ??
      (document.docType && document.docType !== "doc" ? "application/json" : "text/html");

    let blobDownloadUrl = document.downloadUrl;
    let blobUrl = document.url;
    let blobSize = document.size;

    if (body.content) {
      const blob = await put(document.pathname, body.content, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN ?? undefined,
        contentType: inferredContentType,
        allowOverwrite: true,
      });
      blobDownloadUrl = blob.downloadUrl;
      blobUrl = blob.url;
      const blobMetadata = blob as typeof blob & { size?: number };
      if (typeof blobMetadata.size === "number") {
        blobSize = blobMetadata.size;
      }
    }

    const updatePayload: Record<string, unknown> = {
      url: blobUrl,
      downloadUrl: blobDownloadUrl,
      updatedAt: Timestamp.now(),
      contentType: inferredContentType,
    };

    if (blobSize) {
      updatePayload.size = blobSize;
    }

    if (typeof body.title === "string") {
      updatePayload.title = body.title.trim() || document.title || "Untitled Document";
    }

    await firestore.collection("userFiles").doc(id).set(updatePayload, { merge: true });

    return NextResponse.json({ status: "ok", url: blobUrl, downloadUrl: blobDownloadUrl });
  } catch (error) {
    console.error("Failed to update document", error);
    const message = error instanceof Error ? error.message : "Failed to update document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
