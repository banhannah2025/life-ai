"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useUser } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Code,
  Download,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  PaintBucket,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StatusState = "idle" | "saving" | "saved" | "error";

type DocEditorProps = {
  documentId: string;
  initialContent: string;
  initialTitle: string;
};

type ToolbarButtonProps = {
  icon: ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
};

function ToolbarButton({ icon: Icon, label, onClick, disabled, isActive }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-600 transition hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        isActive ? "bg-white text-slate-900 shadow-sm border-slate-200" : null,
        disabled ? "cursor-not-allowed opacity-60" : null
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function DocEditor({ documentId, initialContent, initialTitle }: DocEditorProps) {
  const { user } = useUser();
  const [title, setTitle] = useState(initialTitle || "Untitled Document");
  const [status, setStatus] = useState<StatusState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const latestContentRef = useRef(initialContent);
  const latestTitleRef = useRef(initialTitle || "Untitled Document");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        horizontalRule: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, protocols: ["http", "https", "mailto"] }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full rounded-md shadow-sm" },
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      HorizontalRule,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[520px] focus:outline-none",
      },
    },
  });

  const saveDocument = useDebouncedCallback(async () => {
    if (!documentId) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: latestContentRef.current,
          title: latestTitleRef.current,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save document");
      }

      setStatus("saved");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }, 700);

  const queueSave = useCallback(() => {
    setStatus("saving");
    setError(null);
    saveDocument();
  }, [saveDocument]);

  useEffect(() => {
    latestTitleRef.current = title || "Untitled Document";
  }, [title]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateHandler = () => {
      latestContentRef.current = editor.getHTML();
      queueSave();
    };

    editor.on("update", updateHandler);

    return () => {
      editor.off("update", updateHandler);
    };
  }, [editor, queueSave]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(initialContent, false);
    latestContentRef.current = initialContent;
  }, [editor, initialContent]);

  const handleManualSave = async () => {
    if (!editor) {
      return;
    }
    setLoading(true);
    latestContentRef.current = editor.getHTML();
    latestTitleRef.current = title || "Untitled Document";
    try {
      setStatus("saving");
      setError(null);
      await saveDocument.flush();
      setStatus("saved");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitle(value);
    latestTitleRef.current = value;
    queueSave();
  };

  const footerMessage = useMemo(() => {
    if (status === "saving") {
      return "Saving…";
    }
    if (status === "saved") {
      return "All changes saved";
    }
    if (status === "error") {
      return error ?? "Failed to save";
    }
    return "Changes will save automatically";
  }, [status, error]);

  const canUndo = editor?.can().undo() ?? false;
  const canRedo = editor?.can().redo() ?? false;

  const applyHeading = (level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };

  const applyList = (type: "bullet" | "ordered" | "task") => {
    if (!editor) {
      return;
    }
    const chain = editor.chain().focus();
    if (type === "bullet") {
      chain.toggleBulletList().run();
    } else if (type === "ordered") {
      chain.toggleOrderedList().run();
    } else {
      chain.toggleTaskList().run();
    }
  };

  const applyAlignment = (alignment: "left" | "center" | "right" | "justify") => {
    editor?.chain().focus().setTextAlign(alignment).run();
  };

  const addHorizontalRule = () => {
    editor?.chain().focus().setHorizontalRule().run();
  };

  const promptForLink = () => {
    if (!editor) {
      return;
    }
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addTableRow = () => editor?.chain().focus().addRowAfter().run();
  const addTableColumn = () => editor?.chain().focus().addColumnAfter().run();
  const deleteTable = () => editor?.chain().focus().deleteTable().run();

  const handleTextColor = (event: ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    editor?.chain().focus().setColor(color).run();
  };

  const clearTextColor = () => editor?.chain().focus().unsetColor().run();

  const handleHighlightColor = (event: ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    editor?.chain().focus().setHighlight({ color }).run();
  };

  const clearHighlightColor = () => editor?.chain().focus().unsetHighlight().run();

  const insertImageFromUrl = () => {
    if (!editor) {
      return;
    }
    const url = window.prompt("Image URL");
    if (!url) {
      return;
    }
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user?.id) {
      return;
    }

    setImageUploading(true);
    try {
      const timestamp = Date.now();
      const safeName = sanitizeFileName(file.name);
      const pathname = `uploads/${user.id}/documents/media/${timestamp}-${safeName}`;
      const result = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        multipart: file.size > 8 * 1024 * 1024,
      });
      const src = result.downloadUrl || result.url;
      editor?.chain().focus().setImage({ src, alt: file.name }).run();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <LoaderIndicator />
        Loading editor…
      </div>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-col gap-3">
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled document"
            className="h-12 border-0 bg-transparent px-0 text-2xl font-semibold text-slate-900 focus-visible:ring-0"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={loading || status === "saving"}
            >
              {loading || status === "saving" ? (
                <span className="flex items-center gap-2">
                  <LoaderIndicator />
                  Saving…
                </span>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Save now
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={insertImageFromUrl}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Insert image URL
            </Button>
            <Button variant="outline" size="sm" onClick={handleImageUploadClick} disabled={imageUploading}>
              <ImageIcon className="mr-2 h-4 w-4" />
              {imageUploading ? "Uploading…" : "Upload image"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
            <ToolbarButton
              icon={Bold}
              label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
            />
            <ToolbarButton
              icon={Italic}
              label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
            />
            <ToolbarButton
              icon={UnderlineIcon}
              label="Underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
            />
            <ToolbarButton
              icon={Strikethrough}
              label="Strikethrough"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
            />
            <ToolbarButton
              icon={Code}
              label="Code"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
            />
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <ToolbarButton
              icon={Heading1}
              label="Heading 1"
              onClick={() => applyHeading(1)}
              isActive={editor.isActive("heading", { level: 1 })}
            />
            <ToolbarButton
              icon={Heading2}
              label="Heading 2"
              onClick={() => applyHeading(2)}
              isActive={editor.isActive("heading", { level: 2 })}
            />
            <ToolbarButton
              icon={Heading3}
              label="Heading 3"
              onClick={() => applyHeading(3)}
              isActive={editor.isActive("heading", { level: 3 })}
            />
            <ToolbarButton
              icon={Pilcrow}
              label="Paragraph"
              onClick={() => editor.chain().focus().setParagraph().run()}
              isActive={editor.isActive("paragraph")}
            />
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <ToolbarButton
              icon={List}
              label="Bullet list"
              onClick={() => applyList("bullet")}
              isActive={editor.isActive("bulletList")}
            />
            <ToolbarButton
              icon={ListOrdered}
              label="Numbered list"
              onClick={() => applyList("ordered")}
              isActive={editor.isActive("orderedList")}
            />
            <ToolbarButton
              icon={CheckSquare}
              label="Checklist"
              onClick={() => applyList("task")}
              isActive={editor.isActive("taskList")}
            />
            <ToolbarButton
              icon={Quote}
              label="Quote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
            />
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <ToolbarButton
              icon={AlignLeft}
              label="Align left"
              onClick={() => applyAlignment("left")}
              isActive={editor.isActive({ textAlign: "left" })}
            />
            <ToolbarButton
              icon={AlignCenter}
              label="Align center"
              onClick={() => applyAlignment("center")}
              isActive={editor.isActive({ textAlign: "center" })}
            />
            <ToolbarButton
              icon={AlignRight}
              label="Align right"
              onClick={() => applyAlignment("right")}
              isActive={editor.isActive({ textAlign: "right" })}
            />
            <ToolbarButton
              icon={AlignJustify}
              label="Justify"
              onClick={() => applyAlignment("justify")}
              isActive={editor.isActive({ textAlign: "justify" })}
            />
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-2 text-xs text-slate-600">
              <Type className="h-3.5 w-3.5" />
              <input
                type="color"
                title="Text color"
                onChange={handleTextColor}
                className="h-6 w-6 cursor-pointer rounded border border-slate-200 bg-white p-0"
              />
            </label>
            <ToolbarButton icon={Eraser} label="Clear text color" onClick={clearTextColor} />
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-2 text-xs text-slate-600">
              <Highlighter className="h-3.5 w-3.5" />
              <input
                type="color"
                title="Highlight color"
                onChange={handleHighlightColor}
                className="h-6 w-6 cursor-pointer rounded border border-slate-200 bg-white p-0"
              />
            </label>
            <ToolbarButton icon={PaintBucket} label="Clear highlight" onClick={clearHighlightColor} />
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <ToolbarButton icon={Link2} label="Add link" onClick={promptForLink} isActive={editor.isActive("link")} />
            <ToolbarButton icon={Minus} label="Remove link" onClick={removeLink} />
            <div className="mx-2 h-6 w-px bg-slate-200" />
            <ToolbarButton icon={ImageIcon} label="Insert image" onClick={handleImageUploadClick} />
            <ToolbarButton icon={TableIcon} label="Insert table" onClick={insertTable} />
            <ToolbarButton icon={Plus} label="Add row" onClick={addTableRow} />
            <ToolbarButton icon={Plus} label="Add column" onClick={addTableColumn} />
            <ToolbarButton icon={TableIcon} label="Delete table" onClick={deleteTable} />
            <ToolbarButton icon={Minus} label="Horizontal rule" onClick={addHorizontalRule} />
            <div className="ml-auto flex items-center gap-1">
              <ToolbarButton icon={Undo2} label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo} />
              <ToolbarButton icon={Redo2} label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b border-slate-200 bg-white">
          <EditorContent editor={editor} />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-slate-50/80 px-6 py-3 text-xs text-slate-500">
        <span>{footerMessage}</span>
        {status === "error" ? <span className="text-rose-500">{error}</span> : null}
      </CardFooter>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
    </Card>
  );
}

function LoaderIndicator() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />;
}
