"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";

import { MAX_POST_LENGTH } from "@/lib/social/types";
import { createPost, type SocialChannelDTO, type SocialPostDTO } from "@/lib/social/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";

type ChannelOption = Pick<SocialChannelDTO, "id" | "name" | "type" | "isMember">;

type PostComposerProps = {
  onPostCreated?: (post: SocialPostDTO) => void;
  channels?: ChannelOption[];
  activeChannelId?: string | null;
};

const visibilityOptions = [
  { value: "workspace", label: "Workspace" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private (only me)" },
] as const;

type VisibilityValue = (typeof visibilityOptions)[number]["value"];

const GENERAL_CHANNEL = "__general";

export function PostComposer({ onPostCreated, channels = [], activeChannelId = null }: PostComposerProps) {
  const { user, isLoaded } = useUser();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<VisibilityValue>("workspace");
  const [isPending, startTransition] = useTransition();
  const [selectedChannel, setSelectedChannel] = useState<string>(activeChannelId ?? GENERAL_CHANNEL);

  const remaining = MAX_POST_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const memberChannels = useMemo(() => channels.filter((channel) => channel.isMember), [channels]);
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
    if (activeChannelId && memberChannels.some((channel) => channel.id === activeChannelId)) {
      setSelectedChannel(activeChannelId);
      return;
    }

    if (!activeChannelId) {
      setSelectedChannel(GENERAL_CHANNEL);
    }
  }, [activeChannelId, memberChannels]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      toast.error("Add a message before posting.");
      return;
    }

    if (isOverLimit) {
      toast.error(`Posts are limited to ${MAX_POST_LENGTH} characters.`);
      return;
    }

    startTransition(async () => {
      try {
        const channelId = selectedChannel === GENERAL_CHANNEL ? undefined : selectedChannel;
        const post = await createPost({
          content: content.trim(),
          visibility,
          channelId,
        });
        setContent("");
        onPostCreated?.(post);
        toast.success("Post published.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to publish post.");
      }
    });
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.imageUrl ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-base font-semibold text-slate-900">Share something with your network</CardTitle>
      </CardHeader>
      <CardContent>
        <SignedIn>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="post-content" className="text-sm font-medium text-slate-700">
                Message
              </Label>
              <Textarea
                id="post-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Celebrate a win, ask for help, or share what you're building…"
                rows={4}
                disabled={isPending || !isLoaded}
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Markdown support coming soon</span>
                <span className={isOverLimit ? "text-red-500 font-medium" : ""}>{remaining} characters left</span>
              </div>
            </div>

            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-6 sm:flex-wrap">
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
                <Label className="text-slate-600">Visibility</Label>
                <Select value={visibility} onValueChange={(value) => setVisibility(value as VisibilityValue)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-3">
                <Label className="text-slate-600">Channel</Label>
                <Select value={selectedChannel} onValueChange={(value) => setSelectedChannel(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="General feed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERAL_CHANNEL}>General feed</SelectItem>
                    {memberChannels.length ? (
                      memberChannels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.type === "project" ? "Project" : "Topic"} · {channel.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_channels" disabled>
                        Join a channel to post there
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !content.trim()}>
                {isPending ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col items-center justify-center gap-3 text-center text-sm text-slate-600">
            <p>You need an account to share updates with the community.</p>
            <Button asChild>
              <SignInButton />
            </Button>
          </div>
        </SignedOut>
      </CardContent>
      <CardFooter className="text-xs text-slate-500">
        Posts help other members discover your work. Be kind and keep it professional.
      </CardFooter>
    </Card>
  );
}
