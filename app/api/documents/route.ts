import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { Timestamp } from "firebase-admin/firestore";

import { ensureDefaultFolder } from "@/lib/blob/ensure-default-folder";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  DEFAULT_FOLDER_RELATIVE_PATH,
  joinPath,
  pathToId,
  sanitizePathSegment,
} from "@/lib/blob/utils";

const DOCUMENT_TEMPLATES: Record<
  string,
  {
    extension: string;
    defaultTitle: string;
    content: string;
    contentType: string;
  }
> = {
  doc: {
    extension: "html",
    defaultTitle: "Untitled Document",
    content: "<h1>Untitled Document</h1><p>Start writing...</p>",
    contentType: "text/html",
  },
  sheet: {
    extension: "json",
    defaultTitle: "Untitled Sheet",
    content: JSON.stringify(
      {
        columns: ["Column A", "Column B", "Column C"],
        rows: [],
      },
      null,
      2
    ),
    contentType: "application/json",
  },
  slide: {
    extension: "json",
    defaultTitle: "Untitled Deck",
    content: JSON.stringify(
      {
        slides: [{ title: "New Slide", notes: "" }],
      },
      null,
      2
    ),
    contentType: "application/json",
  },
  form: {
    extension: "json",
    defaultTitle: "Untitled Form",
    content: JSON.stringify(
      {
        fields: [
          { label: "Name", type: "short-text", required: false },
          { label: "Email", type: "email", required: false },
        ],
      },
      null,
      2
    ),
    contentType: "application/json",
  },
  drawing: {
    extension: "json",
    defaultTitle: "Untitled Canvas",
    content: JSON.stringify(
      {
        elements: [],
        metadata: { background: "#ffffff" },
      },
      null,
      2
    ),
    contentType: "application/json",
  },
};

type CreateDocumentPayload = {
  type?: string;
  name?: string;
  folderRelativePath?: string | null;
};

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as CreateDocumentPayload | null;

    if (!body?.type) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 });
    }

    const template = DOCUMENT_TEMPLATES[body.type];

    if (!template) {
      return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const defaultFolder = await ensureDefaultFolder(userId);

    const folderRelativeInput = (body.folderRelativePath ?? defaultFolder.relativePath ?? DEFAULT_FOLDER_RELATIVE_PATH).trim();
    const folderSegment = folderRelativeInput.replace(/^\/+|\/+$/g, "");
    const parentPath = folderSegment ? `${folderSegment}/` : "";

    const requestedTitle = body.name?.trim();
    const baseTitle = requestedTitle && requestedTitle.length > 0 ? requestedTitle : template.defaultTitle;
    const sanitizedBase = sanitizePathSegment(baseTitle.toLowerCase()) || template.defaultTitle.toLowerCase().replace(/\s+/g, "-");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${sanitizedBase}-${timestamp}.${template.extension}`;

    const relativePath = parentPath ? `${parentPath}${fileName}` : fileName;
    const pathname = joinPath(`uploads/${userId}`, relativePath);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const blob = await put(pathname, template.content, {
      access: "public",
      token: token ?? undefined,
      contentType: template.contentType,
    });

    const docId = pathToId(blob.pathname);
    const now = Timestamp.now();
    const title = baseTitle;
    const blobMetadata = blob as typeof blob & { size?: number };
    const size =
      typeof blobMetadata.size === "number"
        ? blobMetadata.size
        : Buffer.byteLength(template.content, "utf8");

    await firestore
      .collection("userFiles")
      .doc(docId)
      .set(
        {
          userId,
          pathname: blob.pathname,
          name: fileName,
          title,
          docType: body.type,
          relativePath,
          parentPath,
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          contentType: blob.contentType,
          size,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

    return NextResponse.json({
      docId,
      title,
      docType: body.type,
      pathname: blob.pathname,
      relativePath,
      parentPath,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    });
  } catch (error) {
    console.error("Failed to create document", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
