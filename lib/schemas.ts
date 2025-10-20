import { z } from "zod";

export const UserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "moderator", "guest", "attorney", "law_firm", "pro_se"]).default("member"),
  createdAt: z.any(), // Firestore Timestamp
  updatedAt: z.any(),
  professionalProfile: z.object({
    fullName: z.string().optional(),
    headline: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    education: z.array(
      z.object({
        school: z.string(),
        degree: z.string(),
        field: z.string(),
        startDate: z.any(),
        endDate: z.any().nullable(),
      })
    ).optional(),
    experience: z.array(
      z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.any(),
        endDate: z.any().nullable(),
        description: z.string(),
      })
    ).optional(),
  }),
  personalProfile: z.object({
    avatarUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    interests: z.array(z.string()).optional(),
    location: z.string().optional(),
    about: z.string().optional(),
  }),
  settings: z.object({
    visibility: z.enum(["public", "private", "connections"]).default("public"),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
    }),
  }),
});

export type UserType = z.infer<typeof UserSchema>;
