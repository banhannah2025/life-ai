import type { Metadata } from "next"
import Link from "next/link"
import { BookOpenCheck, Bookmark, CheckCircle2, Compass, HeartHandshake, Home, LifeBuoy, ListChecks, ScrollText, Sparkles, Sun } from "lucide-react"
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

type RoadmapChapter = {
  title: string
  focus: string
  scriptures: { reference: string; excerpt: string; application: string }[]
  prompts: string[]
}

type RoleCompanion = {
  role: string
  focus: string
  scriptures: { reference: string; note: string }[]
}

type LiturgyMoment = {
  moment: string
  script: string
  verse: string
}

type RegulationRoutine = {
  title: string
  verse: string
  practice: string
}

type TransitionMarker = {
  marker: string
  verse: string
  practice: string
}

type MissionPractice = {
  title: string
  verse: string
  note: string
  icon: LucideIcon
}

const roadmapChapters: RoadmapChapter[] = [
  {
    title: "Sunrise chapel & welcome",
    focus: "Root the house in God's mercy before chores, schedules, or case updates begin.",
    scriptures: [
      {
        reference: "Lamentations 3:22-23",
        excerpt: "Through the LORD’s mercies we are not consumed... They are new every morning; great is Your faithfulness.",
        application: "Remind patrons and staff that every day opens with mercy, not performance metrics.",
      },
      {
        reference: "Psalm 5:3",
        excerpt: "My voice You shall hear in the morning, O LORD; in the morning I will direct it to You, and I will look up.",
        application: "Invite residents to speak gratitudes aloud before reviewing daily assignments.",
      },
      {
        reference: "Matthew 6:33",
        excerpt: "Seek first the kingdom of God and His righteousness, and all these things shall be added to you.",
        application: "Frame morning briefings as a kingdom-first agenda that still meets housing and employment needs.",
      },
    ],
    prompts: [
      "Which promise from today’s passage do you want to rehearse as you serve?",
      "What provision are you trusting God to add as you focus on His kingdom?",
    ],
  },
  {
    title: "Healing rooms & pastoral counseling",
    focus: "Create confidential, unhurried spaces where harm, grief, and relapse can surface honestly.",
    scriptures: [
      {
        reference: "James 5:16",
        excerpt: "Confess your trespasses to one another, and pray for one another, that you may be healed.",
        application: "Signal that pastors and advocates guard confession as a sacred path toward healing.",
      },
      {
        reference: "Isaiah 61:3",
        excerpt: "To console those who mourn in Zion... that they may be called trees of righteousness.",
        application: "Print this verse near tissues and journals to remind participants that mourning grows roots.",
      },
      {
        reference: "Psalm 147:3",
        excerpt: "He heals the brokenhearted and binds up their wounds.",
        application: "Encourage staff to name God as the healer, keeping themselves in a companion posture.",
      },
    ],
    prompts: [
      "Where did you notice the Spirit consoling someone today?",
      "What lament or truth needs to be logged for follow-up care?",
    ],
  },
  {
    title: "Workforce labs & mentoring",
    focus: "Translate discipleship into diligent work habits, interviews, and vocational imagination.",
    scriptures: [
      {
        reference: "Colossians 3:23-24",
        excerpt: "Whatever you do, do it heartily, as to the Lord and not to men... for you serve the Lord Christ.",
        application: "Open skill labs reminding patrons that excellence is worship, not people-pleasing.",
      },
      {
        reference: "Proverbs 22:29",
        excerpt: "Do you see a man who excels in his work? He will stand before kings; he will not stand before unknown men.",
        application: "Highlight how practiced excellence opens doors with employers and community partners.",
      },
      {
        reference: "1 Thessalonians 4:11-12",
        excerpt: "Aspire to lead a quiet life, to work with your own hands... that you may walk properly toward those who are outside.",
        application: "Encourage trainees that steady work is a witness that silences stigma.",
      },
    ],
    prompts: [
      "Which scripture will you reference in today’s coaching log?",
      "Where can we celebrate diligence that reflects Christ’s workmanship?",
    ],
  },
  {
    title: "Housing navigation & covenant planning",
    focus: "Align paperwork, budgeting, and housing searches with passages that promise stable dwellings.",
    scriptures: [
      {
        reference: "Isaiah 32:18",
        excerpt: "My people will dwell in a peaceful habitation, in secure dwellings, and in quiet resting places.",
        application: "Anchor housing appointments with this promise when obstacles feel relentless.",
      },
      {
        reference: "Proverbs 24:3-4",
        excerpt: "Through wisdom a house is built, and by understanding it is established.",
        application: "Teach patrons to pair budgeting spreadsheets with wisdom prayers.",
      },
      {
        reference: "Psalm 37:3-5",
        excerpt: "Trust in the LORD, and do good... Delight yourself also in the LORD, and He shall give you the desires of your heart.",
        application: "Revisit this passage during covenant reviews to keep delight rooted in obedience.",
      },
    ],
    prompts: [
      "Which housing task today requires fresh wisdom or favor?",
      "How will we celebrate small steps toward a peaceful dwelling?",
    ],
  },
  {
    title: "Evening dorm life & reconciliation",
    focus: "Close the day with examen, peacemaking, and shared gratitude so rooms rest in peace.",
    scriptures: [
      {
        reference: "Ephesians 4:26-27",
        excerpt: "Do not let the sun go down on your wrath, nor give place to the devil.",
        application: "Coach dorm supervisors to pursue reconciliation before quiet hours.",
      },
      {
        reference: "Philippians 4:8",
        excerpt: "Whatever things are true... meditate on these things.",
        application: "Guide roommates to name true and lovely moments before lights out.",
      },
      {
        reference: "Psalm 4:8",
        excerpt: "I will both lie down in peace, and sleep; for You alone, O LORD, make me dwell in safety.",
        application: "Use this as a nightly bed blessing over each room.",
      },
    ],
    prompts: [
      "Who needs a quick reconciliation huddle before sleep?",
      "What truth from today will we rehearse as we rest?",
    ],
  },
  {
    title: "Alumni care & sending",
    focus: "Bless graduates and alumni families with scriptures that keep them tethered to community and mission.",
    scriptures: [
      {
        reference: "Philippians 1:6",
        excerpt: "He who has begun a good work in you will complete it until the day of Jesus Christ.",
        application: "Include this in every exit letter so alumni expect continued growth.",
      },
      {
        reference: "Deuteronomy 31:8",
        excerpt: "The LORD, He is the One who goes before you. He will be with you... do not fear nor be dismayed.",
        application: "Pray this blessing during key ceremonies and alumni calls.",
      },
      {
        reference: "Hebrews 10:24-25",
        excerpt: "Let us consider one another in order to stir up love and good works... exhorting one another.",
        application: "Invite alumni into small groups or text threads that keep encouragement flowing.",
      },
    ],
    prompts: [
      "Which alumni needs a check-in this week?",
      "What scripture will anchor the next alumni gathering?",
    ],
  },
]

