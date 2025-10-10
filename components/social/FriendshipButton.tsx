"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, UserCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/social/client";

import type { FriendRelationshipStatus } from "./PostList";

type FriendshipButtonProps = {
  targetId: string;
  targetName: string;
  targetAvatarUrl?: string | null;
  status?: FriendRelationshipStatus;
  isFollower?: boolean;
  disabled?: boolean;
  className?: string;
  onStatusChange?: (status: FriendRelationshipStatus, following: boolean) => void;
};

const STATUS_LABEL: Record<FriendRelationshipStatus, string> = {
  friends: "Friends",
  outgoing: "Cancel request",
  incoming: "Accept friend",
  none: "Add friend",
};

function statusVariant(status: FriendRelationshipStatus) {
  switch (status) {
    case "friends":
      return "outline" as const;
    case "outgoing":
      return "secondary" as const;
    case "incoming":
      return "default" as const;
    default:
      return "default" as const;
  }
}

function statusIcon(status: FriendRelationshipStatus, isPending: boolean) {
  if (isPending) {
    return <Clock className="mr-2 h-4 w-4 animate-spin" />;
  }
  switch (status) {
    case "friends":
      return <UserCheck className="mr-2 h-4 w-4" />;
    case "outgoing":
      return <UserX className="mr-2 h-4 w-4" />;
    case "incoming":
      return <UserPlus className="mr-2 h-4 w-4" />;
    default:
      return <UserPlus className="mr-2 h-4 w-4" />;
  }
}

export function FriendshipButton({
  targetId,
  targetName,
  targetAvatarUrl,
  status = "none",
  isFollower = false,
  disabled = false,
  className,
  onStatusChange,
}: FriendshipButtonProps) {
  const [friendStatus, setFriendStatus] = useState<FriendRelationshipStatus>(status);
  const [viewerIsFollowedByTarget, setViewerIsFollowedByTarget] = useState(isFollower);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFriendStatus(status);
  }, [status]);

  useEffect(() => {
    setViewerIsFollowedByTarget(isFollower);
  }, [isFollower]);

  function handleToggle() {
    if (isPending || disabled) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await toggleFollow(targetId, targetName, targetAvatarUrl ?? undefined);
        const nextStatus: FriendRelationshipStatus = result.following
          ? viewerIsFollowedByTarget
            ? "friends"
            : "outgoing"
          : viewerIsFollowedByTarget
          ? "incoming"
          : "none";

        setFriendStatus(nextStatus);
        onStatusChange?.(nextStatus, result.following);

        if (result.following) {
          toast.success(
            viewerIsFollowedByTarget ? `You and ${targetName} are now friends.` : `Friend request sent to ${targetName}.`
          );
        } else {
          toast.success(viewerIsFollowedByTarget ? `Removed ${targetName} as a friend.` : `Friend request cancelled.`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update friendship.");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={statusVariant(friendStatus)}
      className={className}
      disabled={disabled || isPending}
      onClick={handleToggle}
    >
      {statusIcon(friendStatus, isPending)}
      {STATUS_LABEL[friendStatus]}
    </Button>
  );
}
