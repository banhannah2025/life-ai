import type { SocialAttachment, SocialChannelType, SocialVisibility, UserSummary } from "./types";

export type SocialPostDTO = {
  id: string;
  author: UserSummary;
  content: string;
  attachments: SocialAttachment[];
  tags: string[];
  visibility: SocialVisibility;
  channelId?: string;
  channelName?: string;
  channelType?: SocialChannelType;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  recentLikerIds: string[];
  recentCommenterIds: string[];
  viewerHasLiked?: boolean;
};

export type SocialCommentDTO = {
  id: string;
  postId: string;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
  viewerCanEdit: boolean;
};

type CreatePostPayload = {
  content: string;
  attachments?: SocialAttachment[];
  tags?: string[];
  visibility?: SocialVisibility;
  channelId?: string | null;
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

type ApiError = Error & {
  status?: number;
  details?: unknown;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    let details: unknown;
    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
      if (data?.details) {
        details = data.details;
      }
    } catch {
      // Ignore JSON parse errors and use default message.
    }
    const error = new Error(message || "Request failed") as ApiError;
    error.status = response.status;
    if (details) {
      error.details = details;
    }
    throw error;
  }

  return response.json() as Promise<T>;
}

export async function fetchPosts(params?: { limit?: number; channelId?: string | null }): Promise<SocialPostDTO[]> {
  const search = new URLSearchParams();
  if (params?.limit) {
    search.set("limit", params.limit.toString());
  }
  if (params?.channelId) {
    search.set("channelId", params.channelId);
  }
  const url = `/api/social/posts${search.toString() ? `?${search.toString()}` : ""}`;
  const data = await handleResponse<{ posts: SocialPostDTO[] }>(await fetch(url, { cache: "no-store" }));
  return data.posts;
}

export async function fetchUserPosts(userId: string, params?: { limit?: number }): Promise<SocialPostDTO[]> {
  const search = new URLSearchParams();
  if (params?.limit) {
    search.set("limit", params.limit.toString());
  }
  const url = `/api/social/users/${userId}/posts${search.toString() ? `?${search.toString()}` : ""}`;
  const data = await handleResponse<{ posts: SocialPostDTO[] }>(await fetch(url, { cache: "no-store" }));
  return data.posts;
}

export async function createPost(payload: CreatePostPayload): Promise<SocialPostDTO> {
  const data = await handleResponse<{ post: SocialPostDTO }>(
    await fetch("/api/social/posts", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    })
  );
  return data.post;
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  return handleResponse<{ liked: boolean; likeCount: number }>(
    await fetch(`/api/social/posts/${postId}/likes`, {
      method: "POST",
      headers: JSON_HEADERS,
    })
  );
}

export async function fetchComments(postId: string): Promise<SocialCommentDTO[]> {
  const data = await handleResponse<{ comments: SocialCommentDTO[] }>(
    await fetch(`/api/social/posts/${postId}/comments`, {
      cache: "no-store",
    })
  );
  return data.comments;
}

export async function addComment(postId: string, content: string): Promise<SocialCommentDTO> {
  const data = await handleResponse<{ comment: SocialCommentDTO }>(
    await fetch(`/api/social/posts/${postId}/comments`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ content }),
    })
  );
  return data.comment;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await handleResponse<{ success: boolean }>(
    await fetch(`/api/social/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      headers: JSON_HEADERS,
    })
  );
}

export async function toggleFollow(targetUserId: string, targetName?: string, targetAvatarUrl?: string): Promise<{ following: boolean }> {
  return handleResponse<{ following: boolean }>(
    await fetch("/api/social/follows", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ targetUserId, targetName, targetAvatarUrl }),
    })
  );
}

export async function fetchRelationships(): Promise<{
  following: UserSummary[];
  followers: UserSummary[];
  friends: UserSummary[];
}> {
  return handleResponse<{ following: UserSummary[]; followers: UserSummary[]; friends: UserSummary[] }>(
    await fetch("/api/social/follows", {
      cache: "no-store",
    })
  );
}

export type SocialChannelDTO = {
  id: string;
  name: string;
  slug: string;
  type: SocialChannelType;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  isMember: boolean;
  isDefault?: boolean;
};

type CreateChannelPayload = {
  name: string;
  type: SocialChannelType;
  description?: string;
};

export async function fetchChannels(): Promise<SocialChannelDTO[]> {
  const data = await handleResponse<{ channels: SocialChannelDTO[] }>(
    await fetch("/api/social/channels", {
      cache: "no-store",
    })
  );
  return data.channels;
}

export async function createChannel(payload: CreateChannelPayload): Promise<SocialChannelDTO> {
  const data = await handleResponse<{ channel: SocialChannelDTO }>(
    await fetch("/api/social/channels", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    })
  );
  return data.channel;
}

export async function updateChannelMembership(
  channelId: string,
  action: "join" | "leave" | "toggle" = "toggle"
): Promise<{ channel: SocialChannelDTO; isMember: boolean }> {
  return handleResponse<{ channel: SocialChannelDTO; isMember: boolean }>(
    await fetch(`/api/social/channels/${channelId}/members`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ action }),
    })
  );
}