const roleCompanions: RoleCompanion[] = [
  {
    role: "Chaplains & spiritual care",
    focus: "Hold space for confession, worship, and blessing throughout the Mission Life rhythm.",
    scriptures: [
      { reference: "John 15:4", note: "Abide in Christ so ministry flows from connection, not depletion." },
      { reference: "Hebrews 4:16", note: "Invite residents to the throne of grace when shame surfaces." },
    ],
  },
  {
    role: "Dorm supervisors",
    focus: "Shepherd dorm culture with calm authority and relational accountability.",
    scriptures: [
      { reference: "Proverbs 27:23", note: "Know the state of your flock; keep pulse on every room." },
      { reference: "Colossians 3:14", note: "Above all, put on love; it keeps discipline bound to unity." },
    ],
  },
  {
    role: "Housing advocates",
    focus: "Guide patrons through paperwork, budgeting, and landlord conversations with hope.",
    scriptures: [
      { reference: "Jeremiah 29:7", note: "Seek the peace of the city; housing success blesses neighborhoods." },
      { reference: "Psalm 84:11", note: "No good thing does He withhold from those who walk uprightly—pray this over waitlists." },
    ],
  },
  {
    role: "Workforce coaches",
    focus: "Translate discipleship into job readiness, interviews, and steady income plans.",
    scriptures: [
      { reference: "Ephesians 2:10", note: "Call out good works God prepared—link résumés to calling." },
      { reference: "Proverbs 16:3", note: "Commit plans to the LORD as you set weekly goals." },
    ],
  },
  {
    role: "Peer mentors",
    focus: "Normalize vulnerability, model recovery, and keep momentum between staff touchpoints.",
    scriptures: [
      { reference: "Ecclesiastes 4:9-10", note: "Two are better than one—remind mentees they are not alone." },
      { reference: "Romans 12:10", note: "In honor giving preference to one another stabilizes community life." },
    ],
  },
  {
    role: "Operations leads",
    focus: "Guard rhythms, safety workflows, and data systems so ministry remains sustainable.",
    scriptures: [
      { reference: "1 Corinthians 14:40", note: "Let all things be done decently and in order—structure is pastoral care." },
      { reference: "Nehemiah 4:14", note: "Remember the Lord; fight for brothers and houses while you administrate." },
    ],
  },
]

