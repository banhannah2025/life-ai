"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { saveUserProfile, getUserProfile, type UserProfile } from "@/lib/firebase/profile";
import { ensureFirebaseSignedIn } from "@/lib/firebase/client-auth";

type FormState = UserProfile & {
  skillsInput: string;
};

type ProfileFormProps = {
  mode?: "default" | "onboarding";
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  headline: "",
  summary: "",
  location: "",
  company: "",
  role: "",
  website: "",
  skills: [],
  avatarUrl: "",
  planId: "free",
  planActivatedAt: null,
  updatedAt: null,
  skillsInput: "",
};

export function ProfileForm({ mode = "default" }: ProfileFormProps) {
  const { user, isLoaded } = useUser();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [aiBusyField, setAiBusyField] = useState<"headline" | "summary" | null>(null);

  const userId = useMemo(() => (isLoaded ? user?.id ?? null : null), [isLoaded, user?.id]);
  const clerkFirstName = user?.firstName ?? "";
  const clerkLastName = user?.lastName ?? "";
  const clerkImageUrl = user?.imageUrl ?? "";
  const isOnboarding = mode === "onboarding";

  useEffect(() => {
    if (!userId) {
      return;
    }

    let ignore = false;

    (async () => {
      try {
        await ensureFirebaseSignedIn();
        const profile = await getUserProfile(userId);
        if (ignore) return;
        setForm({
          ...profile,
          firstName: profile.firstName || clerkFirstName || "",
          lastName: profile.lastName || clerkLastName || "",
          avatarUrl: profile.avatarUrl || clerkImageUrl || "",
          planId: profile.planId ?? "free",
          planActivatedAt: profile.planActivatedAt ?? null,
          skillsInput: profile.skills?.join(", ") ?? "",
        });
        setAvatarPreview(profile.avatarUrl || clerkImageUrl || null);
      } catch (error) {
        console.error("Failed to load profile", error);
        if (!ignore) {
          setStatus("Unable to load profile details.");
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [userId, clerkFirstName, clerkLastName, clerkImageUrl, user?.firstName, user?.lastName, user?.imageUrl]);

  if (!isLoaded) {
    return <div className="text-sm text-slate-600">Loading user…</div>;
  }

  if (!userId) {
    return <div className="text-sm text-slate-600">Sign in to manage your profile.</div>;
  }

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(form.avatarUrl || clerkImageUrl || null);
    }
  };

  const handleAvatarClear = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setForm((prev) => ({
      ...prev,
      avatarUrl: "",
    }));
  };

  const handleAiRefine = async (field: "headline" | "summary") => {
    const value = field === "headline" ? form.headline ?? "" : form.summary ?? "";
    if (!value.trim()) {
      toast.error("Write a draft first so Synthesis AI can help refine it.");
      return;
    }

    setAiBusyField(field);
    setStatus(null);

    try {
      const response = await fetch("/api/profiles/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "Synthesis AI could not refine that field right now.";
        toast.error(message);
        setStatus(message);
        return;
      }

      const suggestion = typeof payload?.suggestion === "string" ? payload.suggestion.trim() : "";
      if (!suggestion.length) {
        toast.error("Synthesis AI returned an empty suggestion.");
        return;
      }

      setForm((previous) => ({
        ...previous,
        [field]: suggestion,
      }));
      toast.success("Synthesis AI polished your writing.");
      setStatus("Synthesis AI polished your writing.");
    } catch (error) {
      console.error("Profile refine failed", error);
      toast.error("Unable to contact Synthesis AI right now.");
    } finally {
      setAiBusyField(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      await ensureFirebaseSignedIn();

      const skills = form.skillsInput
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const trimmedHeadline = form.headline?.trim() ?? "";
      const trimmedSummary = form.summary?.trim() ?? "";

      if (isOnboarding && (!trimmedHeadline || !trimmedSummary)) {
        setStatus("Add a tagline and bio so the community can get to know you.");
        return;
      }

      let avatarUrl = form.avatarUrl || clerkImageUrl || "";

      if (avatarFile && user) {
        const image = await user.setProfileImage({ file: avatarFile });
        await user.reload?.();
        avatarUrl = image?.publicUrl ?? user.imageUrl ?? "";
        setAvatarFile(null);
        setAvatarPreview(avatarUrl || null);
      }

      const payload: UserProfile = {
        firstName: form.firstName,
        lastName: form.lastName,
        headline: trimmedHeadline,
        summary: trimmedSummary,
        location: form.location,
        company: form.company,
        role: form.role,
        website: form.website,
        skills,
        avatarUrl,
        planId: form.planId ?? "free",
      };

      await saveUserProfile(userId, payload);
      setForm((prev) => ({ ...prev, avatarUrl }));
      setStatus(isOnboarding ? "Profile saved! Welcome to the community." : "Profile saved successfully.");
    } catch (error) {
      console.error("Failed to save profile", error);
      setStatus("Unable to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Profile photo</h2>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="Profile preview" fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-500">
                Life-AI
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <Input type="file" accept="image/*" onChange={handleAvatarChange} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAvatarClear} disabled={!form.avatarUrl && !avatarPreview}>
                Remove photo
              </Button>
            </div>
            <p className="text-xs text-slate-500">Recommended square image, 1 MB max.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="firstName">
            First name
          </label>
          <Input id="firstName" value={form.firstName} onChange={handleChange("firstName")} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="lastName">
            Last name
          </label>
          <Input id="lastName" value={form.lastName} onChange={handleChange("lastName")} required />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="headline">
            Profile tagline
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-emerald-600 hover:bg-emerald-50"
            onClick={() => handleAiRefine("headline")}
            disabled={aiBusyField === "headline"}
          >
            {aiBusyField === "headline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="text-xs font-semibold uppercase tracking-wide">Refine</span>
          </Button>
        </div>
        <Input
          id="headline"
          placeholder="Community advocate blending restorative justice and legal strategy."
          value={form.headline ?? ""}
          onChange={handleChange("headline")}
          required={isOnboarding}
        />
        <p className="text-xs text-slate-500">Keep it short and powerful—one line that captures your mission.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="summary">
            Community bio
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-emerald-600 hover:bg-emerald-50"
            onClick={() => handleAiRefine("summary")}
            disabled={aiBusyField === "summary"}
          >
            {aiBusyField === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="text-xs font-semibold uppercase tracking-wide">Refine</span>
          </Button>
        </div>
        <Textarea
          id="summary"
          rows={4}
          placeholder="Share the communities you serve, how you use Life-AI, and the expertise you bring."
          value={form.summary ?? ""}
          onChange={handleChange("summary")}
          required={isOnboarding}
        />
        <p className="text-xs text-slate-500">
          Aim for a few sentences. Synthesis AI can help tighten the language with the refine button.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="company">
            Current company / organization
          </label>
          <Input id="company" value={form.company ?? ""} onChange={handleChange("company")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="role">
            Role / title
          </label>
          <Input id="role" value={form.role ?? ""} onChange={handleChange("role")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="location">
            Location
          </label>
          <Input id="location" value={form.location ?? ""} onChange={handleChange("location")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="website">
            Website / portfolio
          </label>
          <Input id="website" type="url" placeholder="https://" value={form.website ?? ""} onChange={handleChange("website")} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="skills">
          Skills (comma separated)
        </label>
        <Input id="skills" placeholder="Litigation, Arbitration, Negotiation" value={form.skillsInput} onChange={handleChange("skillsInput")} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">
          {status ??
            (isOnboarding
              ? "Complete these details to unlock the community feed and research workspace."
              : "Profile details sync with Life-AI workspace.")}
        </div>
        <Button type="submit" disabled={isSaving} className="min-w-[140px]">
          {isSaving ? "Saving…" : isOnboarding ? "Finish setup" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
