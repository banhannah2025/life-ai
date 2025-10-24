import type { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { buildPostSearchTerms, extractSearchTokens } from "@/lib/search/keywords";

import type {
  SocialAttachment,
  SocialComment,
  SocialCommentRecord,
  SocialPost,
  SocialPostRecord,
  SocialVisibility,
  UserSummary,
} from "../types";
import { assertChannelExists, isChannelMember } from "./channels";

type CreatePostInput = {
  author: UserSummary;
  content: string;
  attachments?: SocialAttachment[];
  tags?: string[];
  visibility?: SocialVisibility;
  channelId?: string;
};

type UpdatePostInput = {
  postId: string;
  editorId: string;
  content: string;
  attachments?: SocialAttachment[];
  tags?: string[];
  visibility?: SocialVisibility;
};

const POSTS_COLLECTION = "social_posts";
const COMMENTS_SUBCOLLECTION = "comments";
const LIKES_SUBCOLLECTION = "likes";

function isIndexMissingError(error: unknown): boolean {
  return error instanceof Error && /FAILED_PRECONDITION/.test(error.message);
}

function postsCollection() {
  return getAdminFirestore().collection(POSTS_COLLECTION);
}

function toUserSummary(record: { authorId: string; authorName: string; authorAvatarUrl?: string }): UserSummary {
  return {
    id: record.authorId,
    name: record.authorName,
    avatarUrl: record.authorAvatarUrl,
  };
}

function toPost(snapshot: QueryDocumentSnapshot<SocialPostRecord> | DocumentSnapshot<SocialPostRecord>, viewerHasLiked?: boolean): SocialPost {
  const data = snapshot.data();

  if (!data) {
    throw new Error("Missing post data");
  }

  return {
    id: snapshot.id,
    author: toUserSummary(data),
    content: data.content,
    attachments: data.attachments ?? [],
    tags: data.tags ?? [],
    visibility: data.visibility,
    channelId: data.channelId ?? undefined,
    channelName: data.channelName ?? undefined,
    channelType: data.channelType ?? undefined,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    likeCount: data.likeCount,
    commentCount: data.commentCount,
    recentLikerIds: data.recentLikerIds ?? [],
    recentCommenterIds: data.recentCommenterIds ?? [],
    viewerHasLiked,
  };
}

function toComment(snapshot: QueryDocumentSnapshot<SocialCommentRecord> | DocumentSnapshot<SocialCommentRecord>, viewerId: string | null): SocialComment {
  const data = snapshot.data();
  if (!data) {
    throw new Error("Missing comment data");
  }
  return {
    id: snapshot.id,
    postId: data.postId,
    author: {
      id: data.authorId,
      name: data.authorName,
      avatarUrl: data.authorAvatarUrl,
    },
    content: data.content,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    viewerCanEdit: viewerId === data.authorId,
  };
}

export async function createPost({
  author,
  content,
  attachments = [],
  tags = [],
  visibility = "workspace",
  channelId,
}: CreatePostInput): Promise<SocialPost> {
  const now = FieldValue.serverTimestamp();
  let channelData:
    | {
        id: string;
        name: string;
        type: SocialPostRecord["channelType"];
      }
    | null = null;

  if (channelId) {
    const channel = await assertChannelExists(channelId);
    const isMember = await isChannelMember(channelId, author.id);
    if (!isMember) {
      throw new Error("Join the channel before posting.");
    }
    channelData = {
      id: channel.id,
      name: channel.name,
      type: channel.type,
    };
  }

  const docRef = postsCollection().doc();
  const searchTerms = buildPostSearchTerms({
    content,
    tags,
    authorName: author.name,
    channelName: channelData?.name ?? null,
  });

  await docRef.set({
    authorId: author.id,
    authorName: author.name,
    ...(author.avatarUrl ? { authorAvatarUrl: author.avatarUrl } : {}),
    content,
    attachments,
    tags,
    visibility,
    channelId: channelData?.id ?? null,
    channelName: channelData?.name ?? null,
    channelType: channelData?.type ?? null,
    createdAt: now,
    updatedAt: now,
    likeCount: 0,
    commentCount: 0,
    recentLikerIds: [],
    recentCommenterIds: [],
    searchTerms,
  });

  const snapshot = (await docRef.get()) as DocumentSnapshot<SocialPostRecord>;
  if (!snapshot.exists) {
    throw new Error("Failed to create post");
  }

  return toPost(snapshot);
}

export async function updatePost({
  postId,
  editorId,
  content,
  attachments = [],
  tags = [],
  visibility,
}: UpdatePostInput): Promise<SocialPost> {
  const docRef = postsCollection().doc(postId);

  await getAdminFirestore().runTransaction(async (tx) => {
    const snapshot = await tx.get(docRef);
    if (!snapshot.exists) {
      throw new Error("Post not found");
    }

    const data = snapshot.data() as SocialPostRecord;
    if (data.authorId !== editorId) {
      throw new Error("Only authors can edit their posts");
    }

    const nextTags = tags ?? [];
    const searchTerms = buildPostSearchTerms({
      content,
      tags: nextTags,
      authorName: data.authorName,
      channelName: data.channelName ?? null,
    });

    tx.update(docRef, {
      content,
      attachments,
      tags: nextTags,
      visibility: visibility ?? data.visibility,
      searchTerms,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const refreshedSnapshot = (await docRef.get()) as DocumentSnapshot<SocialPostRecord>;
  if (!refreshedSnapshot.exists) {
    throw new Error("Failed to load updated post");
  }

  return toPost(refreshedSnapshot);
}

export async function deletePost(postId: string, requesterId: string): Promise<void> {
  const docRef = postsCollection().doc(postId);

  await getAdminFirestore().runTransaction(async (tx) => {
    const snapshot = await tx.get(docRef);
    if (!snapshot.exists) {
      throw new Error("Post not found");
    }

    const data = snapshot.data() as SocialPostRecord;
    if (data.authorId !== requesterId) {
      throw new Error("Only authors can delete their posts");
    }

    tx.delete(docRef);
  });
}

export async function listRecentPosts({
  limit = 25,
  viewerId,
  channelId,
}: {
  limit?: number;
  viewerId?: string | null;
  channelId?: string | null;
}): Promise<SocialPost[]> {
  let snapshot: QuerySnapshot<SocialPostRecord> | undefined;
  try {
    let query = postsCollection().orderBy("createdAt", "desc").limit(limit);

    if (channelId) {
      query = postsCollection().where("channelId", "==", channelId).orderBy("createdAt", "desc").limit(limit);
    }

    snapshot = (await query.get()) as QuerySnapshot<SocialPostRecord>;
  } catch (error) {
    if (!channelId || !isIndexMissingError(error)) {
      throw error;
    }
    snapshot = (await postsCollection().where("channelId", "==", channelId).limit(limit * 2).get()) as QuerySnapshot<SocialPostRecord>;
  }

  if (!snapshot?.size) {
    return [];
  }

  const posts = (snapshot.docs as Array<QueryDocumentSnapshot<SocialPostRecord>>)
    .slice()
    .sort((a, b) => {
      const aTime = a.data()?.createdAt?.toMillis?.() ?? 0;
      const bTime = b.data()?.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);

  if (!viewerId) {
    return posts.map((doc) => toPost(doc));
  }

  const likes = await Promise.all(
    posts.map(async (doc) => {
      const likeRef = doc.ref.collection(LIKES_SUBCOLLECTION).doc(viewerId);
      const likeSnapshot = await likeRef.get();
      return likeSnapshot.exists;
    })
  );

  return posts.map((doc, index) => toPost(doc, likes[index]));
}

export async function listPostsByAuthor({
  authorId,
  viewerId,
  limit = 25,
}: {
  authorId: string;
  viewerId?: string | null;
  limit?: number;
}): Promise<SocialPost[]> {
  if (!authorId) {
    return [];
  }

  let snapshot: QuerySnapshot<SocialPostRecord> | undefined;
  try {
    snapshot = (await postsCollection()
      .where("authorId", "==", authorId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get()) as QuerySnapshot<SocialPostRecord>;
  } catch (error) {
    if (!isIndexMissingError(error)) {
      throw error;
    }
    snapshot = (await postsCollection().where("authorId", "==", authorId).limit(limit * 2).get()) as QuerySnapshot<SocialPostRecord>;
  }

  if (!snapshot?.size) {
    return [];
  }

  const posts = (snapshot.docs as Array<QueryDocumentSnapshot<SocialPostRecord>>)
    .slice()
    .sort((a, b) => {
      const aTime = a.data()?.createdAt?.toMillis?.() ?? 0;
      const bTime = b.data()?.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);

  if (!viewerId) {
    return posts.map((doc) => toPost(doc));
  }

  const likes = await Promise.all(
    posts.map(async (doc) => {
      const likeRef = doc.ref.collection(LIKES_SUBCOLLECTION).doc(viewerId);
      const likeSnapshot = await likeRef.get();
      return likeSnapshot.exists;
    })
  );

  return posts.map((doc, index) => toPost(doc, likes[index]));
}

export async function searchPosts({
  query,
  limit = 25,
  viewerId,
}: {
  query: string;
  limit?: number;
  viewerId?: string | null;
}): Promise<SocialPost[]> {
  const tokens = extractSearchTokens(query).slice(0, 5);
  if (!tokens.length) {
    return [];
  }

  const [firstToken, ...restTokens] = tokens;

  let snapshot: QuerySnapshot<SocialPostRecord> | undefined;
  try {
    snapshot = (await postsCollection()
      .where("searchTerms", "array-contains", firstToken)
      .orderBy("createdAt", "desc")
      .limit(limit * 3)
      .get()) as QuerySnapshot<SocialPostRecord>;
  } catch (error) {
    if (!isIndexMissingError(error)) {
      throw error;
    }
    snapshot = (await postsCollection()
      .where("searchTerms", "array-contains", firstToken)
      .limit(limit * 5)
      .get()) as QuerySnapshot<SocialPostRecord>;
  }

  if (!snapshot?.size) {
    return [];
  }

  const matchingDocs = (snapshot.docs as Array<QueryDocumentSnapshot<SocialPostRecord>>)
    .filter((doc) => {
      if (!restTokens.length) {
        return true;
      }
      const data = doc.data();
      const terms = data.searchTerms ?? [];
      return restTokens.every((token) => terms.includes(token));
    })
    .sort((a, b) => {
      const aTime = a.data()?.createdAt?.toMillis?.() ?? 0;
      const bTime = b.data()?.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);

  if (!viewerId) {
    return matchingDocs.map((doc) => toPost(doc));
  }

  const likes = await Promise.all(
    matchingDocs.map(async (doc) => {
      const likeRef = doc.ref.collection(LIKES_SUBCOLLECTION).doc(viewerId);
      const likeSnapshot = await likeRef.get();
      return likeSnapshot.exists;
    })
  );

  return matchingDocs.map((doc, index) => toPost(doc, likes[index]));
}

export async function togglePostLike(postId: string, user: UserSummary): Promise<{ liked: boolean; likeCount: number }> {
  const postRef = postsCollection().doc(postId);
  const likeRef = postRef.collection(LIKES_SUBCOLLECTION).doc(user.id);

  return getAdminFirestore().runTransaction(async (tx) => {
    const postSnapshot = await tx.get(postRef);
    if (!postSnapshot.exists) {
      throw new Error("Post not found");
    }

    const likeSnapshot = await tx.get(likeRef);
    const postData = postSnapshot.data() as SocialPostRecord;

    if (likeSnapshot.exists) {
      tx.delete(likeRef);
      tx.update(postRef, {
        likeCount: FieldValue.increment(-1),
        recentLikerIds: FieldValue.arrayRemove(user.id),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        liked: false,
        likeCount: postData.likeCount - 1,
      };
    }

    tx.set(likeRef, {
      userId: user.id,
      userName: user.name,
      userAvatarUrl: user.avatarUrl ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(postRef, {
      likeCount: FieldValue.increment(1),
      recentLikerIds: FieldValue.arrayUnion(user.id),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      liked: true,
      likeCount: postData.likeCount + 1,
    };
  });
}

export async function listComments(postId: string, viewerId: string | null): Promise<SocialComment[]> {
  const postRef = postsCollection().doc(postId);
  const snapshot = (await postRef
    .collection(COMMENTS_SUBCOLLECTION)
    .orderBy("createdAt", "asc")
    .limit(100)
    .get()) as QuerySnapshot<SocialCommentRecord>;

  if (!snapshot.size) {
    return [];
  }

  return (snapshot.docs as Array<QueryDocumentSnapshot<SocialCommentRecord>>).map((doc) => toComment(doc, viewerId));
}

export async function addComment({
  postId,
  author,
  content,
}: {
  postId: string;
  author: UserSummary;
  content: string;
}): Promise<SocialComment> {
  const postRef = postsCollection().doc(postId);
  const commentRef = postRef.collection(COMMENTS_SUBCOLLECTION).doc();

  await getAdminFirestore().runTransaction(async (tx) => {
    const postSnapshot = await tx.get(postRef);
    if (!postSnapshot.exists) {
      throw new Error("Post not found");
    }

    tx.set(commentRef, {
      postId,
      authorId: author.id,
      authorName: author.name,
      ...(author.avatarUrl ? { authorAvatarUrl: author.avatarUrl } : {}),
      content,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(postRef, {
      commentCount: FieldValue.increment(1),
      recentCommenterIds: FieldValue.arrayUnion(author.id),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const snapshot = (await commentRef.get()) as DocumentSnapshot<SocialCommentRecord>;
  if (!snapshot.exists) {
    throw new Error("Failed to create comment");
  }

  return toComment(snapshot, author.id);
}

export async function removeComment({
  postId,
  commentId,
  requesterId,
}: {
  postId: string;
  commentId: string;
  requesterId: string;
}): Promise<void> {
  const postRef = postsCollection().doc(postId);
  const commentRef = postRef.collection(COMMENTS_SUBCOLLECTION).doc(commentId);

  await getAdminFirestore().runTransaction(async (tx) => {
    const [postSnapshot, commentSnapshot] = await Promise.all([tx.get(postRef), tx.get(commentRef)]);

    if (!postSnapshot.exists || !commentSnapshot.exists) {
      throw new Error("Comment not found");
    }

    const commentData = commentSnapshot.data() as SocialCommentRecord;
    if (commentData.authorId !== requesterId) {
      throw new Error("Only authors can delete their comments");
    }

    tx.delete(commentRef);
    tx.update(postRef, {
      commentCount: FieldValue.increment(-1),
      recentCommenterIds: FieldValue.arrayRemove(requesterId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