const liturgyMoments: LiturgyMoment[] = [
  {
    moment: "Sunrise blessing",
    script: "The LORD lifts His countenance upon us; we receive His peace before email, chores, or case notes.",
    verse: "Numbers 6:24-26",
  },
  {
    moment: "Midday reset",
    script: "We return to our Strong Tower; we inhale His nearness and exhale the burdens we picked up.",
    verse: "Proverbs 18:10",
  },
  {
    moment: "Shift change debrief",
    script: "May the beauty of the LORD rest upon us and establish the work of our hands as we hand off assignments.",
    verse: "Psalm 90:17",
  },
  {
    moment: "Lights-out benediction",
    script: "The Keeper of Israel neither slumbers nor sleeps; we lie down in His keeping tonight.",
    verse: "Psalm 121:4-5",
  },
]

const regulationRoutines: RegulationRoutine[] = [
  {
    title: "Grounding corners",
    verse: "Isaiah 26:3",
    practice: "Designate prayer corners with weighted blankets and scripture cards to keep minds stayed on Him.",
  },
  {
    title: "Hope journaling",
    verse: "Philippians 4:6-7",
    practice: "Pair journaling prompts with breath prayers anytime anxiety spikes before coaching or housing calls.",
  },
  {
    title: "Crisis pause scripts",
    verse: "Psalm 46:1",
    practice: "Walk residents through slow breathing and present-tense truths: God is our refuge and strength.",
  },
]

const topicIndex = [
  {
    topic: "Morning liturgy",
    verses: ["Psalm 143:8", "Mark 1:35"],
    useCase: "Open chapel or kitchen shifts with assurance of God’s steadfast love.",
  },
  {
    topic: "Healing after harm",
    verses: ["Joel 2:25", "Psalm 147:3"],
    useCase: "Support pastoral conversations about relapse, grief, or family fractures.",
  },
  {
    topic: "Workforce hope",
    verses: ["Colossians 3:23", "Proverbs 16:3"],
    useCase: "Encourage perseverance when job searches stall or feedback feels sharp.",
  },
  {
    topic: "Housing trust",
    verses: ["Psalm 37:3-5", "Isaiah 32:18"],
    useCase: "Ground budgeting sessions and landlord callbacks in promised rest.",
  },
  {
    topic: "Alumni connection",
    verses: ["Hebrews 10:24-25", "3 John 1:2"],
    useCase: "Craft texts, letters, and event blessings that keep alumni tethered.",
  },
]

