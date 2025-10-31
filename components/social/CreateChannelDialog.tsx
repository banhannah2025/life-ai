"use client";

import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { createChannel, type SocialChannelDTO } from "@/lib/social/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type CreateChannelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (channel: SocialChannelDTO) => void;
};

export function CreateChannelDialog({ open, onOpenChange, onCreated }: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"topic" | "project">("topic");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setDescription("");
    setType("topic");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Give the channel a name.");
      return;
    }

    startTransition(async () => {
      try {
        const channel = await createChannel({
          name: name.trim(),
          type,
          description: description.trim() ? description.trim() : undefined,
        });

        toast.success("Channel created.");
        onCreated?.(channel);
        resetForm();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create channel.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new space</DialogTitle>
          <DialogDescription>Organise conversations by topic or around the projects your team cares about.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="channel-name">Name</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="AI Research"
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description</Label>
            <Textarea
              id="channel-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain the focus of this channel."
              maxLength={240}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(value) => setType(value as "topic" | "project")}> 
              <div className="flex items-center space-x-3 rounded-lg border border-slate-200 p-3">
                <RadioGroupItem value="topic" id="channel-type-topic" />
                <Label htmlFor="channel-type-topic" className="space-y-0.5">
                  <span className="block text-sm font-semibold text-slate-800">Topic</span>
                  <span className="block text-xs text-slate-500">Great for ongoing themes, workflows, or interests.</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-slate-200 p-3">
                <RadioGroupItem value="project" id="channel-type-project" />
                <Label htmlFor="channel-type-project" className="space-y-0.5">
                  <span className="block text-sm font-semibold text-slate-800">Project</span>
                  <span className="block text-xs text-slate-500">Keep updates, docs, and decisions tied to a project.</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
