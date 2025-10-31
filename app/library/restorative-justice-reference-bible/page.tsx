import type { Metadata } from "next"
import Link from "next/link"
import { BookOpenCheck, Bookmark, CheckCircle2, Compass, HeartHandshake, LifeBuoy, ListChecks, ScrollText, ShieldCheck, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type MissionPractice = {
  title: string
  verse: string
  note: string
  icon: LucideIcon
}

type RoleCompanion = {
  role: string
  focus: string
  scriptures: { reference: string; note: string }[]
}

type CircleMoment = {
  moment: string
  script: string
  verse: string
}

type RegulationPath = {
  title: string
  verse: string
  practice: string
}

type TransitionMarker = {
  marker: string
  verse: string
  practice: string
}

const journeyStages = [
  {
    title: "Preparation & Discernment",
    focus: "Quiet the team and gather facts with tenderness before anyone sits in circle.",
    scriptures: [
      {
        reference: "Micah 6:8",
        excerpt: "He has shown you, O man, what is good; and what does the LORD require of you but to do justly, to love mercy, and to walk humbly with your God?",
        application: "Set facilitator posture: justice must always walk with mercy and humility.",
      },
      {
        reference: "James 1:19-20",
        excerpt: "Let every man be swift to hear, slow to speak, slow to wrath; for the wrath of man does not produce the righteousness of God.",
        application: "Coach staff to protect listening space and monitor tone before the gathering.",
      },
      {
        reference: "Psalm 139:23-24",
        excerpt: "Search me, O God, and know my heart; try me, and know my anxieties; and see if there is any wicked way in me, and lead me in the way everlasting.",
        application: "Invite responsible parties to surface what still needs confession before the circle starts.",
      },
    ],
    prompts: [
      "What harm story still needs honoring before we meet?",
      "Who must be briefed or supported so the circle feels safe and balanced?",
    ],
  },
  {
    title: "Encounter & Truth Telling",
    focus: "Hold space for the full story so each person is seen, not rushed.",
    scriptures: [
      {
        reference: "John 20:19-23",
        excerpt: "Jesus came and stood in the midst, and said to them, 'Peace be with you.'",
        application: "Open the circle with a blessing of peace that acknowledges locked doors and fear.",
      },
      {
        reference: "Matthew 5:9",
        excerpt: "Blessed are the peacemakers, for they shall be called sons of God.",
        application: "Remind the community that speaking truth and naming harm is sacred peacemaking work.",
      },
      {
        reference: "Proverbs 18:13",
        excerpt: "He who answers a matter before he hears it, it is folly and shame to him.",
        application: "Slow the pace any time participants try to fix things before the harmed party is finished.",
      },
    ],
    prompts: [
      "Where did you feel God drawing near as you heard this story?",
      "What do you need from the group to say everything true?",
    ],
  },
  {
    title: "Repair & Covenant Design",
    focus: "Translate confession into tangible repair that blesses people and systems.",
    scriptures: [
      {
        reference: "Luke 19:8-9",
        excerpt: "Look, Lord, I give half of my goods to the poor; and if I have taken anything from anyone by false accusation, I restore fourfold.",
        application: "Model how restitution plans can exceed the minimum and announce new character.",
      },
      {
        reference: "Matthew 5:23-24",
        excerpt: "First be reconciled to your brother, and then come and offer your gift.",
        application: "Sequence actions: relational repair comes before programmatic milestones.",
      },
      {
        reference: "Colossians 3:13-14",
        excerpt: "Bearing with one another, and forgiving one another... But above all these things put on love, which is the bond of perfection.",
        application: "Check that agreements make room for compassion alongside accountability checkpoints.",
      },
    ],
    prompts: [
      "What would repair look like if mercy and justice were both visible?",
      "How will we know humility is growing once this covenant launches?",
    ],
  },
  {
    title: "Aftercare & Re-entry",
    focus: "Stay with people long enough for transformation to take root.",
    scriptures: [
      {
        reference: "Galatians 6:2",
        excerpt: "Bear one another's burdens, and so fulfill the law of Christ.",
        application: "Assign companions so the responsible party is never asked to walk repair alone.",
      },
      {
        reference: "Psalm 126:5",
        excerpt: "Those who sow in tears shall reap in joy.",
        application: "Give harmed parties permission to grieve repeatedly as healing unfolds.",
      },
      {
        reference: "Philippians 1:6",
        excerpt: "He who has begun a good work in you will complete it until the day of Jesus Christ.",
        application: "Celebrate incremental wins as evidence that God sustains the covenant over time.",
      },
    ],
    prompts: [
      "What practices will keep the story from reopening wounds unnecessarily?",
      "How do we signal completion to the larger Mission Life community?",
    ],
  },
]

const roleCompanions: RoleCompanion[] = [
  {
    role: "Facilitators",
    focus: "Carry authority with gentleness while keeping the process on-rails.",
    scriptures: [
      { reference: "2 Corinthians 5:18-19", note: "Ministry of reconciliation has been entrusted to you." },
      { reference: "Proverbs 15:1", note: "A soft answer turns away wrath when emotions spike." },
    ],
  },
  {
    role: "Advocates for harmed parties",
    focus: "Guard stories from being minimized and keep safety visible.",
    scriptures: [
      { reference: "Psalm 34:18", note: "The LORD is near to the brokenhearted—name His nearness out loud." },
      { reference: "Isaiah 40:11", note: "He gently leads those who are with young—set a gentle pace for disclosures." },
    ],
  },
  {
    role: "Accountability mentors",
    focus: "Walk with responsible parties between sessions so repentance matures.",
    scriptures: [
      { reference: "Galatians 6:1", note: "Restore in a spirit of gentleness while watching your own heart." },
      { reference: "Hebrews 12:11", note: "Peaceable fruit grows from disciplined follow-through." },
    ],
  },
]

const circleMoments: CircleMoment[] = [
  {
    moment: "Grounding breath & welcome",
    script: "In returning and rest we are saved; we breathe in God's nearness before a single word is spoken.",
    verse: "Isaiah 30:15",
  },
  {
    moment: "Truth-telling turn",
    script: "Each of us puts away lying and speaks truth with our neighbor because we belong to one body.",
    verse: "Ephesians 4:25",
  },
  {
    moment: "Repair brainstorm",
    script: "We will raise up the ruins, like Amos promised, building again what was broken so it can bear fruit.",
    verse: "Amos 9:11",
  },
  {
    moment: "Covenant confirmation",
    script: "What we vow to the LORD we will not delay to pay; we speak commitments slowly and clearly.",
    verse: "Ecclesiastes 5:4",
  },
]

const regulationPaths: RegulationPath[] = [
  {
    title: "Breath prayer reset",
    verse: "Psalm 46:10",
    practice: "Lead the room in 'Be still, and know that I am God' breaths any time nervous systems flood.",
  },
  {
    title: "Anxiety exchange",
    verse: "Philippians 4:6-7",
    practice: "Model a two-column exercise: what we request of God, and what peace we are receiving right now.",
  },
  {
    title: "Weariness check-in",
    verse: "Matthew 11:28-30",
    practice: "Invite responsible parties to name the heavy yoke they are surrendering before drafting action plans.",
  },
]

const transitionMarkers: TransitionMarker[] = [
  {
    marker: "48-hour safety check",
    verse: "Psalm 121:7-8",
    practice: "Confirm immediate needs, room assignments, and support contacts after an incident or disclosure.",
  },
  {
    marker: "30-day covenant review",
    verse: "Habakkuk 2:2-3",
    practice: "Write the vision plainly inside Airtable; revisit timelines so those running may read and adjust.",
  },
  {
    marker: "Exit + re-entry blessing",
    verse: "Jeremiah 29:11-14",
    practice: "Pray future and hope over patrons as they transition to housing, then capture alumni care tasks.",
  },
]

const commonQuestions = [
  {
    question: "Why do we center the harmed party first?",
    guidance:
      "Isaiah 61:1-4 reminds us that the gospel announces good tidings to the meek, binds the brokenhearted, and rebuilds desolations. When a case lead elevates the harmed person’s story first, we align with the Servant’s order of operations and prevent the process from slipping back into punishment-first instincts.",
    scriptures: [
      { reference: "Isaiah 61:1-4", note: "Names restoration of ruined places as gospel fruit." },
      { reference: "Psalm 147:3", note: "He heals the brokenhearted and binds up their wounds." },
    ],
  },
  {
    question: "How do we offer accountability without shaming people?",
    guidance:
      "Galatians 6:1 holds both truth and gentleness: restore such a one in the spirit of meekness, considering yourself. Pair it with Romans 12:17-18 to remind the community that we seek peace with all while refusing to repay evil for evil. Accountability plans that keep this tone protect dignity and reduce defensive posturing.",
    scriptures: [
      { reference: "Galatians 6:1", note: "Restore with meekness; watch your own heart." },
      { reference: "Romans 12:17-18", note: "Provide things honorable in the sight of all men." },
    ],
  },
  {
    question: "What if confession is partial or the apology feels thin?",
    guidance:
      "Proverbs 28:13 states that mercy flows to those who confess and forsake. Pairing that with 2 Corinthians 7:10 (godly sorrow produces repentance) helps facilitators ask for specific change without humiliating the person. Keep the door open for continued reflection while naming the gap kindly.",
    scriptures: [
      { reference: "Proverbs 28:13", note: "Hiding sin blocks mercy; naming it opens relief." },
      { reference: "2 Corinthians 7:10", note: "Godly sorrow produces salvation, not regret." },
    ],
  },
  {
    question: "How do we reassure community partners who fear leniency?",
    guidance:
      "Romans 13:10 declares that love does no harm to a neighbor: therefore love is the fulfillment of the law. Pair it with Matthew 5:14-16 to show that repaired relationships are a witness set on a hill. Share these passages when briefing donors, staff, or board members who need theological assurance that restorative justice still protects the vulnerable.",
    scriptures: [
      { reference: "Romans 13:10", note: "Love satisfies the law precisely because it harms none." },
      { reference: "Matthew 5:14-16", note: "Let the restored circle shine before people." },
    ],
  },
]

const topicIndex = [
  {
    topic: "Opening blessings",
    verses: ["Numbers 6:24-26", "John 20:21"],
    useCase: "Speak peace while acknowledging fear and the need for divine covering.",
  },
  {
    topic: "Confession & truth telling",
    verses: ["Psalm 32:5", "1 John 1:7-9"],
    useCase: "Guide responsible parties toward full disclosure plus hope.",
  },
  {
    topic: "Repair commitments",
    verses: ["Exodus 22:1", "Luke 19:8"],
    useCase: "Design restitution that signals transformation, not checkbox compliance.",
  },
  {
    topic: "Community reassurance",
    verses: ["Nehemiah 2:17-18", "2 Corinthians 5:18-20"],
    useCase: "Frame updates to board members, volunteers, or civic partners.",
  },
  {
    topic: "Aftercare endurance",
    verses: ["Hebrews 10:23-25", "Galatians 6:9"],
    useCase: "Encourage teams who feel fatigue during long repair covenants.",
  },
]

const missionPractices: MissionPractice[] = [
  {
    title: "Trauma-informed discipleship",
    verse: "Psalm 34:18",
    note: "The LORD is near to those who have a broken heart. Use this to normalize grounding pauses and chaplain support.",
    icon: HeartHandshake,
  },
  {
    title: "Covenant integrity",
    verse: "Ecclesiastes 5:4-5",
    note: "Pay what you have vowed. Reference this when entering timelines, escalation paths, and signatures in Notion or Airtable.",
    icon: ShieldCheck,
  },
  {
    title: "Mission Life witness",
    verse: "Matthew 5:16",
    note: "Let your light so shine before people. Use this as the closing benediction when teams brief the broader community.",
    icon: Sparkles,
  },
]

export const metadata: Metadata = {
  title: "Restorative Justice Reference Bible (NKJV Companion)",
  description:
    "A curated New King James Version field guide that anchors each stage of Life-AI's restorative justice process in scripture.",
}

export default function RestorativeJusticeReferenceBiblePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        <Breadcrumb className="text-sm text-slate-500">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Workspace</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/library">Library</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Restorative Justice Reference Bible</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">NKJV Companion</Badge>
            <Badge>Restorative Justice</Badge>
            <Badge variant="outline">Mission Life</Badge>
          </div>
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Restorative Justice Reference Bible
            </h1>
            <p className="text-lg text-slate-600">
              A scripture-first field guide for facilitators, chaplains, and case managers who steward Mission Life circles.
              Each passage is drawn from the New King James Version and aligned with the restorative justice milestones we walk
              every week.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compiled for</p>
              <p className="text-base font-semibold text-slate-900">Restorative Justice Team</p>
              <p className="text-sm text-slate-500">Mission Life & OUGM cohort</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</p>
              <p className="text-base font-semibold text-slate-900">January 5, 2025</p>
              <p className="text-sm text-slate-500">Reviewed every cohort launch</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">When to grab this</p>
              <p className="text-base font-semibold text-slate-900">Pre-briefs · Live circles · Aftercare</p>
              <p className="text-sm text-slate-500">Pair with facilitator journal</p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-amber-100 bg-amber-50/80 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <BookOpenCheck className="h-6 w-6 text-amber-500" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">How to use this companion</p>
              <p className="text-base text-amber-800">
                Pair one passage with every agenda item, then invite the room to notice what God highlights.
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-3 text-sm text-amber-900 sm:grid-cols-2">
            <li className="rounded-xl border border-amber-100 bg-white/70 p-4">
              <span className="font-semibold text-amber-800">Briefing blocks:</span> Open staff huddles with Micah 6:8,
              then assign a listener to report how they saw mercy in the session.
            </li>
            <li className="rounded-xl border border-amber-100 bg-white/70 p-4">
              <span className="font-semibold text-amber-800">Circle anchors:</span> Keep one verse printed on table tents so
              harmed parties can point back to it if emotion spikes.
            </li>
            <li className="rounded-xl border border-amber-100 bg-white/70 p-4">
              <span className="font-semibold text-amber-800">Aftercare notes:</span> Drop a scripture reference inside
              Airtable case notes to remind mentors which promise to rehearse midweek.
            </li>
            <li className="rounded-xl border border-amber-100 bg-white/70 p-4">
              <span className="font-semibold text-amber-800">Community briefings:</span> Share the topic index below when
              board members or donors ask for theological grounding.
            </li>
          </ul>
        </section>

        <section aria-labelledby="journey" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field pathway</p>
              <h2 id="journey" className="text-2xl font-semibold text-slate-900">
                Scripture map for every restorative justice stage
              </h2>
            </div>
            <Badge variant="outline" className="text-slate-600">
              Updated per cohort debrief
            </Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {journeyStages.map((stage, index) => (
              <Card key={stage.title} className="border-slate-200">
                <CardHeader className="gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Phase {index + 1}</Badge>
                    <CardTitle className="text-lg">{stage.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base text-slate-600">{stage.focus}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    {stage.scriptures.map((entry) => (
                      <div key={entry.reference} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <p className="text-sm font-semibold text-slate-900">{entry.reference} · NKJV</p>
                        <p className="mt-1 text-sm italic text-slate-600">&ldquo;{entry.excerpt}&rdquo;</p>
                        <p className="mt-2 text-sm text-slate-600">{entry.application}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Practice prompts</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {stage.prompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="roles" className="space-y-6">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role-based scripture tracks</p>
              <h2 id="roles" className="text-2xl font-semibold text-slate-900">Give every team seat a biblical lane</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {roleCompanions.map((role) => (
              <Card key={role.role} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">{role.role}</CardTitle>
                  <CardDescription className="text-sm text-slate-600">{role.focus}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {role.scriptures.map((scripture) => (
                    <div key={scripture.reference} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <p className="text-sm font-semibold text-slate-900">{scripture.reference}</p>
                      <p className="text-sm text-slate-600">{scripture.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="scripts">
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Circle scripts</p>
              <h2 id="scripts" className="text-2xl font-semibold text-slate-900">Word-for-word prompts for critical beats</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {circleMoments.map((moment) => (
              <Card key={moment.moment} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">{moment.moment}</CardTitle>
                  <CardDescription className="text-sm text-slate-600">{moment.verse} · NKJV</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">{moment.script}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="questions" className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Frequently asked</p>
            <h2 id="questions" className="text-2xl font-semibold text-slate-900">
              Quick answers for facilitation pinch-points
            </h2>
            <p className="text-base text-slate-600">
              Use these when volunteers, residents, or civic partners ask why we are choosing a restorative path.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {commonQuestions.map((item) => (
              <Card key={item.question} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-slate-900/5 p-2 text-slate-900">
                      <ScrollText className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.question}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">{item.guidance}</p>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scripture anchors</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {item.scriptures.map((ref) => (
                        <li key={ref.reference} className="flex items-start gap-2">
                          <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="font-semibold text-slate-900">{ref.reference}</p>
                            <p className="text-slate-600">{ref.note}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="regulation" className="space-y-6">
          <div className="flex items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Healing & regulation wells</p>
              <h2 id="regulation" className="text-2xl font-semibold text-slate-900">Keep nervous systems and hope steady</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {regulationPaths.map((path) => (
              <Card key={path.title} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">{path.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-600">{path.verse} · NKJV</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{path.practice}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="index" className="rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference index</p>
              <h2 id="index" className="text-2xl font-semibold text-slate-900">
                Topic-to-scripture lookup
              </h2>
              <p className="text-base text-slate-600">Copy these pairings into agendas, emails, and briefing decks.</p>
            </div>
            <Badge variant="secondary">Shareable excerpt</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {topicIndex.map((entry) => (
              <div key={entry.topic} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{entry.topic}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {entry.verses.map((verse) => (
                    <li key={verse} className="flex items-center gap-2 text-slate-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {verse}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-slate-600">{entry.useCase}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="practices">
          <div className="flex items-center gap-3">
            <HeartHandshake className="h-6 w-6 text-emerald-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mission Life practice lenses</p>
              <h2 id="practices" className="text-2xl font-semibold text-slate-900">Safeguards we rehearse every time</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {missionPractices.map((practice) => (
              <Card key={practice.title} className="border-slate-200">
                <CardHeader className="flex-row items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <practice.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{practice.title}</CardTitle>
                    <CardDescription className="text-sm text-slate-600">{practice.verse} · NKJV</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{practice.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="transition" className="space-y-6">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-slate-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transition markers</p>
              <h2 id="transition" className="text-2xl font-semibold text-slate-900">Keep momentum toward stable housing</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {transitionMarkers.map((marker) => (
              <Card key={marker.marker} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">{marker.marker}</CardTitle>
                  <CardDescription className="text-sm text-slate-600">{marker.verse} · NKJV</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{marker.practice}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-900/90 p-8 text-slate-50">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Prayer of sending</p>
            </div>
            <p className="text-lg">
              &ldquo;Now may the God of patience and comfort grant you to be like-minded toward one another, according to Christ
              Jesus, that you may with one mind and one mouth glorify the God and Father of our Lord Jesus Christ.&rdquo; —
              Romans 15:5-6 (NKJV)
            </p>
            <p className="text-sm text-slate-200">
              Speak this over the room once covenants are signed, then log your reflections inside the case workspace so the
              story becomes part of the Life-AI learning loop.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              <Link href="/library" className="underline decoration-dotted underline-offset-4">
                Return to Library
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/ougm-restorative-justice" className="underline decoration-dotted underline-offset-4">
                Open the OUGM Restorative Justice workspace
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
