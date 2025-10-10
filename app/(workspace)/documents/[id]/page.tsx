import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { DocEditor } from "@/components/documents/DocEditor";
import { DrawingEditor } from "@/components/documents/DrawingEditor";
import { FormEditor, type FormDocumentData } from "@/components/documents/FormEditor";
import { SheetEditor, type SheetData } from "@/components/documents/SheetEditor";
import { SlideEditor, type SlideDeck } from "@/components/documents/SlideEditor";
import { getDocumentForUser } from "@/lib/blob/documents";

export const dynamic = "force-dynamic";

async function loadContent(downloadUrl: string | undefined) {
  if (!downloadUrl) {
    return "";
  }

  const response = await fetch(downloadUrl, { cache: "no-store" });
  if (!response.ok) {
    return "";
  }

  return response.text();
}

function parseJson<T>(raw: string): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type DocumentPageParams = { id: string };

export default async function DocumentPage({ params }: { params: Promise<DocumentPageParams> }) {
  const { id } = await params;
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    const redirectTarget = `/documents/${id}`;
    if (typeof redirectToSignIn === "function") {
      redirectToSignIn({ returnBackUrl: redirectTarget });
    }
    redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectTarget)}`);
  }

  let document = await getDocumentForUser(userId, id);

  if (!document) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    document = await getDocumentForUser(userId, id);
  }

  if (!document) {
    redirect("/");
  }

  const title = document.title || document.name || "Document";
  const docTypeLabel = document.docType?.[0]?.toUpperCase()
    ? `${document.docType?.[0]?.toUpperCase()}${document.docType?.slice(1)}`
    : "Document";

  const rawContent = await loadContent(document.downloadUrl);
  const docType = document.docType ?? "doc";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">
          Type: <span className="font-medium text-slate-700">{docTypeLabel}</span>
        </p>
      </div>

      {docType === "doc" ? (
        <DocEditor documentId={id} initialContent={rawContent || "<p></p>"} initialTitle={title} />
      ) : null}

      {docType === "sheet" ? (
        <SheetEditor documentId={id} initialData={parseJson<SheetData>(rawContent)} />
      ) : null}

      {docType === "slide" ? (
        <SlideEditor documentId={id} initialDeck={parseJson<SlideDeck>(rawContent)} />
      ) : null}

      {docType === "form" ? (
        <FormEditor documentId={id} initialForm={parseJson<FormDocumentData>(rawContent)} />
      ) : null}

      {docType === "drawing" ? (
        <DrawingEditor
          documentId={id}
          initialDrawing={parseJson<unknown>(rawContent)}
          initialTitle={title}
        />
      ) : null}

      {["doc", "sheet", "slide", "form", "drawing"].includes(docType) ? null : (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            This document type isn&apos;t editable yet. Download it to edit or integrate with your preferred editor.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {document.downloadUrl ? (
              <Link
                href={document.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Download
              </Link>
            ) : null}
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
