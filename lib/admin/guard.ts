import { clerkClient } from "@clerk/nextjs/server";

import { isAdminEmail } from "./config";

export async function isAdminUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const emailCandidates = [
      user.primaryEmailAddress?.emailAddress ?? null,
      ...user.emailAddresses.map((address) => address.emailAddress ?? ""),
    ];

    return emailCandidates.some((email) => isAdminEmail(email));
  } catch (error) {
    console.error("Failed to resolve admin user", error);
    return false;
  }
}

export async function assertAdminUser(userId: string | null | undefined): Promise<void> {
  const allowed = await isAdminUser(userId);
  if (!allowed) {
    throw new Error("Unauthorized admin access.");
  }
}
