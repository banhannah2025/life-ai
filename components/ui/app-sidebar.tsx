'use client';
import type { ChangeEvent, ComponentType, FormEvent, SVGProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
    DocumentIcon,
    FolderIcon,
    FolderOpenIcon,
} from "@heroicons/react/24/solid";
import {
    ClipboardDocumentListIcon,
    DocumentPlusIcon,
    DocumentTextIcon,
    PhotoIcon,
    PresentationChartBarIcon,
    TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Briefcase, Camera, Clock, FileText, FolderPlus, Gavel, Lightbulb, Loader2, Minus, Pencil, Plus, Trash, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Badge } from "./badge";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "./sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Textarea } from "./textarea";
import { TooltipProvider } from "./tooltip";
import { ensureFirebaseSignedIn } from "@/lib/firebase/client-auth";
import { getUserProfile } from "@/lib/firebase/profile";
import { hasCaseManagementAccess } from "@/lib/auth/roles";
import { isAdminEmail } from "@/lib/admin/config";
import { getPlan } from "@/lib/subscription/plans";
import { fetchRelationships } from "@/lib/social/client";
import { pathToId } from "@/lib/blob/utils";
import { upload } from "@vercel/blob/client";
import type { UserSummary } from "@/lib/social/types";
import type { UserProfile } from "@/lib/profile/schema";
import { useUserPlan } from "@/hooks/use-user-plan";
type FileNode = {
    id: string;
    name: string;
    type: "folder" | "file";
    pathname: string;
    relativePath: string;
    parentPath: string;
    children?: FileNode[];
    url?: string;
    downloadUrl?: string;
    size?: number;
    source?: string;
    isDefault?: boolean;
    docType?: string;
    docId?: string;
    title?: string;
};

type CreateOption = {
    id: "doc" | "sheet" | "slide" | "form" | "drawing" | "upload";
    name: string;
    description: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    accent: string;
};

type AppSidebarProps = {
    side?: "left" | "right";
    mirror?: boolean;
    hideContent?: boolean;
};

const coreOptions: CreateOption[] = [
    {
        id: "doc",
        name: "Blank Doc",
        description: "Word-style document",
        icon: DocumentTextIcon,
        accent: "bg-sky-100 text-sky-600",
    },
    {
        id: "drawing",
        name: "Blank Drawing",
        description: "Canvas",
        icon: PhotoIcon,
        accent: "bg-rose-100 text-rose-600",
    },
    {
        id: "upload",
        name: "Upload",
        description: "Import a file",
        icon: DocumentPlusIcon,
        accent: "bg-slate-100 text-slate-600",
    },
];

const comingSoonOptions: Array<Omit<CreateOption, "accent"> & { accent: string; badge: string }> = [
    {
        id: "sheet",
        name: "Sheets",
        description: "Spreadsheet",
        icon: TableCellsIcon,
        accent: "bg-emerald-100 text-emerald-600",
        badge: "Coming soon",
    },
    {
        id: "slide",
        name: "Slides",
        description: "Presentation deck",
        icon: PresentationChartBarIcon,
        accent: "bg-amber-100 text-amber-600",
        badge: "Coming soon",
    },
    {
        id: "form",
        name: "Forms",
        description: "Survey / intake",
        icon: ClipboardDocumentListIcon,
        accent: "bg-violet-100 text-violet-600",
        badge: "Coming soon",
    },
];

