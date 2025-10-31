export type UserProfile = {
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  location?: string;
  company?: string;
  role?: string;
  website?: string;
  skills?: string[];
  avatarUrl?: string;
  updatedAt?: Date | null;
  searchKeywords?: string[];
};

export const DEFAULT_USER_PROFILE: UserProfile = {
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
  updatedAt: null,
  searchKeywords: [],
};
