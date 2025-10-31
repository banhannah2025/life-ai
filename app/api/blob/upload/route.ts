import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { pathToId } from "@/lib/blob/utils";
import { ensureDefaultFolder } from "@/lib/blob/ensure-default-folder";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB
const ALLOWED_CONTENT_TYPES = [
  "application/*",
  "image/*",
  "text/*",
  "audio/*",
  "video/*",
  "multipart/form-data",
  "application/zip",
  "application/x-zip-compressed",
];

function assertPathIsAllowed(pathname: string, userId: string) {
  const normalized = pathname.trim();
  const userPrefix = `uploads/${userId}/`;

  if (!normalized.startsWith(userPrefix)) {
    throw new Error("Invalid upload target");
  }

  if (normalized.includes("..")) {
    throw new Error("Path traversal is not allowed");
  }
}

type GenerateClientTokenPayload = {
  userId: string;
  originalName?: string | null;
  parentPath?: string | null;
};

type ClientPayload = {
  originalName?: unknown;
  parentPath?: unknown;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;

  if (!body || typeof (body as { type?: unknown }).type !== "string") {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const { type } = body as { type: string };
  const isTokenRequest = type === "blob.generate-client-token";

  const authResult = getAuth(request);
  const userId = authResult.userId;

  if (isTokenRequest && !userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    if (userId) {
      await ensureDefaultFolder(userId);
    }
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        if (!userId) {
          throw new Error("Missing user context");
        }

        assertPathIsAllowed(pathname, userId);

        let parsed: ClientPayload | null = null;
        if (clientPayload) {
          try {
            parsed = JSON.parse(clientPayload) as ClientPayload;
          } catch {
            parsed = null;
          }
        }

        const tokenPayload: GenerateClientTokenPayload = {
          userId,
          originalName:
            parsed && typeof parsed.originalName === "string"
              ? parsed.originalName
              : null,
          parentPath:
            parsed && typeof parsed.parentPath === "string"
              ? parsed.parentPath
              : null,
        };

        return {
          maximumSizeInBytes: multipart ? MAX_UPLOAD_SIZE_BYTES : MAX_UPLOAD_SIZE_BYTES,
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(tokenPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) {
          return;
        }

        try {
          const parsed = JSON.parse(tokenPayload) as GenerateClientTokenPayload;
          const firestore = getAdminFirestore();
          const docId = pathToId(blob.pathname);
          const prefix = `uploads/${parsed.userId}/`;
          const relativePath = blob.pathname.startsWith(prefix)
            ? blob.pathname.slice(prefix.length)
            : blob.pathname;
          const computedParentPath = relativePath.replace(/[^/]+\/?$/, "");
          const parentPath = parsed.parentPath ?? computedParentPath;
          const name = relativePath.split("/").pop() ?? blob.pathname;
          const blobMeta = blob as typeof blob & { size?: number; uploadedAt?: string };

          const uploadedAtTimestamp =
            blobMeta.uploadedAt != null ? Timestamp.fromDate(new Date(blobMeta.uploadedAt)) : Timestamp.now();

          const updatePayload: Record<string, unknown> = {
            userId: parsed.userId,
            pathname: blob.pathname,
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            contentType: blob.contentType,
            originalName: parsed.originalName ?? null,
            name,
            relativePath,
            parentPath,
            updatedAt: Timestamp.now(),
            uploadedAt: uploadedAtTimestamp,
          };

          if (typeof blobMeta.size === "number") {
            updatePayload.size = blobMeta.size;
          }

          await firestore.collection("userFiles").doc(docId).set(updatePayload, { merge: true });
        } catch (error) {
          console.error("Failed to parse upload completion payload", error);
        }
      },
    });

    if (response.type === "blob.generate-client-token") {
      return NextResponse.json(response);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Vercel Blob upload error", error);
    return NextResponse.json({ error: "Failed to handle upload" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
