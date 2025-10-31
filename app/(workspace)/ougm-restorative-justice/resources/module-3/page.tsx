import Link from "next/link";

import { SlideDeck, type SlideContent } from "@/components/ougm/SlideDeck";
import { VideoEmbed } from "@/components/ougm/VideoEmbed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const module3Slides: SlideContent[] = [
  {
    title: "Circle Process Practicum Welcome",
    subtitle: "From preparation to celebration",
    description:
      "Set expectations for a highly interactive session that mixes demonstration, observation, and live practice.",
    points: [
      { text: "Review the day’s flow: demo circle, practice triads, coaching debriefs." },
      { text: "Name roles in each practice round: facilitator, participant, observer." },
      { text: "Invite participants to keep the Restorative Triangle visible throughout the practicum." },
    ],
  },
  {
    title: "Preparation Meetings",
    subtitle: "Consent, story, and support",
    description: "Walk through the essential steps before any restorative conference or circle.",
    points: [
      { text: "Confirm willingness, voice preferences, and accessibility needs for each participant." },
      { text: "Clarify the harm story from each perspective without adjudicating facts." },
      { text: "Identify support people, cultural considerations, and follow-up commitments." },
    ],
    footerNote: "Demo a preparation call script and invite the group to practice the consent language in pairs.",
  },
  {
    title: "Room Setup & Materials",
    subtitle: "Physical environment matters",
    description: "Give participants a mental checklist before they host a restorative gathering.",
    highlights: [
      { title: "Space", description: "Chairs in a circle, unobstructed exits, soft lighting where possible." },
      { title: "Talking Piece", description: "Choose an item meaningful to the group—cross, stone, or artwork." },
      { title: "Visuals", description: "Display agreements, triangle poster, and agenda in sight of all." },
    ],
    footerNote: "Invite the group to arrange the room together and note what details increase felt safety.",
  },
  {
    title: "Opening the Circle",
    subtitle: "Agreements and sacred space",
    description: "Model an opening that honors every voice and centers values.",
    points: [
      { text: "Welcome participants by name and acknowledge the courage it takes to gather." },
      { text: "Review shared agreements; invite additions and check for consent." },
      { text: "Offer a grounding practice or blessing aligned with the group’s faith tradition." },
    ],
  },
  {
    title: "Storytelling Sequence",
    subtitle: "Listen · Reflect · Summarize",
    description: "Coach facilitators to guide dialogue that surfaces impact and needs.",
    points: [
      {
        text: "Round 1: What happened from your perspective?",
        helper: "Use open questions, reflect feelings, and refrain from judging accuracy.",
      },
      {
        text: "Round 2: Who was impacted and how?",
        helper: "Name emotional, physical, and spiritual impact on self and community.",
      },
      {
        text: "Round 3: What do you need for the relationship to move forward?",
        helper: "Capture needs on a visible board or digital note in real time.",
      },
    ],
  },
  {
    title: "Building Agreements",
    subtitle: "Harms · Needs · Obligations",
    description:
      "Translate the dialogue into clear commitments that everyone understands and can implement.",
    points: [
      { text: "Group brainstorm: list possible actions for repair across relationship, restitution, growth, and safety." },
      { text: "Invite those responsible to propose commitments first, then check for alignment with those harmed." },
      { text: "Confirm feasibility, supports, and timelines; assign accountability partners." },
    ],
    footerNote: "Demonstrate the Agreement Builder form while capturing bullet points in real time.",
  },
  {
    title: "Documentation & Follow-Up",
    subtitle: "Keep agreements visible",
    description:
      "Show how facilitators coordinate with supervisors, case managers, and digital tools after the circle.",
    points: [
      { text: "Summarize agreements within 24 hours using the Agreement Builder digital form." },
      { text: "Schedule check-ins or celebration touchpoints on the calendar before leaving the room." },
      { text: "Attach notes to resident records so staff can uphold commitments during shifts." },
    ],
  },
  {
    title: "Closing & Celebration",
    subtitle: "Honor the work and set next steps",
    description:
      "Model a meaningful closing that celebrates progress, reinforces community, and outlines the path ahead.",
    points: [
      { text: "Invite participants to share one word or phrase describing how they are leaving the circle." },
      { text: "Bless or pray over the group, naming gratitude for courage and vulnerability." },
      { text: "Preview upcoming circles or community-building gatherings to sustain momentum." },
    ],
    scripture: {
      reference: "Romans 12:18",
      text: "If it is possible, as far as it depends on you, live at peace with everyone.",
    },
  },
];

