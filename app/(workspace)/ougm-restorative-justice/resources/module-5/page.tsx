import Link from "next/link";

import { SlideDeck, type SlideContent } from "@/components/ougm/SlideDeck";
import { VideoEmbed } from "@/components/ougm/VideoEmbed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const module5Slides: SlideContent[] = [
  {
    title: "Welcome to Facilitator Wellness",
    subtitle: "Sabbath invitation and gratitude",
    description:
      "Set a restorative tone by honoring the emotional labor of facilitation and naming God’s desire for rest.",
    points: [
      { text: "Open with gratitude for stories of repair the team has stewarded." },
      { text: "Invite everyone to release the day through a brief breath prayer or stretch." },
      { text: "Name the focus: sustaining the healers so they can continue serving from overflow." },
    ],
    scripture: {
      reference: "Matthew 11:28-30",
      text: "Come to me, all who are weary and burdened, and I will give you rest.",
    },
  },
  {
    title: "Compassion Satisfaction vs. Fatigue",
    subtitle: "Recognize early indicators",
    description: "Educate the team on what healthy engagement and warning signs look like in practice.",
    highlights: [
      { title: "Satisfaction", description: "Energy after sessions, joy naming impact, eagerness to facilitate again." },
      {
        title: "Fatigue",
        description: "Irritability, insomnia, numbing out, over-identification with participants.",
      },
      {
        title: "Burnout",
        description: "Chronic exhaustion, cynicism, feeling ineffective—time to escalate support.",
      },
    ],
    footerNote: "Encourage participants to mark which indicators they currently notice and share with a partner.",
  },
  {
    title: "Personal Wellness Inventory",
    subtitle: "Check-in across body, mind, and spirit",
    description:
      "Guide facilitators through a self-assessment to surface needs and preventative care strategies.",
    points: [
      { text: "Body: sleep rhythm, nutrition, movement, and medical appointments." },
      { text: "Mind: counseling, supervision, journaling, creative outlets." },
      { text: "Spirit: prayer, worship, mentoring, community care, Sabbath rhythm." },
    ],
  },
  {
    title: "Mutual Care Covenant",
    subtitle: "Buddy system and supervision cadence",
    description:
      "Create agreements that ensure no facilitator carries restorative work alone.",
    points: [
      { text: "Assign wellness buddies for weekly check-ins—text, call, or quick hallway chat." },
      { text: "Schedule monthly supervision focused solely on emotional and spiritual care." },
      { text: "Include chaplaincy or pastoral care in the covenant for additional support." },
    ],
  },
  {
    title: "Wellness Tracker Walk-Through",
    subtitle: "Using the Life-AI digital form",
    description: "Demonstrate how to log red/yellow flags, wins, and follow-up actions.",
    points: [
      { text: "Record post-session check-ins within 24 hours while details are fresh." },
      { text: "Tag coordination team members who need to respond or provide cover." },
      { text: "Review tracker trends quarterly to adjust workload and identify support needs." },
    ],
  },
  {
    title: "Embodied Practices Lab",
    subtitle: "Integrate breath, stretch, and prayer",
    description: "Model three short practices facilitators can lead before or after sessions.",
    highlights: [
      { title: "Breath Prayer", description: "Inhale “God, you are near.” Exhale “We are safe together.”" },
      { title: "Grounding Stretch", description: "Neck rolls, shoulder release, and reaching for the sky." },
      { title: "Body Scan", description: "Guide awareness from toes to crown, releasing tension intentionally." },
    ],
    footerNote: "Have participants practice leading one tool and offer appreciative feedback.",
  },
  {
    title: "Peer Debrief & Storytelling",
    subtitle: "Normalize asking for help",
    description:
      "Give facilitators a structure for processing intense sessions without violating confidentiality.",
    points: [
      { text: "Use the prompt: “What stayed with you, and what support do you need now?”" },
      { text: "Affirm each other’s strengths and note patterns supervisors should know about." },
      { text: "Document follow-up commitments in the wellness tracker with due dates." },
    ],
  },
  {
    title: "Commitments & Blessing",
    subtitle: "Leave resourced, not depleted",
    description: "Close with collective commitments to Sabbath, joy, and ongoing mutual care.",
    points: [
      { text: "Each facilitator names a concrete rest practice for the coming week." },
      { text: "Share one celebration from recent restorative work to cultivate hope." },
      { text: "Close with prayer, anointing oil, or blessing to recommission the team." },
    ],
  },
];

export default function Module5ResourcePage() {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Link href="/ougm-restorative-justice#section-assets" className="hover:text-emerald-700 hover:underline">
          ← Back to OUGM training hub
        </Link>
      </div>

      <div className="space-y-3">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          Module 5 Resources
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Facilitator Wellness & Mutual Care – Trainer Assets
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Sustain restorative practitioners through rhythms of rest, supervision, and mutual support. These assets help you
          lead reflection, track wellness, and celebrate stories of resilience.
        </p>
      </div>

      <Separator />

      <Card id="slides" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Wellness slide deck outline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Facilitate the wellness module with the interactive deck. Each slide includes prompts for embodied practice,
            supervision rhythms, and mutual care agreements that can be implemented immediately.
          </p>
          <SlideDeck slides={module5Slides} accentLabel="Module 5 · Wellness" />
        </CardContent>
      </Card>

      <Card id="proqol" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Compassion fatigue self-assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Encourage facilitators to complete the ProQOL self-score quarterly. Use the reflection questions below during
            supervision or peer coaching huddles.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>Where are you noticing warning signs (sleep, irritability, pulling away)?</li>
            <li>What rhythms restore you? Who needs to know about your current capacity?</li>
            <li>What celebrations or gratitude practices renew your hope?</li>
          </ul>
          <p className="text-xs text-slate-500">
            Request printable packets from coordination, or duplicate the prompts in your preferred form tool.
          </p>
        </CardContent>
      </Card>

      <Card id="retreat-guide" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Sabbath retreat guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Host a quarterly half-day retreat using this outline. Mix quiet reflection with communal practices to renew the
            team.
          </p>
          <ol className="space-y-2 pl-5 text-slate-700">
            <li><strong>Opening:</strong> Lectio divina with Psalm 23.</li>
            <li><strong>Embodied rest:</strong> Guided stretch and breath sequence.</li>
            <li><strong>Story circle:</strong> Share a moment of restoration witnessed in the past quarter.</li>
            <li><strong>Creative practice:</strong> Art or journaling prompt focused on “shalom in community.”</li>
            <li><strong>Commissioning:</strong> Blessing prayer and commitments for the next season.</li>
          </ol>
        </CardContent>
      </Card>

      <Card id="video" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Encouragement video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Play this Choosing Therapy explainer to spark discussion about compassion fatigue warning signs and how teams
            can respond together.
          </p>
          <VideoEmbed
            embedUrl="https://www.youtube.com/embed/QkmIEprw0lY"
            title="Compassion Fatigue: Causes, Signs, & Ways to Cope"
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Wellness tracker reminder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Log supervision touchpoints with the digital Facilitator Wellness Tracker after intense facilitation weeks. Bring
            highlights back to the coordination team so we can celebrate and respond quickly to emerging needs.
          </p>
          <Link
            href="/ougm-restorative-justice#digital-forms"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
          >
            Jump to digital forms
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
