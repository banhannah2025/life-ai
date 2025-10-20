export type LibraryResource = {
  id: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
  body: string;
  source: string;
};

const RAW_RESOURCES: LibraryResource[] = [
  {
    id: "ougm-restorative-overview",
    title: "Restorative Justice Orientation Handbook (OUGM)",
    summary:
      "Trainer handbook detailing OUGM's restorative justice vision, implementation roadmap, and facilitator expectations.",
    url: "/ougm-restorative-justice",
    tags: ["restorative justice", "handbook", "training", "ougm"],
    source: "Life-AI",
    body:
      "Orientation module covering theology of reconciliation, trauma-informed shelter practices, and the Learn-Practice-Integrate framework for facilitators.",
  },
  {
    id: "restorative-questions",
    title: "Restorative Questions Cheat Sheet",
    summary: "Core restorative questions for caregivers, facilitators, and participants during circles and conferences.",
    url: "https://www.iirp.edu/restorative-practices/explained",
    tags: ["restorative", "questions", "facilitation", "iirp"],
    source: "International Institute for Restorative Practices",
    body:
      "List of classic restorative questions, including prompts for those harmed and those responsible, with guidance on tone and sequencing.",
  },
  {
    id: "intentional-infliction-outline",
    title: "Intentional Infliction of Emotional Distress – Outline & Case Digest",
    summary: "Elements, defenses, and notable U.S. cases for IIED claims with practitioner commentary.",
    url: "https://law.lifetutor.dev/civil-torts/intentional-infliction-emotional-distress",
    tags: ["torts", "intentional infliction", "emotional distress", "civil"],
    source: "Life-AI Knowledge Base",
    body:
      "Detailed outline describing the IIED tort, extreme and outrageous conduct threshold, severe emotional harm requirement, and leading cases such as Harris v. Jones and Hustler Magazine v. Falwell.",
  },
  {
    id: "trauma-informed-shelters",
    title: "Trauma-Informed Frontline Workers Guide",
    summary: "Practical toolkit of grounding exercises and safety planning tips for shelter staff walking alongside trauma survivors.",
    url: "https://www.nctsn.org/resources/trauma-informed-frontline-workers",
    tags: ["trauma", "shelter", "grounding", "training"],
    source: "National Child Traumatic Stress Network",
    body:
      "Guide includes grounding techniques, co-regulation scripts, and checklists for trauma-informed service delivery in high-stress environments.",
  },
  {
    id: "restorative-housing-case-study",
    title: "Restorative Re-entry Circles – Housing Stability Case Study",
    summary: "Case study documenting how re-entry circles reduced conflicts and improved retention in transitional housing programs.",
    url: "https://ccpros.org/resources/restorative-reentry-circles.pdf",
    tags: ["housing", "re-entry", "restorative", "case study"],
    source: "CCPROS",
    body:
      "Insights from a transitional housing pilot linking restorative agreements with case management, including metrics on incidents and retention.",
  },
  {
    id: "openstates-guide",
    title: "Open States Quick Start Guide",
    summary: "How-to guide for searching state legislation, tracking bills, and monitoring hearings using Open States.",
    url: "https://docs.openstates.org/en/latest/quickstart.html",
    tags: ["legislation", "state", "open states", "guide"],
    source: "Open States",
    body:
      "Overview of search syntax, filtering, API usage, and webhook notifications for state-level bill tracking.",
  },
  {
    id: "federal-register-overview",
    title: "Federal Register Reader Aids",
    summary: "Reference library explaining how to navigate and interpret Federal Register documents and entries.",
    url: "https://www.federalregister.gov/reader-aids",
    tags: ["federal register", "research", "federal", "rulemaking"],
    source: "Federal Register",
    body:
      "Guidance on document structure, search strategies, and regulatory history research within the Federal Register.",
  },
  {
    id: "ecfr-navigation",
    title: "eCFR Navigation Toolkit",
    summary: "Best practices for finding and bookmarking Code of Federal Regulations provisions online.",
    url: "https://www.ecfr.gov/current/title-24",
    tags: ["ecfr", "federal regulations", "compliance"],
    source: "eCFR",
    body:
      "Toolkit demonstrating title/part navigation, advanced search filters, and update alerts in the electronic CFR.",
  },
  {
    id: "regulations-public-comment",
    title: "Regulations.gov Public Comment Playbook",
    summary: "Step-by-step instructions for locating dockets, analyzing comments, and submitting feedback through Regulations.gov.",
    url: "https://www.regulations.gov/learn",
    tags: ["regulations", "public comment", "guide"],
    source: "Regulations.gov",
    body:
      "Explains docket structure, tracking features, and best practices for drafting effective public comments.",
  },
  {
    id: "courtlistener-api",
    title: "CourtListener API Reference",
    summary: "API documentation for querying opinions, oral arguments, and PACER data on CourtListener.",
    url: "https://www.courtlistener.com/api/",
    tags: ["courtlistener", "api", "opinions", "federal"],
    source: "CourtListener",
    body:
      "Provides endpoints, authentication details, and sample queries for legal opinions and audio through the CourtListener REST API.",
  },
];

export function searchLocalLibraryResources(query: string, limit = 10): LibraryResource[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return [];
  }

  const scored = RAW_RESOURCES.map((resource) => {
    let score = 0;
    const haystack = `${resource.title} ${resource.summary} ${resource.body} ${resource.tags.join(" ")}`.toLowerCase();

    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 1;
      }
    }

    if (haystack.includes(query.toLowerCase())) {
      score += 2;
    }

    return { resource, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.resource);

  return scored;
}

export { RAW_RESOURCES as ALL_LIBRARY_RESOURCES };