export default function Module3ResourcePage() {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Link href="/ougm-restorative-justice#section-assets" className="hover:text-emerald-700 hover:underline">
          ← Back to OUGM training hub
        </Link>
      </div>

      <div className="space-y-3">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          Module 3 Resources
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Circle Process & Conference Design – Trainer Assets
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Build facilitator confidence for harm circles, conferences, and community-building gatherings. These assets
          include scripts, observation rubrics, and practice scenarios tailored to OUGM.
        </p>
      </div>

      <Separator />

      <Card id="slides" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Annotated slide deck</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Guide participants with the interactive deck. Each slide includes step-by-step instructions and coaching
            prompts tailored to OUGM&apos;s restorative conference flow. Use it alongside live demonstrations or fishbowl
            practice.
          </p>
          <SlideDeck slides={module3Slides} accentLabel="Module 3 · Circle Design" />
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Need editable files? Download a PDF via your browser print dialog or email{" "}
            <Link href="mailto:restorativejustice@ougmission.org" className="font-medium text-emerald-700 underline">
              restorativejustice@ougmission.org
            </Link>{" "}
            for the PowerPoint version.
          </p>
        </CardContent>
      </Card>

      <Card id="facilitator-rubric" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Facilitator quality rubric</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Use this rubric to offer specific, strengths-based feedback after practice circles or live facilitation. Score 1
            (emerging) to 4 (thriving) across the categories below.
          </p>
          <ul className="space-y-2 list-disc pl-5 text-slate-700">
            <li><strong>Presence &amp; regulation:</strong> Breath, posture, tone, co-regulation skills.</li>
            <li><strong>Process stewardship:</strong> Clear steps, time management, honoring agreements.</li>
            <li><strong>Trauma responsiveness:</strong> Offers choice, grounds participants, adapts as needed.</li>
            <li><strong>Documentation:</strong> Captures agreements accurately, clarifies follow-up owners.</li>
          </ul>
          <p className="text-xs text-slate-500">
            Print the rubric from the hub or duplicate into your coaching notebook for digital use.
          </p>
        </CardContent>
      </Card>

      <Card id="scenario-packets" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Scenario packets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Facilitate triads (facilitator, participant, observer) with ready-made scenarios. Each packet includes character
            background, emotional cues, and desired support needs.
          </p>
          <ul className="space-y-2 list-disc pl-5 text-slate-700">
            <li><strong>Resident &amp; Resident:</strong> Conflict over personal belongings in the dorms.</li>
            <li><strong>Resident &amp; Staff:</strong> Incident during curfew check-in involving disrespectful tone.</li>
            <li><strong>Resident &amp; Volunteer:</strong> Miscommunication in the kitchen leading to hurt feelings.</li>
          </ul>
          <p className="text-xs text-slate-500">
            Download the DOCX packets from the shared drive or request the latest versions via email.
          </p>
        </CardContent>
      </Card>

      <Card id="video" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Conference demonstration video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Watch this SchoolTalk DC training segment on core restorative circle processes before practice rounds. Pause
            to note facilitator moves and questions that invite ownership from participants.
          </p>
          <VideoEmbed
            embedUrl="https://www.youtube.com/embed/wDAc6Qkqhj0"
            title="Core Processes of Restorative Justice Circles"
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Practice debrief prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <ol className="space-y-2 pl-5 text-slate-700">
            <li>Where did you experience shared ownership of the process? Where did you carry too much?</li>
            <li>How did you adapt when emotions surfaced? What support did you offer participants?</li>
            <li>What documentation decisions helped you capture agreements clearly?</li>
          </ol>
          <p className="text-xs text-slate-500">
            Pair these prompts with the facilitator quality rubric to enrich feedback conversations.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
