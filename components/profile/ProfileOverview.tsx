"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

import { Button } from "../ui/button";
import { getUserProfile, type UserProfile } from "@/lib/firebase/profile";
import { DEFAULT_USER_PROFILE } from "@/lib/profile/schema";
import Link from "next/link";
import { ensureFirebaseSignedIn } from "@/lib/firebase/client-auth";

const emptyProfile: UserProfile = {
  ...DEFAULT_USER_PROFILE,
};

export function ProfileOverview() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);

  const userId = useMemo(() => (isLoaded ? user?.id ?? null : null), [isLoaded, user?.id]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    (async () => {
      try {
        await ensureFirebaseSignedIn();
        const profileData = await getUserProfile(userId);
        if (!ignore) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [userId]);

  if (!isLoaded) {
    return <div className="text-sm text-slate-600">Loading user…</div>;
  }

  if (!userId) {
    return <div className="text-sm text-slate-600">Sign in to view your profile.</div>;
  }

  if (isLoading) {
    return <div className="text-sm text-slate-600">Loading profile…</div>;
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || user?.fullName || "Life-AI member";
  const avatarUrl = profile.avatarUrl || user?.imageUrl || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={`${fullName} avatar`} fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-500">
                Life-AI
              </span>
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">{fullName}</h1>
            {profile.headline && <p className="text-base text-slate-600">{profile.headline}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              {profile.company && <span>{profile.company}</span>}
              {profile.role && <span>• {profile.role}</span>}
              {profile.location && <span>• {profile.location}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={`/people/${userId}`}>View public profile</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/people/${userId}/posts`}>My posts</Link>
          </Button>
          <Button asChild>
            <Link href="/profile/edit">Edit profile</Link>
          </Button>
        </div>
      </div>

      {profile.summary && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">About</h2>
          <p className="text-sm leading-6 text-slate-600 whitespace-pre-line">{profile.summary}</p>
        </section>
      )}

      {(profile.skills?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.website && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Links</h2>
          <a className="text-sm font-medium text-blue-600 hover:underline" href={profile.website} target="_blank" rel="noreferrer">
            {profile.website}
          </a>
        </section>
      )}
    </div>
  );
}
