import Link from "next/link";

import { SlideDeck, type SlideContent } from "@/components/ougm/SlideDeck";
import { VideoEmbed } from "@/components/ougm/VideoEmbed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const module4Slides: SlideContent[] = [
  {
    title: "Accountability as Covenant",
    subtitle: "Framing agreements through the gospel",
    description:
      "Set theological and cultural context for why accountability at OUGM is relational, restorative, and grounded in covenant.",
    points: [
      { text: "Accountability keeps people connected to community rather than cast out." },
      { text: "We steward consequences that repair harm and uphold safety without shaming." },
      { text: "Every agreement reminds participants they are beloved image bearers invited back into belonging." },
    ],
    scripture: {
      reference: "Galatians 6:1-2",
      text: "Restore such a one in a spirit of gentleness. Carry each other’s burdens.",
    },
  },
  {
    title: "Anatomy of a Strong Agreement",
    subtitle: "Clarity, feasibility, and support",
    description: "Teach facilitators and supervisors the non-negotiables inside every restorative agreement.",
    points: [
      { text: "Harm named in the participants’ own words; needs captured verbatim." },
      { text: "Specific actions with timelines, owners, and accountability partners." },
      { text: "Celebration or ritual planned to mark completion and reinforce belonging." },
    ],
    footerNote: "Share sample agreements and invite participants to score them against this checklist.",
  },
  {
    title: "Action Categories",
    subtitle: "Balance repair across four domains",
    description: "Use these categories to ensure agreements address holistic repair.",
    highlights: [
      { title: "Safety", description: "Boundaries, communication plans, environmental changes." },
      { title: "Restitution", description: "Financial repair, replacing items, service to community." },
      { title: "Relationship", description: "Mediated conversations, check-ins, acts of honor." },
      { title: "Growth", description: "Counseling, recovery work, discipleship practices." },
    ],
    footerNote: "Facilitators: ask participants to propose at least one action in each category when appropriate.",
  },
  {
    title: "Progress Dashboard Walk-Through",
    subtitle: "Track, share, and celebrate agreements",
    description: "Orient staff to the Life-AI dashboard and reporting rhythm.",
    points: [
      { text: "Status indicators: pending, active, completed, paused—color coded for quick reference." },
      { text: "Automated reminders for 24h, 7-day, and 30-day follow-ups sent to support team." },
      { text: "Visuals display agreements completed per month and highlight celebration dates." },
    ],
  },
  {
    title: "Coaching Supervisors & Teams",
    subtitle: "Sustain momentum beyond the circle",
    description: "Equip leaders to reinforce agreements during daily operations.",
    points: [
      { text: "Embed agreement checkpoints into shift briefings and staff meetings." },
      { text: "Encourage supervisors to review agreements in pastoral care or case management sessions." },
      { text: "Document coaching notes so follow-up stays consistent across departments." },
    ],
  },
  {
    title: "Designing Re-entry Circles",
    subtitle: "From accountability to celebration",
    description: "Map a re-entry gathering that centers testimony, gratitude, and future supports.",
    points: [
      { text: "Open with affirmation and scripture that names the journey from harm to healing." },
      { text: "Invite those harmed to share how repair felt and what trust-building continues." },
      { text: "Commission the participant with blessings, commitments, and next-step supports." },
    ],
  },
  {
    title: "Case Study: Jalen’s Return",
    subtitle: "Real-world application",
    description:
      "Walk through a composite case that illustrates the flow from harm to celebration using the dashboard.",
    points: [
      { text: "Incident: conflict in the dorm, property damage, and broken trust with roommate." },
      { text: "Agreement actions: restitution payment plan, weekly mentor check-ins, shared chore rotation." },
      { text: "Outcomes: increased retention, improved roommate relationship, serving as peer ambassador." },
    ],
    footerNote: "Use facilitator notes to prompt discussion: What made this agreement successful? What could improve?",
  },
  {
    title: "Next Steps & Blessing",
    subtitle: "Carrying reconciliation forward",
    description:
      "End the module by assigning concrete tasks and commissioning facilitators to steward reconciliation faithfully.",
    points: [
      { text: "Update one existing agreement in the dashboard using today’s templates." },
      { text: "Schedule a re-entry celebration within the next 30 days with supervision support." },
      { text: "Pray together, thanking God for ongoing stories of restoration at OUGM." },
    ],
  },
];