type CaseManagementNavItem = {
    href: string;
    label: string;
    description: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const CASE_MANAGEMENT_NAV_ITEMS: CaseManagementNavItem[] = [
    {
        href: "/case-management",
        label: "Case dashboard",
        description: "Track open matters, assigned teams, and upcoming deadlines.",
        icon: Briefcase,
    },
    {
        href: "/case-management/clients",
        label: "Clients",
        description: "Manage client records, contacts, and associated matters.",
        icon: Users,
    },
    {
        href: "/case-management/time-tracking",
        label: "Time tracking",
        description: "Capture billable time and monitor utilization in real time.",
        icon: Clock,
    },
    {
        href: "/case-management/document-drafting",
        label: "Document drafting",
        description: "Launch templates and collaborate on pleadings, motions, and agreements.",
        icon: FileText,
    },
    {
        href: "/case-management/mock-trial",
        label: "Mock trial portal",
        description: "Plan scrimmages, manage rounds, and capture scorecards.",
        icon: Gavel,
    },
    {
        href: "/case-management/case-analysis",
        label: "Case analysis",
        description: "Maintain issue outlines, arguments, and supporting authorities.",
        icon: Lightbulb,
    },
];

const MULTIPART_THRESHOLD_BYTES = 32 * 1024 * 1024; // 32MB
 
function sanitizeFileName(fileName: string) {
    return fileName
        .toLowerCase()
        .replace(/[^a-z0-9._-]/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

type ApiFileItem = {
    type: "file" | "folder";
    name: string;
    pathname: string;
    relativePath: string;
    parentPath?: string;
    url?: string;
    downloadUrl?: string;
    size?: number;
    source?: string;
    isDefault?: boolean;
    docType?: string;
    title?: string;
};

function depthOf(path: string) {
    if (!path) {
        return 0;
    }
    return path.split("/").filter(Boolean).length;
}

function buildTree(items: ApiFileItem[]): FileNode[] {
    const roots: FileNode[] = [];
    const nodeMap = new Map<string, FileNode>();
    const sorted = [...items].sort((a, b) => depthOf(a.relativePath) - depthOf(b.relativePath));

    const prefixSource = sorted.find((item) => item.pathname);
    const basePrefix = prefixSource
        ? prefixSource.pathname.slice(0, prefixSource.pathname.length - prefixSource.relativePath.length)
        : "";

    const getOrCreateFolder = (
        relativePath: string,
        source = "derived",
        isDefault: boolean | undefined = false,
    ): FileNode | null => {
        if (!relativePath) {
            return null;
        }

        const existing = nodeMap.get(relativePath);
        if (existing) {
            return existing;
        }

        const clean = relativePath.replace(/\/+$/, "");
        const name = clean.split("/").pop() ?? clean;
        const parentPath = relativePath.replace(/[^/]+\/?$/, "");
        const pathname = basePrefix ? `${basePrefix}${relativePath}` : relativePath;

        const node: FileNode = {
            id: pathname,
            name,
            type: "folder",
            pathname,
            relativePath,
            parentPath,
            children: [],
            source,
            isDefault,
        };

        nodeMap.set(relativePath, node);

        const parent = getOrCreateFolder(parentPath, source);
        if (parent) {
            parent.children = parent.children ?? [];
            parent.children.push(node);
        } else {
            roots.push(node);
        }

        return node;
    };

    for (const item of sorted) {
        if (item.type === "folder") {
            const folderNode = getOrCreateFolder(item.relativePath, item.source ?? "firestore", item.isDefault);
            if (folderNode) {
                folderNode.name = item.name;
                folderNode.pathname = item.pathname;
                folderNode.source = item.source ?? folderNode.source;
                folderNode.isDefault = item.isDefault ?? folderNode.isDefault;
            }
            continue;
        }

        const parentPath = item.parentPath ?? "";
        const docType = item.docType;
        const docId = docType ? pathToId(item.pathname) : undefined;
        const parent = parentPath ? getOrCreateFolder(parentPath) : null;
        const node: FileNode = {
            id: item.pathname,
            name: item.name,
            type: "file",
            pathname: item.pathname,
            relativePath: item.relativePath,
            parentPath,
            url: item.url,
            downloadUrl: item.downloadUrl,
            size: item.size,
            source: item.source ?? "blob",
            isDefault: item.isDefault,
            docType,
            docId,
            title: item.title,
        };

        if (parent) {
            parent.children = parent.children ?? [];
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortNodes = (nodes: FileNode[]) => {
        nodes.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        nodes.forEach((node) => {
            if (node.children?.length) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(roots);
    return roots;
}

const FileTree = ({
    nodes,
    expanded,
    onToggle,
    onAddFolder,
    onRename,
    onDelete,
    onOpen,
    disabled = false,
}: {
    nodes: FileNode[];
    expanded: Record<string, boolean>;
    onToggle: (path: string) => void;
    onAddFolder: (node: FileNode) => void;
    onRename: (node: FileNode) => void;
    onDelete: (node: FileNode) => void;
    onOpen: (node: FileNode) => void;
    disabled?: boolean;
}) => {
    return (
        <ul className="space-y-1 text-sm">
            {nodes.map((node) => {
                const isFolder = node.type === "folder";
                const key = node.relativePath || node.id;
                const isExpanded = !!expanded[node.relativePath];

                if (isFolder) {
                    return (
                        <li key={key}>
                            <div className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                                <button
                                    type="button"
                                    onClick={() => onToggle(node.relativePath)}
                                    className="flex flex-1 items-center gap-2"
                                >
                                    {isExpanded ? (
                                        <FolderOpenIcon className="h-4 w-4 text-slate-600" />
                                    ) : (
                                        <FolderIcon className="h-4 w-4 text-slate-600" />
                                    )}
                                    <span>{node.name}</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onAddFolder(node);
                                        }}
                                        className="rounded p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-60"
                                    >
                                        <FolderPlus className="h-3.5 w-3.5" />
                                        <span className="sr-only">Add subfolder</span>
                                    </button>
                                    {!node.isDefault ? (
                                        <>
                                            <button
                                                type="button"
                                                disabled={disabled}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onRename(node);
                                                }}
                                                className="rounded p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-60"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                <span className="sr-only">Rename folder</span>
                                            </button>
                                            <button
                                                type="button"
                                                disabled={disabled}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    onDelete(node);
                                                }}
                                                className="rounded p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-60"
                                            >
                                                <Trash className="h-3.5 w-3.5" />
                                                <span className="sr-only">Delete folder</span>
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                            {isExpanded && node.children?.length ? (
                                <div className="pl-5 pt-1">
                                    <FileTree
                                        nodes={node.children}
                                        expanded={expanded}
                                        onToggle={onToggle}
                                        onAddFolder={onAddFolder}
                                        onRename={onRename}
                                        onDelete={onDelete}
                                        onOpen={onOpen}
                                        disabled={disabled}
                                    />
                                </div>
                            ) : null}
                        </li>
                    );
                }

                return (
                    <li key={key}>
                        <div className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-xs text-slate-600">
                            <button
                                type="button"
                                onClick={() => onOpen(node)}
                                disabled={disabled}
                                className="flex flex-1 items-center gap-2 rounded px-1 py-0.5 text-left transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <DocumentIcon className="h-4 w-4 text-slate-500" />
                                <span className="flex-1 truncate">{node.title ?? node.name}</span>
                            </button>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => onRename(node)}
                                className="rounded p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-60"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="sr-only">Rename file</span>
                            </button>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => onDelete(node)}
                                className="rounded p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Trash className="h-3.5 w-3.5" />
                                <span className="sr-only">Delete file</span>
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export function AppSidebar({ side = "left", mirror = false, hideContent = false }: AppSidebarProps = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
    const [isFilesOpen, setIsFilesOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { isLoaded, isSignedIn, user } = useUser();
    const [fileNodes, setFileNodes] = useState<FileNode[]>([]);
    const [isFilesLoading, setIsFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState<string | null>(null);
    const [isMutatingFiles, setIsMutatingFiles] = useState(false);
    const [defaultFolder, setDefaultFolder] = useState<{ relativePath: string; pathname: string } | null>(null);
    const [creatingDocId, setCreatingDocId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadingFile, setUploadingFile] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [profileDetails, setProfileDetails] = useState<UserProfile | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const [connections, setConnections] = useState<UserSummary[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [connectionsError, setConnectionsError] = useState<string | null>(null);
    const [selectedRecipientId, setSelectedRecipientId] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const emailAddresses = user?.emailAddresses ?? [];
    const isAdminUser = emailAddresses.some((address) => isAdminEmail(address.emailAddress));
    const { planId, loading: planLoading } = useUserPlan();

    const handleToggle = (path: string) => {
        setExpandedNodes((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user?.id) {
            setAvatarUrl(null);
            setUserRole(null);
            setProfileDetails(null);
            return;
        }

        let ignore = false;

        (async () => {
            try {
                await ensureFirebaseSignedIn();
                const profile = await getUserProfile(user.id);
                if (!ignore) {
                    setAvatarUrl(profile.avatarUrl || user.imageUrl || null);
                    setUserRole(profile.role ?? null);
                    setProfileDetails(profile);
                }
            } catch (error) {
                console.error("Failed to load sidebar profile", error);
                if (!ignore) {
                    setAvatarUrl(user.imageUrl || null);
                    setUserRole(null);
                    setProfileDetails(null);
                }
            }
        })();

        return () => {
            ignore = true;
        };
    }, [isLoaded, isSignedIn, user?.id, user?.imageUrl]);

    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        let ignore = false;

        if (!isSignedIn || !user?.id) {
            setConnections([]);
            setSelectedRecipientId("");
            setConnectionsLoading(false);
            setConnectionsError(null);
            return;
        }

        (async () => {
            setConnectionsLoading(true);
            setConnectionsError(null);
            try {
                const relationships = await fetchRelationships();
                if (ignore) {
                    return;
                }

                const deduped = new Map<string, UserSummary>();
                for (const person of [
                    ...relationships.friends,
                    ...relationships.following,
                    ...relationships.followers,
                ]) {
                    if (!person || person.id === user.id) {
                        continue;
                    }
                    if (!deduped.has(person.id)) {
                        deduped.set(person.id, person);
                    }
                }

                const list = Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
                setConnections(list);
                setSelectedRecipientId((prev) => {
                    if (prev && deduped.has(prev)) {
                        return prev;
                    }
                    return list[0]?.id ?? "";
                });
            } catch (error) {
                if (ignore) {
                    return;
                }
                const message = error instanceof Error ? error.message : "Unable to load your connections.";
                setConnectionsError(message);
            } finally {
                if (!ignore) {
                    setConnectionsLoading(false);
                }
            }
        })();

        return () => {
            ignore = true;
        };
    }, [isLoaded, isSignedIn, user?.id]);

    const planMeta = useMemo(() => getPlan(planId), [planId]);

    const canAccessCaseManagement = useMemo(() => {
        if (planLoading) {
            return false;
        }
        if (planMeta.includesCaseManagement) {
            return true;
        }
        if (!planMeta.includesLegalResearch) {
            return isAdminUser;
        }
        return isAdminUser || hasCaseManagementAccess(userRole);
    }, [isAdminUser, userRole, planLoading, planMeta.includesCaseManagement, planMeta.includesLegalResearch]);

    const greeting =
        hasHydrated && isLoaded && isSignedIn && user?.firstName
            ? `Hello ${user.firstName}`
            : "Hello Guest";

    const canManageFiles = isLoaded && isSignedIn && !!user?.id && planMeta.allowsFileManagement;
    const canSendMessages = canManageFiles;

    const resetFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    const refreshFiles = useCallback(
        async (options: { silent?: boolean } = {}) => {
            if (!isSignedIn || !user?.id) {
                setFileNodes([]);
                return;
            }

            if (!options.silent) {
                setIsFilesLoading(true);
            }
            setFilesError(null);

            try {
                const response = await fetch("/api/files", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const payload = (await response.json().catch(() => null)) as
                    | {
                          items?: ApiFileItem[];
                          error?: string;
                          defaultFolder?: { relativePath?: string; pathname?: string };
                      }
                    | null;

                if (!response.ok || !payload) {
                    throw new Error(payload?.error ?? "Unable to load files");
                }

                const items = Array.isArray(payload.items) ? payload.items : [];
                setFileNodes(buildTree(items));

                if (payload.defaultFolder) {
                    const relativePath = payload.defaultFolder.relativePath ?? "";
                    const pathname = payload.defaultFolder.pathname ?? "";
                    if (relativePath || pathname) {
                        setDefaultFolder({ relativePath, pathname });
                        if (relativePath) {
                            setExpandedNodes((prev) =>
                                prev[relativePath]
                                    ? prev
                                    : {
                                          ...prev,
                                          [relativePath]: true,
                                      }
                            );
                        }
                    }
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load files";
                setFilesError(message);
            } finally {
                if (!options.silent) {
                    setIsFilesLoading(false);
                }
            }
        },
        [isSignedIn, user?.id]
    );

    const handleSendDirectMessage = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!canSendMessages) {
                toast.error("Sign in to send messages.");
                return;
            }

            if (!selectedRecipientId) {
                toast.error("Select someone to message.");
                return;
            }

            const trimmed = messageBody.trim();
            if (!trimmed) {
                toast.error("Add a message before sending.");
                return;
            }

            setIsSendingMessage(true);
            try {
                const response = await fetch("/api/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        recipientId: selectedRecipientId,
                        content: trimmed,
                    }),
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    throw new Error(payload?.error ?? "Unable to send message.");
                }

                setMessageBody("");
                toast.success("Message sent.");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to send message.";
                toast.error(message);
            } finally {
                setIsSendingMessage(false);
            }
        },
        [canSendMessages, messageBody, selectedRecipientId]
    );

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        if (!isSignedIn || !user?.id) {
            setFileNodes([]);
            setDefaultFolder(null);
            return;
        }

        void refreshFiles();
    }, [isLoaded, isSignedIn, refreshFiles, user?.id]);

    const handleAvatarChange = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) {
                return;
            }

            if (!user) {
                toast.error("Sign in to update your profile photo.");
                event.target.value = "";
                return;
            }

            setIsAvatarUploading(true);
            try {
                const result = await user.setProfileImage({ file });
                await user.reload?.();
                setAvatarUrl(result?.publicUrl ?? user.imageUrl ?? null);
                toast.success("Profile photo updated.");
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unable to update photo.";
                toast.error("Failed to update photo", { description: message });
            } finally {
                setIsAvatarUploading(false);
                event.target.value = "";
            }
        },
        [user]
    );

    const handleUploadClick = useCallback(() => {
        if (!isSignedIn || !user?.id) {
            toast.error("Sign in to upload files");
            return;
        }

        if (uploadingFile) {
            toast.info("Upload in progress", {
                description: `Uploading ${uploadingFile} (${uploadProgress}%)`,
            });
            return;
        }

        fileInputRef.current?.click();
    }, [isSignedIn, uploadProgress, uploadingFile, user?.id]);

    const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!isSignedIn || !user?.id) {
            toast.error("Sign in to upload files");
            resetFileInput();
            return;
        }

        if (!defaultFolder) {
            toast.error("Preparing your workspace. Please try again in a moment.");
            resetFileInput();
            return;
        }

        const safeName = sanitizeFileName(file.name);
        const timestamp = Date.now();
        const normalizedFolder = defaultFolder.relativePath.replace(/^\/+|\/+$/g, "");
        const folderPrefix = normalizedFolder ? `${normalizedFolder}/` : "";
        const filename = `${timestamp}-${safeName}`;
        const pathname = `uploads/${user.id}/${folderPrefix}${filename}`;
        const shouldUseMultipart = file.size > MULTIPART_THRESHOLD_BYTES;

        setUploadingFile(file.name);
        setUploadProgress(0);

        try {
            const result = await upload(pathname, file, {
                access: "public",
                handleUploadUrl: "/api/blob/upload",
                clientPayload: JSON.stringify({ originalName: file.name, parentPath: folderPrefix }),
                multipart: shouldUseMultipart,
                onUploadProgress: ({ percentage }) => {
                    if (typeof percentage === "number") {
                        setUploadProgress(Math.min(100, Math.round(percentage)));
                    }
                },
            });

            toast.success("Upload complete", {
                description: (
                    <a
                        href={result.downloadUrl || result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                    >
                        View file
                    </a>
                ),
            });

            if (user?.id) {
                const relativeParent = folderPrefix;

                await refreshFiles({ silent: true });

                if (relativeParent) {
                    setExpandedNodes((prev) => ({
                        ...prev,
                        [relativeParent]: true,
                    }));
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Upload failed";
            toast.error("Upload failed", { description: message });
        } finally {
            setUploadingFile(null);
            setUploadProgress(0);
            resetFileInput();
        }
    }, [defaultFolder, isSignedIn, refreshFiles, resetFileInput, user?.id]);

    const handleOpenNode = useCallback(
        (node: FileNode) => {
            if (node.type === "folder") {
                return;
            }

            if (node.docId && node.docType && ["doc", "sheet", "slide", "form", "drawing"].includes(node.docType)) {
                router.push(`/documents/${node.docId}`);
                return;
            }

            const fallbackUrl = node.downloadUrl ?? node.url;
            if (fallbackUrl) {
                window.open(fallbackUrl, "_blank", "noopener,noreferrer");
                return;
            }

            toast.info("Unable to open file", {
                description: "No viewer available for this item yet.",
            });
        },
        [router]
    );

    const handleCreateDocument = useCallback(
        async (type: CreateOption["id"]) => {
            if (!isSignedIn || !user?.id) {
                toast.error("Sign in to create documents");
                return;
            }

            if (type === "upload") {
                handleUploadClick();
                return;
            }

            if (!defaultFolder) {
                toast.error("Preparing your workspace. Please try again in a moment.");
                return;
            }

            let requestedName: string | null = null;

            const promptMap: Record<Exclude<CreateOption["id"], "upload">, { message: string; fallback: string }> = {
                doc: { message: "Document name", fallback: "Untitled Document" },
                sheet: { message: "Spreadsheet name", fallback: "Untitled Sheet" },
                slide: { message: "Presentation name", fallback: "Untitled Deck" },
                form: { message: "Form name", fallback: "Untitled Form" },
                drawing: { message: "Canvas name", fallback: "Untitled Canvas" },
            };

            const nonUploadType = type as Exclude<CreateOption["id"], "upload">;
            const promptConfig = promptMap[nonUploadType];
            if (promptConfig?.message) {
                requestedName = window.prompt(promptConfig.message, promptConfig.fallback);
                if (requestedName === null) {
                    return;
                }
                requestedName = requestedName.trim();
            }

            setCreatingDocId(type);

            try {
                const response = await fetch("/api/documents", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type,
                        folderRelativePath: defaultFolder.relativePath,
                        name: requestedName && requestedName.length ? requestedName : undefined,
                    }),
                });

                const payload = (await response.json().catch(() => null)) as
                    | {
                          docId?: string;
                          title?: string;
                          error?: string;
                          relativePath?: string;
                          parentPath?: string;
                      }
                    | null;

                if (!response.ok || !payload?.docId) {
                    throw new Error(payload?.error ?? "Unable to create document");
                }

                await refreshFiles({ silent: true });

                if (payload.parentPath ?? defaultFolder.relativePath) {
                    const parentPath = payload.parentPath ?? defaultFolder.relativePath;
                    setExpandedNodes((prev) => ({
                        ...prev,
                        [parentPath]: true,
                    }));
                }

                const documentTitle = payload.title ?? "New document";
                setIsCreateOpen(false);
                router.push(`/documents/${payload.docId}`);
                toast.success("Document created", {
                    description: documentTitle,
                    action: payload.docId
                        ? {
                              label: "Open",
                              onClick: () => router.push(`/documents/${payload.docId}`),
                          }
                        : undefined,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to create document";
                toast.error("Document creation failed", { description: message });
            } finally {
                setCreatingDocId(null);
            }
        },
        [defaultFolder, handleUploadClick, isSignedIn, refreshFiles, router, user?.id]
    );

    const handleCreateFolder = useCallback(
        async (parentRelativePath: string) => {
            if (!isSignedIn || !user?.id) {
                toast.error("Sign in to manage folders");
                return;
            }

            const proposedName = window.prompt("Folder name", "New Folder");
            if (!proposedName) {
                return;
            }

            setIsMutatingFiles(true);

            try {
                const response = await fetch("/api/files/folder", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: proposedName, parentPath: parentRelativePath }),
                });
                const payload = (await response.json().catch(() => null)) as
                    | { relativePath?: string; error?: string }
                    | null;

                if (!response.ok || !payload) {
                    throw new Error(payload?.error ?? "Unable to create folder");
                }

                const newRelativePath = payload.relativePath ?? "";

                await refreshFiles({ silent: true });

                setExpandedNodes((prev) => {
                    const updated = { ...prev };
                    if (parentRelativePath) {
                        updated[parentRelativePath] = true;
                    }
                    if (newRelativePath) {
                        updated[newRelativePath] = true;
                    }
                    return updated;
                });

                toast.success("Folder created", {
                    description: proposedName,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to create folder";
                toast.error("Folder creation failed", { description: message });
            } finally {
                setIsMutatingFiles(false);
            }
        },
        [isSignedIn, refreshFiles, user?.id]
    );

    const handleRenameNode = useCallback(
        async (node: FileNode) => {
            if (!isSignedIn || !user?.id) {
                toast.error("Sign in to manage files");
                return;
            }

            if (!node.pathname || !node.pathname.includes("/")) {
                toast.error("This item cannot be renamed right now.");
                return;
            }

            if (node.type === "folder" && node.isDefault) {
                toast.error("The default folder cannot be renamed");
                return;
            }

            const promptLabel = node.type === "folder" ? "folder" : "file";
            const proposedName = window.prompt(`Rename ${promptLabel}`, node.name);

            if (!proposedName || proposedName.trim() === "" || proposedName.trim() === node.name) {
                return;
            }

            setIsMutatingFiles(true);

            try {
                const endpoint = node.type === "folder" ? "/api/files/folder" : "/api/files/file";
                const response = await fetch(endpoint, {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ pathname: node.pathname, newName: proposedName }),
                });
                const payload = (await response.json().catch(() => null)) as
                    | { relativePath?: string; error?: string }
                    | null;

                if (!response.ok || !payload) {
                    throw new Error(payload?.error ?? "Unable to rename");
                }

                await refreshFiles({ silent: true });

                if (node.type === "folder") {
                    const updatedRelative = payload.relativePath ?? node.relativePath;
                    setExpandedNodes((prev) => {
                        const updated = { ...prev };
                        if (prev[node.relativePath]) {
                            delete updated[node.relativePath];
                            updated[updatedRelative] = true;
                        }
                        if (node.parentPath) {
                            updated[node.parentPath] = true;
                        }
                        return updated;
                    });
                }

                const serverRelative = payload.relativePath ?? node.relativePath;
                const newLabel = serverRelative
                    ? serverRelative.replace(/\/+$/, "").split("/").pop() ?? proposedName
                    : proposedName;

                toast.success("Renamed", {
                    description: `${node.name} → ${newLabel}`,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to rename";
                toast.error("Rename failed", { description: message });
            } finally {
                setIsMutatingFiles(false);
            }
        },
        [isSignedIn, refreshFiles, user?.id]
    );

    const handleDeleteNode = useCallback(
        async (node: FileNode) => {
            if (!isSignedIn || !user?.id) {
                toast.error("Sign in to manage files");
                return;
            }

            if (!node.pathname) {
                toast.error("Invalid item selected");
                return;
            }

            if (node.type === "folder" && node.isDefault) {
                toast.error("The default folder cannot be deleted");
                return;
            }

            const confirmMessage =
                node.type === "folder"
                    ? `Delete the folder "${node.name}" and all of its contents?`
                    : `Delete the file "${node.name}"?`;

            if (!window.confirm(confirmMessage)) {
                return;
            }

            setIsMutatingFiles(true);

            try {
                const endpoint = node.type === "folder" ? "/api/files/folder" : "/api/files/file";
                const response = await fetch(endpoint, {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ pathname: node.pathname }),
                });

                const payload = (await response.json().catch(() => null)) as { error?: string } | null;

                if (!response.ok) {
                    throw new Error(payload?.error ?? "Unable to delete");
                }

                await refreshFiles({ silent: true });

                if (node.type === "folder" && node.relativePath) {
                    setExpandedNodes((prev) => {
                        const updated = { ...prev };
                        delete updated[node.relativePath];
                        return updated;
                    });
                }

                if (node.docId && pathname === `/documents/${node.docId}`) {
                    router.push("/");
                }

                toast.success(node.type === "folder" ? "Folder deleted" : "File deleted", {
                    description: node.name,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to delete";
                toast.error("Delete failed", { description: message });
            } finally {
                setIsMutatingFiles(false);
            }
        },
        [isSignedIn, pathname, refreshFiles, router, user?.id]
    );

    const filesBusy = useMemo(
        () => isFilesLoading || isMutatingFiles || creatingDocId !== null,
        [isFilesLoading, isMutatingFiles, creatingDocId]
    );
    const normalizedPathname = pathname ?? "";
    const isCasesRoute = normalizedPathname.startsWith("/case-management") || normalizedPathname.startsWith("/cases");
    const isLegalAnalyticsRoute = normalizedPathname.startsWith("/legal-analytics");
    const socialRoutePrefixes = ["/social", "/people", "/profile", "/message-center"];
    const isSocialRoute = socialRoutePrefixes.some((prefix) => normalizedPathname.startsWith(prefix));
    const shouldShowFileAndDocumentSections = false;
    const shouldShowLegalAnalyticsButton = canAccessCaseManagement && (isCasesRoute || isLegalAnalyticsRoute);
    const isFreePlan = !planLoading && planId === "free";
    const shouldShowSocialProfileSection = isFreePlan || isSocialRoute;
    const shouldShowMessageCenterSection = isSocialRoute;
    const canSubmitMessage = selectedRecipientId !== "" && messageBody.trim().length > 0;
    const contentWrapperDir = mirror ? "ltr" : undefined;
    const fileUploadInputId = mirror ? "sidebar-file-upload-mirror" : "sidebar-file-upload";
    if (hideContent) {
        return (
            <Sidebar
                side={side}
                className={cn(
                    "flex h-[calc(100vh-4rem)] flex-col bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 md:top-16 md:bottom-0 md:h-[calc(100vh-4rem)]",
                    side === "right" ? "border-l border-slate-200" : "border-r border-slate-200"
                )}
            >
                <SidebarHeader className="space-y-1 border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-6 text-left">
                    <div className="text-base font-semibold text-white">{greeting}</div>
                    <p className="text-xs text-white/80">Quick access to your research tools</p>
                </SidebarHeader>
                <SidebarContent className={cn("px-6 py-6", mirror && "[direction:rtl]")} />
            </Sidebar>
        );
    }

    return (
        <Sidebar
            side={side}
            className={cn(
                "flex h-[calc(100vh-4rem)] flex-col bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 md:top-16 md:bottom-0 md:h-[calc(100vh-4rem)]",
                side === "right" ? "border-l border-slate-200" : "border-r border-slate-200"
            )}
        >
            <SidebarHeader className="space-y-1 border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-6 text-left">
                <div className="text-base font-semibold text-white">{greeting}</div>
                <p className="text-xs text-white/80">Quick access to your research tools</p>
            </SidebarHeader>
            <SidebarContent className={cn("px-6 py-6", mirror && "[direction:rtl]")}>
                <div className="flex flex-col gap-6" dir={contentWrapperDir}>
                    {shouldShowLegalAnalyticsButton ? (
                        <Button asChild variant="secondary" className="self-center px-6">
                            <Link href="/legal-analytics">Legal analytics</Link>
                        </Button>
                    ) : null}
                    {canAccessCaseManagement ? (
                        <section className="space-y-3 rounded-xl border border-slate-100 bg-white/85 p-4 shadow-sm">
                            <header className="flex items-center justify-between text-sm font-semibold text-slate-800">
                                <h4>Case management</h4>
                                <Badge variant="outline" className="text-[11px] uppercase tracking-wide text-emerald-600">
                                    {planMeta.name} plan
                                </Badge>
                            </header>
                            <div className="space-y-2">
                                {CASE_MANAGEMENT_NAV_ITEMS.map(({ href, label, description, icon: Icon }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white/90 p-3 text-left text-sm shadow-sm transition hover:border-slate-200 hover:bg-white"
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="space-y-0.5">
                                            <span className="block font-semibold text-slate-800">{label}</span>
                                            <span className="block text-xs text-slate-500">{description}</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/case-management">Open case workspace</Link>
                            </Button>
                        </section>
                    ) : null}
                    {shouldShowSocialProfileSection ? (
                        <section className="space-y-4 rounded-xl border border-slate-100 bg-white/80 p-4 text-center shadow-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-20 w-20 border-2 border-white/80 shadow-lg ring-4 ring-emerald-100">
                                        {avatarUrl ? (
                                            <AvatarImage src={avatarUrl} alt={user?.fullName ?? "Profile avatar"} />
                                        ) : null}
                                        <AvatarFallback className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                                            {profileDetails?.firstName?.[0] ?? "L"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={!user || isAvatarUploading}
                                        className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white text-slate-700 shadow-md transition hover:bg-slate-100 disabled:opacity-60"
                                    >
                                        {isAvatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-semibold text-slate-900">
                                        {profileDetails?.firstName || profileDetails?.lastName
                                            ? `${profileDetails?.firstName ?? ""} ${profileDetails?.lastName ?? ""}`.trim()
                                            : user?.fullName ?? "Your profile"}
                                    </p>
                                    {profileDetails?.headline ? (
                                        <p className="text-sm text-slate-500">{profileDetails.headline}</p>
                                    ) : null}
                                </div>
                            </div>
                            <div className="grid gap-3 text-left text-sm text-slate-600">
                                {profileDetails?.location ? (
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Location</p>
                                        <p className="font-medium text-slate-800">{profileDetails.location}</p>
                                    </div>
                                ) : null}
                                {(profileDetails?.company || profileDetails?.role) ? (
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Organization</p>
                                        <p className="font-medium text-slate-800">
                                            {[profileDetails?.role, profileDetails?.company].filter(Boolean).join(" @ ")}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                            {profileDetails?.summary ? (
                                <p className="rounded-lg bg-slate-50 p-3 text-left text-sm text-slate-600">
                                    {profileDetails.summary.slice(0, 220)}
                                    {profileDetails.summary.length > 220 ? "…" : ""}
                                </p>
                            ) : null}
                            {profileDetails?.skills && profileDetails.skills.length ? (
                                <div className="flex flex-wrap justify-center gap-2">
                                    {profileDetails.skills.slice(0, 5).map((skill) => (
                                        <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}
                            <Button asChild variant="outline" size="sm" className="w-full">
                                <Link href="/profile">View profile</Link>
                            </Button>
                        </section>
                    ) : null}
                    {shouldShowMessageCenterSection ? (
                        <section className="space-y-3 rounded-xl border border-slate-100 bg-white/70 p-4 shadow-sm">
                            <header className="flex items-center justify-between text-sm font-semibold text-slate-800">
                                <h4>Message center</h4>
                                <div className="flex items-center gap-2">
                                    {connectionsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
                                    <Link
                                        href="/message-center"
                                        className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
                                    >
                                        View inbox
                                    </Link>
                                </div>
                            </header>
                            {!isLoaded ? (
                                <p className="text-sm text-slate-500">Preparing your messaging workspace…</p>
                            ) : !canSendMessages ? (
                                <p className="text-sm text-slate-500">Sign in to send direct messages.</p>
                            ) : connectionsError ? (
                                <p className="text-sm text-rose-500">{connectionsError}</p>
                            ) : connections.length ? (
                                <form className="space-y-3" onSubmit={handleSendDirectMessage}>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            <span>Send to</span>
                                            <span className="text-[11px] font-medium normal-case text-slate-400">{connections.length} connections</span>
                                        </div>
                                        <Select
                                            disabled={isSendingMessage || !connections.length}
                                            value={selectedRecipientId || undefined}
                                            onValueChange={setSelectedRecipientId}
                                        >
                                            <SelectTrigger className="w-full justify-between" disabled={isSendingMessage || !connections.length}>
                                                <SelectValue placeholder="Select a person" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {connections.map((person) => (
                                                    <SelectItem key={person.id} value={person.id}>
                                                        {person.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</span>
                                        <Textarea
                                            value={messageBody}
                                            onChange={(event) => setMessageBody(event.target.value)}
                                            rows={4}
                                            maxLength={1000}
                                            placeholder="Share a quick update or question…"
                                            className="resize-none text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <Button
                                            type="submit"
                                            disabled={!canSubmitMessage || isSendingMessage}
                                            className="inline-flex items-center gap-2"
                                        >
                                            {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            Send
                                        </Button>
                                        <p className="text-xs text-slate-400">Messages are private between you and your connection.</p>
                                    </div>
                                </form>
                            ) : connectionsLoading ? (
                                <p className="text-sm text-slate-500">Loading your connections…</p>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    You have no direct connections yet. Visit the{" "}
                                    <Link href="/social" className="font-medium text-slate-600 underline-offset-4 hover:underline">
                                        community feed
                                    </Link>{" "}
                                    to follow colleagues and start messaging.
                                </p>
                            )}
                        </section>
                    ) : null}
                    {!isLoaded && shouldShowFileAndDocumentSections ? (
                        <section className="space-y-3 rounded-xl border border-slate-100 bg-white/70 p-6 shadow-sm">
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                Preparing your workspace…
                            </div>
                        </section>
                    ) : null}

                    {isLoaded ? (
                        <>
                            {shouldShowFileAndDocumentSections ? (
                                canManageFiles ? (
                                    <>
                                        <section className="space-y-3 rounded-xl border border-slate-100 bg-white/70 p-4 shadow-sm">
                                            <header className="flex items-center justify-between text-sm font-semibold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <h4>Manage files</h4>
                                                    {filesBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFilesOpen((prev) => !prev)}
                                                    aria-expanded={isFilesOpen}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                                                >
                                                    {isFilesOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                                    <span className="sr-only">Toggle manage files</span>
                                                </button>
                                            </header>
                                            {isFilesOpen ? (
                                                <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 p-3">
                                                    <div className="mb-3 flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCreateFolder("")}
                                                            disabled={filesBusy}
                                                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                                                        >
                                                            <FolderPlus className="h-3.5 w-3.5" />
                                                            New folder
                                                        </button>
                                                    </div>
                                                    {filesError ? (
                                                        <p className="text-xs text-rose-500">{filesError}</p>
                                                    ) : isFilesLoading && !fileNodes.length ? (
                                                        <p className="text-xs text-slate-500">Loading files…</p>
                                                    ) : fileNodes.length ? (
                                                        <FileTree
                                                            nodes={fileNodes}
                                                            expanded={expandedNodes}
                                                            onToggle={handleToggle}
                                                            onAddFolder={(node) => handleCreateFolder(node.relativePath)}
                                                            onRename={handleRenameNode}
                                                            onDelete={handleDeleteNode}
                                                            onOpen={handleOpenNode}
                                                            disabled={filesBusy}
                                                        />
                                                    ) : (
                                                        <p className="text-xs text-slate-500">No files yet. Upload to get started.</p>
                                                    )}
                                                </div>
                                            ) : null}
                                        </section>

                                        <section className="space-y-3 rounded-xl border border-slate-100 bg-white/70 p-4 shadow-sm">
                                            <header className="flex items-center justify-between text-sm font-semibold text-slate-800">
                                                <h4>Create documents</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreateOpen((prev) => !prev)}
                                                    aria-expanded={isCreateOpen}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                                                >
                                                    {isCreateOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                                    <span className="sr-only">Toggle create options</span>
                                                </button>
                                            </header>
                                            {isCreateOpen ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        {coreOptions.map(({ id, name, description, icon: Icon, accent }) => (
                                                            <button
                                                                key={id}
                                                                type="button"
                                                                onClick={() => handleCreateDocument(id)}
                                                                disabled={isMutatingFiles}
                                                                className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white/80 p-3 text-left shadow-sm transition hover:border-slate-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${accent}`}>
                                                                    <Icon className="h-5 w-5" />
                                                                </span>
                                                                <span className="space-y-1">
                                                                    <span className="block text-sm font-semibold text-slate-800">{name}</span>
                                                                    <span className="block text-xs text-slate-500">{description}</span>
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-4">
                                                        <TooltipProvider delayDuration={0}>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                                    <span>Upload from your device</span>
                                                                    {uploadingFile ? (
                                                                        <span className="flex items-center gap-2 text-slate-500">
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                            Uploading…
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <label
                                                                    htmlFor={fileUploadInputId}
                                                                    className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                                                                >
                                                                    <span>Choose file</span>
                                                                    <span className="text-xs text-slate-400">PDF, DOCX, or image</span>
                                                                </label>
                                                                <input
                                                                    ref={fileInputRef}
                                                                    id={fileUploadInputId}
                                                                    type="file"
                                                                    onChange={handleFileChange}
                                                                    className="hidden"
                                                                />
                                                                <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
                                                                    {comingSoonOptions.map(({ id, icon: Icon, accent, badge }) => (
                                                                        <div
                                                                            key={id}
                                                                            className="flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-full border border-dashed border-slate-200 bg-white/60 text-slate-400"
                                                                        >
                                                                            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accent} opacity-60`}>
                                                                                <Icon className="h-5 w-5" />
                                                                            </span>
                                                                            <span className="text-[10px] font-semibold uppercase">{badge}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </section>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </>
                                ) : (
                                    <section className="rounded-xl border border-slate-100 bg-white/70 p-4 text-sm text-slate-600 shadow-sm">
                                        Sign in to manage and create documents.
                                    </section>
                                )
                            ) : null}
                        </>
                    ) : null}
                </div>
            </SidebarContent>


        </Sidebar>
    );
}
