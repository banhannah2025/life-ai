import Link from "next/link";

import { SlideDeck, type SlideContent } from "@/components/ougm/SlideDeck";
import { VideoEmbed } from "@/components/ougm/VideoEmbed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const module2Slides: SlideContent[] = [
  {
    title: "Welcome & Grounding",
    subtitle: "Center safety before content",
    description:
      "Open Module 2 by modeling regulation. Invite participants to arrive with breath, prayer, and shared agreements.",
    points: [
      { text: "Lead a 60-second breath prayer or sensory check-in." },
      { text: "Name the trauma-responsive facilitation covenant: choice, voice, pacing, and support." },
      { text: "Explain how today’s tools keep restorative spaces emotionally safe for residents and staff." },
    ],
    footerNote: "Keep soft instrumental music playing as people enter. Dim harsh lights if possible.",
  },
  {
    title: "Trauma in the Shelter Context",
    subtitle: "Why regulation matters",
    description:
      "Connect trauma theory to lived experiences inside OUGM shelters so facilitators understand what they are observing.",
    points: [
      { text: "Chronic stress and survival responses show up as irritability, numbness, or hyper-vigilance." },
      { text: "Our role is to notice, not pathologize—behavior communicates unmet needs and past harm." },
      {
        text: "Trauma-responsive environments prioritize predictability, gentle transitions, and consent at every step.",
      },
    ],
  },
  {
    title: "Facilitator Stance Triangle",
    subtitle: "Hospitality · Accountability · Humility",
    description: "Hold these three anchors in tension to cultivate safe, restorative encounters.",
    highlights: [
      { title: "Hospitality", description: "Welcome people as image bearers; set a tone of warmth and respect." },
      {
        title: "Accountability",
        description: "Stay clear about agreements, boundaries, and the need to repair harm together.",
      },
      {
        title: "Humility",
        description: "Acknowledge limits, invite feedback, and share power—especially with those most impacted.",
      },
    ],
    footerNote: "Invite participants to identify which anchor they naturally embody and which needs strengthening.",
  },
  {
    title: "Reading Nervous System Cues",
    subtitle: "Common fight-flight-freeze-fawn responses",
    description: "Help facilitators notice what dysregulation looks and sounds like in practice.",
    points: [
      {
        text: "Fight: raised voice, pacing, clenched fists.",
        helper: "Respond with calm tone, name what you observe, offer grounding choices.",
      },
      {
        text: "Flight: leaving the space, difficulty focusing.",
        helper: "Normalize breaks, create door-open agreements, invite a support person.",
      },
      {
        text: "Freeze or Fawn: blank stare, agreeable without engagement.",
        helper: "Slow down, offer sensory tools, check in privately about needs and consent.",
      },
    ],
  },
  {
    title: "Grounding Toolkit Demonstration",
    subtitle: "Model shared regulation tools",
    description: "Use tangible objects and scripts to give participants confidence leading grounding practices.",
    highlights: [
      { title: "5-4-3-2-1", description: "Guide the senses and match your tone to a calming pace." },
      { title: "Prayer Breath", description: "Pair scripture or simple phrases with inhales and exhales." },
      { title: "Sensory Kit", description: "Offer textured items, temperature changes, or aromatherapy as invitations." },
    ],
    footerNote: "Invite volunteers to practice each tool with a partner while you coach their language.",
  },
  {
    title: "Coaching During Sessions",
    subtitle: "Micro-skills that build trust",
    description:
      "Translate trauma theory into facilitation moves that residents will experience as care and stability.",
    points: [
      { text: "Maintain relaxed posture, grounded feet, and gentle pacing." },
      { text: "Use empathic, concrete language: “What would help you stay with us?”" },
      { text: "Check consent before returning to difficult stories or questions." },
    ],
  },
  {
    title: "Safety Agreements & Accommodations",
    subtitle: "Collaborate on needs before entering a circle",
    description:
      "Teach facilitators to co-create safety plans during preparation meetings rather than improvising during conflict.",
    points: [
      { text: "Clarify triggers, support people, and sensory accommodations for each participant." },
      { text: "Document stop words or gestures that signal a need for pause." },
      { text: "Agree on follow-up care: debrief timing, case manager involvement, and pastoral support." },
    ],
  },
  {
    title: "Practice Flow & Debrief",
    subtitle: "Prepare · Facilitate · Restore",
    description: "Connect Module 2 skills to the full restorative process.",
    points: [
      { text: "Preparation: run a mini rehearsal, cover logistics, and rehearse grounding prompts." },
      { text: "Facilitation: tag-team with co-facilitators, track regulation, and adjust pace as needed." },
      { text: "Debrief: celebrate wins, note trauma cues encountered, and plan for personal care." },
    ],
  },
  {
    title: "Next Steps & Blessing",
    subtitle: "Sustain your own wellness",
    description:
      "End the session by emphasizing mutual care and the spiritual resources we draw upon as facilitators.",
    points: [
      { text: "Schedule a wellness check-in with your supervisor within seven days." },
      { text: "Plan which grounding tool you will keep at every facilitation." },
      { text: "Close with a prayer or blessing inviting peace over the team and shelter community." },
    ],
    scripture: {
      reference: "Psalm 34:18",
      text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    },
  },
];