export default function Module4ResourcePage() {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Link href="/ougm-restorative-justice#section-assets" className="hover:text-emerald-700 hover:underline">
          ← Back to OUGM training hub
        </Link>
      </div>

      <div className="space-y-3">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          Module 4 Resources
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Accountability, Re-entry, and Reconciliation – Trainer Assets
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Translate restorative conversations into actionable agreements, compassionate follow-up, and meaningful re-entry
          experiences. These resources equip facilitators and supervisors to tie agreements to wrap-around supports.
        </p>
      </div>

      <Separator />

      <Card id="slides" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Slide deck & dashboard walk-through</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Use the live deck to walk teams through agreement anatomy, dashboards, and re-entry celebrations. Each slide
            provides concrete prompts and examples ready for direct use in training or supervision meetings.
          </p>
          <SlideDeck slides={module4Slides} accentLabel="Module 4 · Accountability" />
          <p className="text-xs text-slate-500">
            Need to edit the deck? Export to PDF from your browser or request the PowerPoint file at{" "}
            <Link href="mailto:restorativejustice@ougmission.org" className="font-medium text-emerald-700 underline">
              restorativejustice@ougmission.org
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card id="agreement-templates" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Agreement templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Use these text templates alongside the digital Agreement Builder form to capture commitments clearly. Copy the
            prompts below into your facilitator notes and personalize them with participants.
          </p>
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Agreement prompts</p>
            <ul className="list-disc space-y-2 pl-4">
              <li><strong>Harms named:</strong> “What felt broken for you when this happened?”</li>
              <li><strong>Needs identified:</strong> “What would help you feel safe/trust again?”</li>
              <li><strong>Safety action:</strong> “I will ____________________ before quiet hours each night.”</li>
              <li><strong>Restitution action:</strong> “I will repair/replace ____________________ by __________.”</li>
              <li><strong>Relationship action:</strong> “We agree to meet with ____________________ weekly to rebuild trust.”</li>
              <li><strong>Growth action:</strong> “I will engage in ____________________ (counseling, recovery, spiritual care).”</li>
              <li><strong>Support team:</strong> List staff lead, peer ally, mentor, chaplain.</li>
              <li><strong>Follow-up checkpoints:</strong> 24 hours, 7 days, 30 days with responsible connector.</li>
              <li><strong>Celebration plan:</strong> Identify how the community will acknowledge completion.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card id="celebration-checklist" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Re-entry celebration checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Plan re-entry circles that honor progress and re-establish community support. Use this checklist to prepare the
            team.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>Confirm support team attendance (staff lead, resident ally, mentor, chaplain).</li>
            <li>Review agreement progress and note celebrations for each action item.</li>
            <li>Prepare blessing or commissioning ritual (song, scripture, communal affirmation).</li>
            <li>Clarify ongoing supports and follow-up cadence (24h, 7-day, 30-day).</li>
          </ul>
        </CardContent>
      </Card>

      <Card id="video" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Re-entry inspiration video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Share this Catholic Charities/Daly Video Services spotlight on a restorative justice re-entry program. Invite
            facilitators to note language they might reuse during their own celebrations.
          </p>
          <VideoEmbed
            embedUrl="https://www.youtube.com/embed/47IzWX_Zlgo"
            title="Restorative Justice, Prison & Re-entry Program"
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Data &amp; storytelling prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            After each module, pair quantitative tracking with stories of transformation. Use these prompts to gather both.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>What agreements were fulfilled? Which supports made that possible?</li>
            <li>How did participants describe the emotional change before and after the process?</li>
            <li>What follow-up is needed to sustain the change six weeks from now?</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
