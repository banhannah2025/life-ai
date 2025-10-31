import type { LibraryResource } from "./types";

export const LIBRARY_CATALOG: LibraryResource[] = [
  {
    id: "ougm-restorative-orientation",
    title: "Restorative Justice Orientation Handbook",
    summary: "Trainer handbook detailing OUGM's restorative justice vision, facilitator agreements, and practice labs.",
    description:
      "A living playbook for facilitators that covers theology of reconciliation, trauma-informed hospitality, and the Learn–Practice–Integrate loops driving the OUGM cohort.",
    url: "/ougm-restorative-justice",
    source: "Life-AI Research Studio",
    sourceType: "internal",
    contentType: "guide",
    format: "notion",
    tags: ["handbook", "training", "implementation"],
    topics: ["Restorative Justice", "Program Design", "Trauma-Informed Care"],
    projects: ["OUGM Restorative Justice"],
    authors: [
      { name: "Sydney Romero", role: "Program Architect" },
      { name: "Life-AI Research Labs" },
    ],
    featured: true,
    interactive: true,
    stats: { pages: 46, level: "intro" },
    publishedAt: "2024-12-01",
    updatedAt: "2024-12-18",
    dataSources: ["OUGM interviews", "Restorative practice cohorts"],
    body:
      "Orientation module covering theology of reconciliation, trauma-informed shelter practices, facilitator competencies, and the Learn–Practice–Integrate framework for apprentices.",
  },
  {
    id: "restorative-justice-reference-bible",
    title: "Restorative Justice Reference Bible (NKJV Companion)",
    summary:
      "Curated New King James Version references with facilitator notes that ground every stage of the restorative justice process in scripture.",
    description:
      "Life-AI’s chapel and restorative teams mapped more than 80 frequently asked circle questions to passages in the NKJV so staff can quickly anchor preparation, dialogue, repair planning, and aftercare in the biblical narrative of reconciliation.",
    url: "/library/restorative-justice-reference-bible",
    source: "Life-AI Chapel & Justice Collective",
    sourceType: "internal",
    contentType: "ebook",
    format: "web",
    tags: ["restorative justice", "scripture", "practice guide"],
    topics: ["Restorative Justice", "Spiritual Care", "Trauma-Informed Ministry"],
    projects: ["OUGM Restorative Justice", "Mission Life"],
    authors: [
      { name: "Sydney Romero", role: "Program Architect" },
      { name: "Mission Life Chaplaincy Team", role: "Curators" },
    ],
    featured: true,
    stage: "published",
    publishedAt: "2024-12-20",
    updatedAt: "2025-01-05",
    stats: { pages: 78, level: "intermediate" },
    dataSources: ["New King James Version® (Thomas Nelson)", "Restorative circle transcripts"],
    body:
      "Scripture pathways for briefing harmed parties, preparing responsible parties, smoothing facilitator decision points, and closing the loop with community blessings. Each section adds trauma-responsive facilitation scripts, role-based checklists, and aftercare rituals tailored to Mission Life’s restorative justice milestones.",
  },
  {
    id: "revised-code-of-washington",
    title: "Revised Code of the State of Washington (RCW)",
    summary:
      "A comprehensive, searchable collection of Washington State statutes organized by title, chapter, and section.",
    description:
      "The Revised Code of Washington (RCW) is the compilation of all permanent laws now in force in the state of Washington. This resource provides easy access to the full text of statutes, organized for efficient navigation and reference.",
    url: "/library/revised-code-of-washington",
    source: "Washington State Legislature",
    sourceType: "external",
    contentType: "ebook",
    format: "web",
    tags: ["washington", "statutes", "legal reference"],
    topics: ["State Law", "Statutory Research"],
    projects: ["Legislative Intelligence"],
    authors: [
      { name: "Robin Cornett", role: "Data Architect" },
      { name: "Washington State Legislature", role: "Curators" },
    ],
    featured: true,
    stage: "published",
    publishedAt: "2025-10-26",
    updatedAt: "2025-10-26",
    stats: { pages: 600, level: "intermediate" },
    dataSources: ["Washington State Legislature"],
    body:
      "Complete text of Washington State statutes, organized by title, chapter, and section, with search functionality and historical annotations where available.",
  },
  {
    id: "caselaw-access-project",
    title: "Caselaw Access Project (CAP) Research Hub",
    summary: "Six million U.S. opinions digitized by Harvard Law School Library with bulk downloads and API access through CourtListener.",
    description:
      "CAP unlocks two centuries of U.S. caselaw for research and machine learning. Life-AI wraps the CAP static exports and CourtListener API so legal search, datasets, and assistant training stay grounded in primary authority.",
    url: "/library/caselaw-access-project",
    source: "Harvard Law School Library Innovation Lab",
    sourceType: "external",
    contentType: "dataset",
    format: "web",
    tags: ["caselaw", "primary law", "datasets"],
    topics: ["Primary Law", "Legal Research", "Case Law"],
    projects: ["Life-AI Legal Lab", "Justice Infrastructure Atlas"],
    authors: [
      { name: "Harvard Law School Library Innovation Lab", role: "Stewards" },
      { name: "Free Law Project", role: "CourtListener API" },
    ],
    featured: true,
    stage: "published",
    dataSources: ["Caselaw Access Project", "CourtListener"],
    body:
      "Launchpad for Life-AI curators to explore CAP reporters, review jurisdictional coverage, and grab stable URLs to JSON, HTML, PDF, ZIP, and TAR exports that power our legal research and AI training pipelines.",
  },
  {
    id: "mission-life-reference-bible",
    title: "Mission Life Reference Bible (NKJV Roadmap Edition)",
    summary:
      "A New King James Version field guide that walks patrons and staff through daily discipleship, healing from harm, work readiness, and the journey into stable housing.",
    description:
      "Edition two of the reference bible expands beyond circle rooms, pairing more than 120 NKJV passages with routines for chapels, dorm life, workforce labs, pastoral counseling, and exit planning so Mission Life keeps people moving toward wholeness.",
    url: "/library/mission-life-reference-bible",
    source: "Life-AI Chapel & Transition Services",
    sourceType: "internal",
    contentType: "ebook",
    format: "web",
    tags: ["mission life", "discipleship", "transition roadmap"],
    topics: ["Spiritual Care", "Housing Navigation", "Workforce Development"],
    projects: ["Mission Life", "Community Resilience Studio"],
    authors: [
      { name: "Mission Life Chaplaincy Team", role: "Editors" },
      { name: "Transition & Housing Advocates", role: "Contributors" },
    ],
    featured: true,
    stage: "published",
    publishedAt: "2025-01-05",
    updatedAt: "2025-01-05",
    stats: { pages: 142, level: "intermediate" },
    dataSources: ["New King James Version® (Thomas Nelson)", "Mission Life exit interviews"],
    body:
      "Roadmap chapters cover morning liturgies, crisis calming plans, harm repair, workforce coaching, housing preparation, and alumni re-entry tips—all rooted in NKJV promises with concrete Mission Life actions and checklists.",
  },
  {
    id: "restorative-questions-cheat-sheet",
    title: "Restorative Questions Cheat Sheet",
    summary: "Core restorative questions for caregivers, facilitators, and participants during circles and conferences.",
    description:
      "Pocket reference that separates prompts for those harmed and those responsible, with tone notes and escalation tips.",
    url: "https://www.iirp.edu/restorative-practices/explained",
    source: "International Institute for Restorative Practices",
    sourceType: "external",
    contentType: "toolkit",
    format: "pdf",
    tags: ["restorative", "questions", "facilitation"],
    topics: ["Restorative Justice", "Facilitation"],
    projects: ["Circle Practice Exchange"],
    authors: [{ name: "IIRP Faculty" }],
    dataSources: ["IIRP"],
    stats: { pages: 4, level: "intro" },
    body:
      "List of classic restorative questions, including prompts for those harmed and those responsible, with guidance on tone and sequencing.",
  },
  {
    id: "intentional-infliction-outline",
    title: "Intentional Infliction of Emotional Distress – Litigation Digest",
    summary: "Elements, defenses, and notable U.S. cases for IIED claims with practitioner commentary.",
    description:
      "Outline covering extreme-and-outrageous conduct tests, severe harm thresholds, and citations practitioners rely on when briefing tort teams.",
    url: "https://law.lifetutor.dev/civil-torts/intentional-infliction-emotional-distress",
    source: "Life-AI Knowledge Base",
    sourceType: "internal",
    contentType: "article",
    format: "web",
    tags: ["torts", "emotional distress", "civil"],
    topics: ["Tort Law", "Litigation"],
    projects: ["Life-AI Legal Lab"],
    authors: [
      { name: "Maya Lopez", role: "Litigation Fellow" },
      { name: "Life-AI Legal Lab" },
    ],
    stats: { pages: 18, level: "intermediate" },
    publishedAt: "2024-11-05",
    updatedAt: "2024-12-12",
    body:
      "Detailed outline describing the IIED tort, extreme and outrageous conduct threshold, severe emotional harm requirement, and leading cases such as Harris v. Jones and Hustler Magazine v. Falwell.",
  },
  {
    id: "trauma-informed-frontline",
    title: "Trauma-Informed Frontline Workers Guide",
    summary: "Practical toolkit of grounding exercises and safety planning tips for shelter staff walking alongside trauma survivors.",
    url: "https://www.nctsn.org/resources/trauma-informed-frontline-workers",
    source: "National Child Traumatic Stress Network",
    sourceType: "external",
    contentType: "toolkit",
    format: "pdf",
    tags: ["trauma", "grounding", "training"],
    topics: ["Trauma-Informed Care", "Shelter Operations"],
    projects: ["Community Resilience Studio"],
    authors: [{ name: "NCTSN" }],
    stats: { pages: 22, level: "intro" },
    body:
      "Guide includes grounding techniques, co-regulation scripts, and checklists for trauma-informed service delivery in high-stress environments.",
  },
  {
    id: "restorative-housing-case-study",
    title: "Restorative Re-entry Circles – Housing Stability Case Study",
    summary: "How re-entry circles reduced conflicts and improved retention in transitional housing programs.",
    url: "https://ccpros.org/resources/restorative-reentry-circles.pdf",
    source: "CCPROS",
    sourceType: "external",
    contentType: "brief",
    format: "pdf",
    tags: ["housing", "re-entry", "case study"],
    topics: ["Housing", "Re-entry"],
    projects: ["Community Resilience Studio"],
    authors: [{ name: "CCPROS Research" }],
    stats: { pages: 12, level: "intermediate" },
    body:
      "Insights from a transitional housing pilot linking restorative agreements with case management, including metrics on incidents and retention.",
  },
  {
    id: "openstates-guide",
    title: "Open States Quick Start Guide",
    summary: "How-to guide for searching state legislation, tracking bills, and monitoring hearings using Open States.",
    url: "https://docs.openstates.org/en/latest/quickstart.html",
    source: "Open States",
    sourceType: "external",
    contentType: "guide",
    format: "web",
    tags: ["legislation", "state", "open states"],
    topics: ["Legislative Tracking", "Civic Data"],
    projects: ["Legislative Intelligence"],
    authors: [{ name: "Open States Team" }],
    body:
      "Overview of search syntax, filtering, API usage, and webhook notifications for state-level bill tracking.",
  },
  {
    id: "federal-register-reader-aids",
    title: "Federal Register Reader Aids",
    summary: "Reference library explaining how to navigate and interpret Federal Register documents and entries.",
    url: "https://www.federalregister.gov/reader-aids",
    source: "Federal Register",
    sourceType: "external",
    contentType: "guide",
    format: "web",
    tags: ["federal register", "research", "rulemaking"],
    topics: ["Rulemaking", "Federal Agencies"],
    projects: ["Regulatory Intelligence"],
    authors: [{ name: "Office of the Federal Register" }],
    body:
      "Guidance on document structure, search strategies, and regulatory history research within the Federal Register.",
  },
  {
    id: "ecfr-navigation",
    title: "eCFR Navigation Toolkit",
    summary: "Best practices for finding and bookmarking Code of Federal Regulations provisions online.",
    url: "https://www.ecfr.gov/current/title-24",
    source: "eCFR",
    sourceType: "external",
    contentType: "toolkit",
    format: "web",
    tags: ["ecfr", "compliance"],
    topics: ["Compliance", "Federal Agencies"],
    projects: ["Regulatory Intelligence"],
    authors: [{ name: "Office of the Federal Register" }],
    body:
      "Toolkit demonstrating title/part navigation, advanced search filters, and update alerts in the electronic CFR.",
  },
  {
    id: "regulations-public-comment",
    title: "Regulations.gov Public Comment Playbook",
    summary: "Step-by-step instructions for locating dockets, analyzing comments, and submitting feedback through Regulations.gov.",
    url: "https://www.regulations.gov/learn",
    source: "Regulations.gov",
    sourceType: "external",
    contentType: "guide",
    format: "web",
    tags: ["regulations", "public comment", "guide"],
    topics: ["Rulemaking", "Public Participation"],
    projects: ["Regulatory Intelligence"],
    authors: [{ name: "Regulations.gov" }],
    body:
      "Explains docket structure, tracking features, and best practices for drafting effective public comments.",
  },
  {
    id: "courtlistener-api",
    title: "CourtListener API Reference",
    summary: "API documentation for querying opinions, oral arguments, and PACER data on CourtListener.",
    url: "https://www.courtlistener.com/api/",
    source: "CourtListener",
    sourceType: "external",
    contentType: "dataset",
    format: "web",
    tags: ["courtlistener", "api", "opinions"],
    topics: ["Case Law", "APIs"],
    projects: ["Life-AI Legal Lab"],
    authors: [{ name: "Free Law Project" }],
    body:
      "Provides endpoints, authentication details, and sample queries for legal opinions and audio through the CourtListener REST API.",
  },
  {
    id: "lifeai-community-justice-blueprint",
    title: "Blueprint for Community Justice Teams (Preview)",
    summary: "Upcoming e-book mapping cross-jurisdictional justice teams, intake flows, and data loops for community safety work.",
    description:
      "Draft e-book that braids together case studies from tribal courts, problem-solving dockets, and restorative coalitions with Life-AI tooling screenshots.",
    url: "/library/community-justice-blueprint",
    source: "Life-AI Justice Lab",
    sourceType: "internal",
    contentType: "ebook",
    format: "pdf",
    tags: ["community justice", "design", "playbook"],
    topics: ["Community Justice", "Program Design", "Data Collaboration"],
    projects: ["Life-AI Justice Lab"],
    authors: [
      { name: "Jordan Gomez", role: "Justice Lab Director" },
      { name: "Life-AI Fellows" },
    ],
    featured: true,
    stage: "beta",
    stats: { pages: 120, level: "advanced" },
    attachments: [{ label: "Sample chapter", url: "/files/community-justice-sample.pdf", format: "pdf" }],
    body:
      "Explains how jurisdictions assemble cross-functional justice teams, align data loops, and deploy AI copilots with care safeguards. Includes drafts of facilitator agreements, charter templates, and reporting dashboards.",
  },
  {
    id: "ai-research-workbench",
    title: "AI-Assisted Research Workbench Playbook",
    summary: "How Life-AI pairs generative copilots with matter-linked research threads, including governance checklists.",
    url: "/docs/research-workbench",
    source: "Life-AI Research Studio",
    sourceType: "internal",
    contentType: "guide",
    format: "web",
    tags: ["ai", "research", "workflow"],
    topics: ["AI Operations", "Legal Research"],
    projects: ["Life-AI Platform"],
    authors: [
      { name: "Priya Narayanan", role: "AI Operations Lead" },
      { name: "Life-AI Engineering" },
    ],
    interactive: true,
    stats: { pages: 34, level: "intermediate" },
    publishedAt: "2024-10-10",
    updatedAt: "2024-12-10",
    body:
      "Explains prompt libraries, citation capture, human-in-the-loop reviews, and research-to-drafting linking with screenshots of the Life-AI workspace.",
  },
  {
    id: "jurisdictional-mapping-dataset",
    title: "Jurisdictional Mapping Dataset",
    summary: "Database export that links courts, agencies, and community partners for conflict systems mapping.",
    url: "/datasets/jurisdictional-map",
    source: "Life-AI Civic Data",
    sourceType: "database",
    contentType: "dataset",
    format: "dataset",
    tags: ["jurisdictions", "civic data", "systems map"],
    topics: ["Civic Data", "Systems Mapping"],
    projects: ["Justice Infrastructure Atlas"],
    authors: [
      { name: "Civic Data Guild" },
      { name: "Life-AI Fellows" },
    ],
    featured: true,
    stats: { downloads: 312, level: "intermediate" },
    dataSources: ["CourtListener", "Open States", "Local uploads"],
    body:
      "CSV + Parquet bundle that standardizes courts, agencies, and mutual aid partners with tags for focus area, geography, and integration status.",
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

  return LIBRARY_CATALOG.map((resource) => {
    const haystack = [
      resource.title,
      resource.summary,
      resource.description ?? "",
      resource.body ?? "",
      resource.tags.join(" "),
      resource.topics.join(" "),
      resource.projects.join(" "),
      resource.authors.map((author) => author.name).join(" "),
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
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
}

export function getStaticLibraryResources(): LibraryResource[] {
  return LIBRARY_CATALOG;
}
