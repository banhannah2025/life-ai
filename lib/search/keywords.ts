const NON_ALPHANUMERIC = /[^a-z0-9\s]+/g;

function normalize(value: string) {
  return value.toLowerCase().replace(NON_ALPHANUMERIC, " ").replace(/\s+/g, " ").trim();
}

function addPrefixes(term: string, set: Set<string>, { prefixOnly = false }: { prefixOnly?: boolean } = {}) {
  if (!term) {
    return;
  }

  const sanitized = term.toLowerCase();
  const length = Math.min(sanitized.length, 48);
  for (let index = 1; index <= length; index++) {
    set.add(sanitized.slice(0, index));
  }

  if (!prefixOnly) {
    set.add(sanitized);
  }
}

function collectPhrases(strings: Array<string | undefined | null>) {
  return strings
    .map((value) => value ?? "")
    .filter(Boolean)
    .map((value) => normalize(value))
    .filter(Boolean);
}

export function extractSearchTokens(query: string): string[] {
  return collectPhrases([query])
    .flatMap((phrase) => phrase.split(" "))
    .filter(Boolean);
}

export function buildProfileSearchKeywords(profile: {
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  company?: string;
  role?: string;
  skills?: string[];
}): string[] {
  const searchTerms = new Set<string>();
  const names = collectPhrases([
    profile.firstName,
    profile.lastName,
    [profile.firstName, profile.lastName].filter(Boolean).join(" "),
  ]);

  for (const name of names) {
    if (!name) {
      continue;
    }
    addPrefixes(name.replace(/\s+/g, " "), searchTerms);
    for (const token of name.split(" ")) {
      addPrefixes(token, searchTerms);
    }
  }

  const phrases = collectPhrases([
    profile.headline,
    profile.company,
    profile.role,
    profile.location,
    ...(profile.skills ?? []),
  ]);

  for (const phrase of phrases) {
    addPrefixes(phrase.replace(/\s+/g, " "), searchTerms);
    for (const token of phrase.split(" ")) {
      addPrefixes(token, searchTerms);
    }
  }

  return Array.from(searchTerms).slice(0, 120);
}

export function buildPostSearchTerms(post: {
  content: string;
  tags?: string[];
  authorName?: string;
  channelName?: string | null;
}): string[] {
  const searchTerms = new Set<string>();
  const contentPhrases = collectPhrases([post.content]);

  for (const phrase of contentPhrases) {
    addPrefixes(phrase.replace(/\s+/g, " "), searchTerms);
    const tokens = phrase.split(" ");
    for (const token of tokens) {
      addPrefixes(token, searchTerms);
    }
  }

  const tags = (post.tags ?? []).map((tag) => tag.replace(/^#/, ""));
  for (const tag of tags) {
    addPrefixes(normalize(tag), searchTerms, { prefixOnly: true });
  }

  const metadata = collectPhrases([post.authorName, post.channelName ?? undefined]);
  for (const phrase of metadata) {
    addPrefixes(phrase.replace(/\s+/g, " "), searchTerms);
    for (const token of phrase.split(" ")) {
      addPrefixes(token, searchTerms);
    }
  }

  return Array.from(searchTerms).slice(0, 160);
}
