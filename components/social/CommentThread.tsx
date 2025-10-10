"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { addComment, deleteComment, fetchComments, type SocialCommentDTO } from "@/lib/social/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

type CommentThreadProps = {
  postId: string;
  open: boolean;
  onCommentCountChange?: (count: number) => void;
};

export function CommentThread({ postId, open, onCommentCountChange }: CommentThreadProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<SocialCommentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const initials = useMemo(() => {
    if (!user?.fullName) {
      return "U";
    }
    return user.fullName
      .split(" ")
      .map((segment) => segment.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.fullName]);

  useEffect(() => {
    if (!open || hasLoaded) {
      return;
    }

    setIsLoading(true);
    fetchComments(postId)
      .then((list) => {
        setComments(list);
        onCommentCountChange?.(list.length);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load comments.");
      })
      .finally(() => {
        setIsLoading(false);
        setHasLoaded(true);
      });
  }, [hasLoaded, onCommentCountChange, open, postId]);

  useEffect(() => {
    if (!open) {
      setDraft("");
    }
  }, [open]);

  function handleSubmit() {
    if (!draft.trim()) {
      toast.error("Write a comment first.");
      return;
    }

    startTransition(async () => {
      try {
        const comment = await addComment(postId, draft.trim());
        setComments((prev) => {
          const next = [...prev, comment];
          onCommentCountChange?.(next.length);
          return next;
        });
        setDraft("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to add comment.");
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      try {
        await deleteComment(postId, commentId);
        setComments((prev) => {
          const next = prev.filter((comment) => comment.id !== commentId);
          onCommentCountChange?.(next.length);
          return next;
        });
        toast.success("Comment deleted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete comment.");
      }
    });
  }

  if (!open) {
    return null;
  }

  return (
    <CardContent className="space-y-4 pt-4">
      <SignedIn>
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.imageUrl ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              disabled={isPending}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={isPending || !draft.trim()}>
                {isPending ? "Sending…" : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <MessageCircle className="h-4 w-4" />
          <span>Sign in to join the conversation.</span>
          <Button asChild size="sm">
            <SignInButton />
          </Button>
        </div>
      </SignedOut>

      <Separator />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500">Be the first to comment.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="border border-slate-200 bg-slate-50">
              <CardContent className="flex gap-3 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={comment.author.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {comment.author.name
                      .split(" ")
                      .map((segment) => segment.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{comment.author.name}</span>
                    <time dateTime={comment.createdAt}>
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </time>
                  </div>
                  <p className="text-sm text-slate-700 leading-6">{comment.content}</p>
                </div>
                {comment.viewerCanEdit && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => handleDelete(comment.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  );
}