const commonQuestions = [
  {
    question: "How do we balance program rules with grace?",
    guidance:
      "Titus 2:11-12 shows grace teaching us to deny ungodliness while living soberly and righteously. Pair it with Micah 6:8 so staff remember justice, mercy, and humility belong together. Share both when explaining why boundaries and compassion arrive in the same conversation.",
    scriptures: [
      { reference: "Titus 2:11-12", note: "Grace teaches disciplined living without shame-fueled threats." },
      { reference: "Micah 6:8", note: "Justice and mercy must walk humbly together in every policy." },
    ],
  },
  {
    question: "What scripture anchors performance conversations in workforce labs?",
    guidance:
      "Colossians 3:23-24 reframes labor as service to the Lord, which frees coaches to celebrate diligence without perfectionism. Add Proverbs 22:29 to remind trainees that excellence expands opportunity. Use both when giving feedback so hope stays higher than critique.",
    scriptures: [
      { reference: "Colossians 3:23-24", note: "Work heartily as serving Christ, not just supervisors." },
      { reference: "Proverbs 22:29", note: "Skillful diligence positions residents before decision-makers." },
    ],
  },
  {
    question: "How do we calm the dorm after a crisis or conflict?",
    guidance:
      "Mark 4:39 shows Jesus speaking 'Peace, be still' into a storm, giving staff a script for the atmosphere. Pair it with Psalm 46:1 so residents remember God is present help while they regulate. Repeat both verses during de-escalation huddles.",
    scriptures: [
      { reference: "Mark 4:39", note: "Speak peace with authority borrowed from Jesus." },
      { reference: "Psalm 46:1", note: "Name God as refuge and strength in present-tense crises." },
    ],
  },
  {
    question: "How do we encourage alumni when life hits hard again?",
    guidance:
      "Philippians 1:6 assures them God finishes what He starts. Link it with Hebrews 10:23 so alumni hold fast without wavering. Send these passages in texts, alumni check-ins, and milestone celebrations.",
    scriptures: [
      { reference: "Philippians 1:6", note: "God continues the work beyond program graduation." },
      { reference: "Hebrews 10:23", note: "Hold fast to hope because He who promised is faithful." },
    ],
  },
]

const missionPractices: MissionPractice[] = [
  {
    title: "Whole-day worship",
    verse: "Romans 12:1",
    note: "Offer morning routines, coaching sessions, and paperwork as living sacrifices that stay holy and reasonable.",
    icon: Sun,
  },
  {
    title: "Hospitality guardrails",
    verse: "1 Peter 4:9",
    note: "Practice cheerful hospitality while keeping safety plans and trauma-informed boundaries intact.",
    icon: HeartHandshake,
  },
  {
    title: "Covenant follow-through",
    verse: "Joshua 21:45",
    note: "Review action steps weekly because every promise God makes comes to pass—model the same faithfulness.",
    icon: CheckCircle2,
  },
]

const transitionMarkers: TransitionMarker[] = [
  {
    marker: "24-hour stabilization checklist",
    verse: "Psalm 23:2-3",
    practice: "Complete intake, healthcare referrals, and first chapel blessing so new arrivals feel shepherded quickly.",
  },
  {
    marker: "30-day discipleship milestone",
    verse: "Philippians 3:13-14",
    practice: "Record spiritual, workforce, and housing wins; reset goals pressing toward the upward call.",
  },
  {
    marker: "Housing key celebration",
    verse: "Psalm 126:3",
    practice: "Host a blessing circle when keys are received and document alumni support steps before move-out.",
  },
]

export const metadata: Metadata = {
  title: "Mission Life Reference Bible (NKJV Roadmap Edition)",
  description:
    "A New King James Version roadmap that weaves scripture through Mission Life’s chapel rhythms, healing rooms, workforce labs, housing navigation, and alumni care.",
}

export default function MissionLifeReferenceBiblePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 pb-16 text-emerald-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        <Breadcrumb className="text-sm text-emerald-700/80">
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
              <BreadcrumbPage>Mission Life Reference Bible</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-lg shadow-emerald-100">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">NKJV Roadmap</Badge>
            <Badge>Mission Life</Badge>
            <Badge variant="outline">Edition Two</Badge>
          </div>
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold leading-tight text-emerald-950 sm:text-4xl">
              Mission Life Reference Bible
            </h1>
            <p className="text-lg text-emerald-700">
              A scripture companion for every Mission Life milestone—chapels, healing rooms, workforce labs, housing
              appointments, and alumni calls—so the entire house travels the same discipleship path.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Compiled for</p>
              <p className="text-base font-semibold text-emerald-950">Mission Life Teams</p>
              <p className="text-sm text-emerald-600">Chaplains · Advocates · Operations</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Last updated</p>
              <p className="text-base font-semibold text-emerald-950">January 5, 2025</p>
              <p className="text-sm text-emerald-600">Reviewed each program quarter</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">When to grab this</p>
              <p className="text-base font-semibold text-emerald-950">Shift huddles · Coaching · Ceremonies</p>
              <p className="text-sm text-emerald-600">Pair with cohort planning board</p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <BookOpenCheck className="h-6 w-6 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">How to use this roadmap</p>
              <p className="text-base text-emerald-800">
                Thread scripture through every rhythm: chapel, coaching, crisis response, and alumni follow-up.
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-3 text-sm text-emerald-900 sm:grid-cols-2">
            <li className="rounded-xl border border-emerald-100 bg-white/70 p-4">
              <span className="font-semibold text-emerald-800">Shift starters:</span> Open staff and volunteer briefings
              with the day’s chapter verse and capture reflections in the ops log.
            </li>
            <li className="rounded-xl border border-emerald-100 bg-white/70 p-4">
              <span className="font-semibold text-emerald-800">Resident coaching:</span> Attach a scripture to each action
              step so patrons rehearse truth while they practice new skills.
            </li>
            <li className="rounded-xl border border-emerald-100 bg-white/70 p-4">
              <span className="font-semibold text-emerald-800">Crisis resets:</span> Keep regulation routines printed near
              calming stations with the verses that anchor them.
            </li>
            <li className="rounded-xl border border-emerald-100 bg-white/70 p-4">
              <span className="font-semibold text-emerald-800">Alumni care:</span> Use the topic index for texts, letters,
              and blessing ceremonies once keys or jobs are secured.
            </li>
          </ul>
        </section>

        <section aria-labelledby="roadmap" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Housewide pathway</p>
              <h2 id="roadmap" className="text-2xl font-semibold text-emerald-950">
                Scripture anchors for every Mission Life lane
              </h2>
            </div>
            <Badge variant="outline" className="text-emerald-700">
              Updated with quarterly debriefs
            </Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {roadmapChapters.map((chapter, index) => (
              <Card key={chapter.title} className="border-emerald-100">
                <CardHeader className="gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Chapter {index + 1}</Badge>
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base text-emerald-700">{chapter.focus}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    {chapter.scriptures.map((entry) => (
                      <div key={entry.reference} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <p className="text-sm font-semibold text-emerald-900">{entry.reference} · NKJV</p>
                        <p className="mt-1 text-sm italic text-emerald-700">&ldquo;{entry.excerpt}&rdquo;</p>
                        <p className="mt-2 text-sm text-emerald-700">{entry.application}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Practice prompts</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                      {chapter.prompts.map((prompt) => (
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
            <ListChecks className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Role companions</p>
              <h2 id="roles" className="text-2xl font-semibold text-emerald-950">Give every seat a scripture lane</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {roleCompanions.map((role) => (
              <Card key={role.role} className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-lg">{role.role}</CardTitle>
                  <CardDescription className="text-sm text-emerald-700">{role.focus}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {role.scriptures.map((scripture) => (
                    <div key={scripture.reference} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                      <p className="text-sm font-semibold text-emerald-900">{scripture.reference}</p>
                      <p className="text-sm text-emerald-700">{scripture.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6" aria-labelledby="liturgy">
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">House liturgies</p>
              <h2 id="liturgy" className="text-2xl font-semibold text-emerald-950">Word-for-word prompts for key moments</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {liturgyMoments.map((moment) => (
              <Card key={moment.moment} className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-base">{moment.moment}</CardTitle>
                  <CardDescription className="text-sm text-emerald-700">{moment.verse} · NKJV</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800">{moment.script}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="questions" className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Frequently asked</p>
            <h2 id="questions" className="text-2xl font-semibold text-emerald-950">
              Quick answers for Mission Life pinch-points
            </h2>
            <p className="text-base text-emerald-700">
              Keep these responses ready for staff briefings, donor conversations, and resident coaching moments.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {commonQuestions.map((item) => (
              <Card key={item.question} className="border-emerald-100">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-emerald-900/5 p-2 text-emerald-900">
                      <ScrollText className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.question}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-emerald-700">{item.guidance}</p>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Scripture anchors</p>
                    <ul className="mt-2 space-y-2 text-sm text-emerald-800">
                      {item.scriptures.map((ref) => (
                        <li key={ref.reference} className="flex items-start gap-2">
                          <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          <div>
                            <p className="font-semibold text-emerald-900">{ref.reference}</p>
                            <p className="text-emerald-700">{ref.note}</p>
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
            <LifeBuoy className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Healing & regulation</p>
              <h2 id="regulation" className="text-2xl font-semibold text-emerald-950">Keep nervous systems steady</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {regulationRoutines.map((routine) => (
              <Card key={routine.title} className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-base">{routine.title}</CardTitle>
                  <CardDescription className="text-sm text-emerald-700">{routine.verse} · NKJV</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-700">{routine.practice}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="index" className="rounded-3xl border border-emerald-100 bg-white/90 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Reference index</p>
              <h2 id="index" className="text-2xl font-semibold text-emerald-950">
                Topic-to-scripture lookup
              </h2>
              <p className="text-base text-emerald-700">Drop these pairings into agendas, handbooks, and donor briefs.</p>
            </div>
            <Badge variant="secondary">Shareable excerpt</Badge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {topicIndex.map((entry) => (
              <div key={entry.topic} className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">{entry.topic}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {entry.verses.map((verse) => (
                    <li key={verse} className="flex items-center gap-2 text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {verse}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-emerald-700">{entry.useCase}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="practices">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Mission Life practices</p>
              <h2 id="practices" className="text-2xl font-semibold text-emerald-950">Safeguards we rehearse daily</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {missionPractices.map((practice) => (
              <Card key={practice.title} className="border-emerald-100">
                <CardHeader className="flex-row items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <practice.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{practice.title}</CardTitle>
                    <CardDescription className="text-sm text-emerald-700">{practice.verse} · NKJV</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-700">{practice.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="transition" className="space-y-6">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Transition markers</p>
              <h2 id="transition" className="text-2xl font-semibold text-emerald-950">Keep momentum toward wholeness</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {transitionMarkers.map((marker) => (
              <Card key={marker.marker} className="border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-base">{marker.marker}</CardTitle>
                  <CardDescription className="text-sm text-emerald-700">{marker.verse} · NKJV</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-700">{marker.practice}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-emerald-900/90 p-8 text-emerald-50">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Prayer of sending</p>
            </div>
            <p className="text-lg">
              &ldquo;Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope by the
              power of the Holy Spirit.&rdquo; — Romans 15:13 (NKJV)
            </p>
            <p className="text-sm text-emerald-100">
              Speak this at the close of chapels, cohort graduations, and housing ceremonies. Log reflections inside the
              Mission Life workspace so victories become shared memory.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-emerald-100">
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