export default function Module2ResourcePage() {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Link href="/ougm-restorative-justice#section-assets" className="hover:text-emerald-700 hover:underline">
          ← Back to OUGM training hub
        </Link>
      </div>

      <div className="space-y-3">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          Module 2 Resources
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Trauma-Responsive Facilitation – Trainer Assets
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Equip facilitators to center safety, voice, and regulation. Use these resources to demonstrate grounding tools,
          practice scripts, and trauma-aware preparation meetings.
        </p>
      </div>

      <Separator />

      <Card id="slides" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Slide deck & facilitator stance visuals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Facilitate this module with the interactive deck below. Each slide includes coaching notes, nervous-system
            language, and prompts that reinforce trauma-responsive practice. Use the highlights during live demonstrations.
          </p>
          <SlideDeck slides={module2Slides} accentLabel="Module 2 · Trauma Care" />
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Need to work offline? Print the deck to PDF or request an editable PowerPoint from
            <Link href="mailto:restorativejustice@ougmission.org" className="font-medium text-emerald-700 underline">
              {" "}
              restorativejustice@ougmission.org
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card id="grounding-toolkit" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Grounding toolkit cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Share these prompts with facilitators and residents so grounding becomes a shared language. Print on cardstock
            for circle rooms or laminate for mobile kits.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <strong>5-4-3-2-1</strong> – “Name 5 things you can see...” Use when participants feel overwhelmed.
            </li>
            <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <strong>Prayer breath</strong> – Inhale “God is with us,” exhale “We are safe.” Slows breathing within 60 seconds.
            </li>
            <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <strong>Sensory kit</strong> – Offer textured objects, peppermint tea, or cool cloths to support regulation.
            </li>
            <li className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <strong>Choice prompts</strong> – “Would you like to pause, have water, or invite a support person?”
            </li>
          </ul>
          <p className="text-xs text-slate-500">
            Copy the prompts above into your own design tool or request the printable card PDF from coordination if you
            need ready-to-print files.
          </p>
        </CardContent>
      </Card>

      <Card id="audio" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Guided grounding practice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Share this Goodful five-minute meditation—used by health systems and crisis response teams—as pre-work or
            closing practice. Model the pacing and invitational language facilitators can use before or after a restorative
            session.
          </p>
          <VideoEmbed
            embedUrl="https://www.youtube.com/embed/inpok4MKVLM"
            title="5-Minute Meditation You Can Do Anywhere"
          />
          <p className="text-xs text-slate-500">
            Need an offline version? Contact coordination at{" "}
            <Link href="mailto:restorativejustice@ougmission.org" className="font-medium text-emerald-700 underline">
              restorativejustice@ougmission.org
            </Link>{" "}
            for the licensed MP3.
          </p>
        </CardContent>
      </Card>

      <Card id="video" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Supplemental video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Include this widely used explainer from Dr. Jacob Ham to connect trauma theory with facilitator practice. Pause
            at the midpoint to model co-regulation and voice/choice check-ins.
          </p>
          <VideoEmbed
            embedUrl="https://www.youtube.com/embed/KoqaUANGvpA"
            title="Understanding Trauma: Learning Brain vs Survival Brain"
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Preparation checklist reminder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Pair Module 2 with the facilitator preparation checklist and participant orientation record found in the
            digital forms section of the hub. Encourage facilitators to complete both within 48 hours of a referral.
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
