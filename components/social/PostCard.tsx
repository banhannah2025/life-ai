"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { toggleLike, type SocialPostDTO } from "@/lib/social/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CommentThread } from "./CommentThread";
import type { FriendRelationshipStatus } from "./PostList";
import { FriendshipButton } from "./FriendshipButton";

type PostCardProps = {
  post: SocialPostDTO;
  relationshipStatus?: FriendRelationshipStatus;
  authorIsFollower?: boolean;
  onRelationshipChange?: (authorId: string, following: boolean) => void;
  onPostUpdated?: (postId: string, updates: Partial<SocialPostDTO>) => void;
};

const visibilityLabels: Record<SocialPostDTO["visibility"], string> = {
  public: "Public",
  workspace: "Workspace",
  private: "Private",
};

const channelStyles: Record<NonNullable<SocialPostDTO["channelType"]>, string> = {
  topic: "bg-sky-100 text-sky-700",
  project: "bg-violet-100 text-violet-700",
};

export function PostCard({
  post,
  relationshipStatus = "none",
  authorIsFollower = false,
  onRelationshipChange,
  onPostUpdated,
}: PostCardProps) {
  const { user } = useUser();
  const [liked, setLiked] = useState(post.viewerHasLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isAuthor = user?.id === post.author.id;
  const createdAt = useMemo(() => new Date(post.createdAt), [post.createdAt]);

  const authorInitials = useMemo(() => {
    return post.author.name
      .split(" ")
      .map((segment) => segment.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [post.author.name]);

  async function handleToggleLike() {
    if (isLiking) {
      return;
    }

    setIsLiking(true);
    try {
      const result = await toggleLike(post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      onPostUpdated?.(post.id, { likeCount: result.likeCount, viewerHasLiked: result.liked });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update like.");
    } finally {
      setIsLiking(false);
    }
  }

  function handleCommentCountChange(count: number) {
    setCommentCount(count);
    onPostUpdated?.(post.id, { commentCount: count });
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={post.author.avatarUrl ?? undefined} />
          <AvatarFallback>{authorInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{post.author.name}</span>
            <Badge variant="secondary">{visibilityLabels[post.visibility]}</Badge>
            {post.channelName && (
              <Badge
                className={`border-transparent ${post.channelType ? channelStyles[post.channelType] : "bg-slate-100 text-slate-700"}`}
              >
                {post.channelType === "project" ? "Project" : "Topic"}
                <span className="mx-1 text-slate-500">•</span>
                {post.channelName}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <time dateTime={post.createdAt}>{formatDistanceToNow(createdAt, { addSuffix: true })}</time>
            {post.tags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </span>
            )}
          </div>
        </div>
        {!isAuthor && (
          <FriendshipButton
            targetId={post.author.id}
            targetName={post.author.name}
            targetAvatarUrl={post.author.avatarUrl}
            status={relationshipStatus}
            isFollower={authorIsFollower}
            onStatusChange={(_status, following) => {
              onRelationshipChange?.(post.author.id, following);
            }}
            className="ml-auto"
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-line text-sm leading-6 text-slate-800">{post.content}</p>
        {post.attachments.length > 0 && (
          <div className="space-y-2">
            {post.attachments.map((attachment) => (
              <Button
                key={attachment.id}
                variant="outline"
                asChild
                className="flex w-full items-center justify-between text-left font-normal"
              >
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  <span>
                    {attachment.title ?? attachment.url}
                    {attachment.description && <span className="ml-2 text-xs text-slate-500">{attachment.description}</span>}
                  </span>
                  <Bookmark className="h-4 w-4 text-slate-400" />
                </a>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Button
            variant={liked ? "default" : "ghost"}
            size="sm"
            className="flex items-center gap-2"
            onClick={handleToggleLike}
            disabled={isLiking}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {likeCount}
          </Button>
          <Button variant={commentsOpen ? "default" : "ghost"} size="sm" className="flex items-center gap-2" onClick={() => setCommentsOpen((open) => !open)}>
            <MessageCircle className="h-4 w-4" />
            {commentCount}
          </Button>
        </div>
        <CommentThread postId={post.id} open={commentsOpen} onCommentCountChange={handleCommentCountChange} />
      </CardFooter>
    </Card>
  );
}
