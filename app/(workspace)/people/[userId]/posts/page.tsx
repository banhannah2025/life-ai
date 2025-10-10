import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getPublicUserProfile } from "@/lib/firebase/server-profile";
import { serializePost } from "@/lib/social/serialization";
import { listPostsByAuthor } from "@/lib/social/server/posts";
import { PublicProfileView } from "@/components/profile/PublicProfileView";

type PageProps = {
  params: {
    userId: string;
  };
};

function buildFullName(profile: { firstName?: string; lastName?: string; headline?: string }) {
  const parts = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  return parts || profile.headline || "Life-AI member";
}

export default async function PeoplePostsPage({ params }: PageProps) {
  const targetUserId = params.userId;
  const [{ userId: viewerId }, profile] = await Promise.all([auth(), getPublicUserProfile(targetUserId)]);

  if (!profile) {
    notFound();
  }

  const posts = await listPostsByAuthor({ authorId: targetUserId, viewerId: viewerId ?? null, limit: 50 });

  const profileData = {
    id: targetUserId,
    fullName: buildFullName(profile),
    headline: profile.headline ?? undefined,
    summary: profile.summary ?? undefined,
    location: profile.location ?? undefined,
    company: profile.company ?? undefined,
    role: profile.role ?? undefined,
    skills: profile.skills ?? [],
    avatarUrl: profile.avatarUrl ?? undefined,
    website: profile.website ?? undefined,
  };

  return (
    <PublicProfileView
      profile={profileData}
      viewerId={viewerId ?? null}
      initialPosts={posts.map(serializePost)}
    />
  );
}
