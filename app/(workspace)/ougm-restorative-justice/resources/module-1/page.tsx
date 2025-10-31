import Link from "next/link";

import { SlideDeck, type SlideContent } from "@/components/ougm/SlideDeck";
import { VideoEmbed } from "@/components/ougm/VideoEmbed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const module1Slides: SlideContent[] = [
  {
    title: "Welcome to Restorative Justice Foundations",
    subtitle: "Hospitality, mission, and workshop covenant",
    description: "Invite the room into shared expectations and the spiritual posture we bring to the work.",
    points: [
      {
        text: "Warmly greet participants and invite them to share one word that captures why they came.",
      },
      {
        text: "State the covenant: confidentiality, consent to pass, mutual care, and shared ownership of learning.",
      },
      {
        text: "Connect the session to OUGM’s mission of gospel-centered reconciliation and restorative shelter culture.",
      },
    ],
    footerNote: "Facilitators: keep this slide visible as you welcome participants and outline logistics such as restrooms and schedule.",
  },
  {
    title: "Why Restorative Justice Now",
    subtitle: "Context for the OUGM shelter environment",
    description:
      "Frame restorative justice as a discipleship and community care strategy that meets the current needs in our shelters.",
    points: [
      { text: "Residents and staff crave responses that repair harm without cutting off belonging." },
      { text: "Punitive-only models erode trust, retraumatize survivors, and rarely change behavior." },
      {
        text: "Restorative approaches align with our gospel mandate to reconcile people to God, one another, and community supports.",
      },
    ],
  },
  {
    title: "Restorative Justice Defined",
    description: "Name the core elements so staff can communicate the process clearly to residents and volunteers.",
    points: [
      {
        text: "Collaborative process involving those harmed, those responsible, and community supporters.",
        helper: "Everyone names impact, identifies needs, and co-creates agreements for repair.",
      },
      {
        text: "Balances accountability with healing by centering the dignity of each participant.",
      },
      {
        text: "Future-focused: addresses root causes and strengthens community resilience.",
      },
    ],
    scripture: {
      reference: "Micah 6:8",
      text: "Act justly, love mercy, and walk humbly with your God.",
    },
  },
  {
    title: "The Restorative Triangle",
    subtitle: "Harms · Needs · Obligations",
    description: "Use this visual anchor throughout the program to keep agreements balanced and holistic.",
    highlights: [
      {
        title: "Harms",
        description: "What was broken? Name the impact on people, relationships, and community trust.",
      },
      {
        title: "Needs",
        description: "What do the people involved require to feel safe, heard, and supported moving forward?",
      },
      {
        title: "Obligations",
        description: "What commitments will repair relationships and prevent the harm from repeating?",
      },
    ],
    footerNote: "Prompt participants to map a recent shelter incident on the triangle and note imbalances.",
  },
  {
    title: "Contrasting Responses",
    subtitle: "Punitive vs. Restorative Approaches",
    description: "Illustrate how restorative justice changes conversations, power dynamics, and outcomes.",
    points: [
      {
        text: "Punitive model: rule-focused, quick compliance, often excludes people from community spaces.",
        helper: "Results: lingering resentment, shame, and unaddressed needs.",
      },
      {
        text: "Restorative model: relationship-focused, invites voice and responsibility, keeps community intact.",
        helper: "Results: agreements rooted in healing, accountability, and reintegration.",
      },
      {
        text: "Permissive model: avoids conflict, leaves harm unnamed, and creates confusion.",
        helper: "Use this contrast to emphasize why restorative pathways serve OUGM best.",
      },
    ],
  },
  {
    title: "Restorative Pathways at OUGM",
    subtitle: "Matching intensity to need",
    description: "Position restorative conversations, circles, and conferences as a continuum of support.",
    highlights: [
      {
        title: "Restorative Conversation",
        description: "Short, staff-led check-in for low-level tension or misunderstandings.",
      },
      {
        title: "Peacemaking Circle",
        description: "Structured dialogue with talking piece and shared agreements for medium-level harm.",
      },
      {
        title: "Restorative Conference",
        description: "Formal process with preparation meetings and written agreements for significant harm.",
      },
    ],
    footerNote: "Invite the group to name examples from shelter life that fit each pathway.",
  },
  {
    title: "Values Mapping Activity",
    subtitle: "Connect personal values to OUGM commitments",
    description: "Guide participants through the worksheet to translate values into daily restorative practices.",
    points: [
      { text: "Column 1: Identify a personal value that guides your work (e.g., dignity, stability)." },
      {
        text: "Column 2: Link that value to OUGM expression—scripture, policy, or story that brings it to life.",
      },
      {
        text: "Column 3: Name a restorative action you can take this week to embody the value with residents.",
      },
    ],
  },
  {
    title: "Documentation Flow",
    subtitle: "Keeping agreements visible and actionable",
    description: "Show how restorative justice integrates with existing paperwork and digital tools.",
    points: [
      { text: "Use the Facilitator Preparation Checklist before every circle or conference." },
      { text: "Capture participant consent and accommodations in the Participant Orientation Record." },
      {
        text: "Log agreements in the Agreement Builder so supervisors can follow up and celebrate milestones.",
      },
    ],
    footerNote: "Highlight where forms live inside the Life-AI workspace and who receives copies.",
  },
  {
    title: "Practice & Integration",
    subtitle: "Building facilitator muscle memory",
    description: "Outline next steps for ongoing learning beyond the module session.",
    points: [
      { text: "Shadow a restorative conversation or circle within the next two weeks." },
      { text: "Schedule a coaching debrief with your supervisor to reflect on strengths and growth areas." },
      { text: "Commit to one microlearning assignment (podcast, article, or video) before Module 2." },
    ],
  },
  {
    title: "Blessing & Homework",
    subtitle: "Sending participants with purpose",
    description: "Close the session with reflection, prayer, and practical follow-up.",
    points: [
      { text: "Invite each participant to name one relationship they will engage restoratively this week." },
      { text: "Assign the reflection journal prompt: How will you explain restorative justice to a new resident?" },
      { text: "Pray a blessing of courage, humility, and compassion over the team." },
    ],
    scripture: {
      reference: "2 Corinthians 5:18",
      text: "God has given us the ministry of reconciliation.",
    },
  },
];

export default function Module1ResourcePage() {
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Link href="/ougm-restorative-justice#section-assets" className="hover:text-emerald-700 hover:underline">
          ← Back to OUGM training hub
        </Link>
      </div>

      <div className="space-y-3">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          Module 1 Resources
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Restorative Justice Foundations – Trainer Assets
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          Teach the theology, language, and restorative commitments that anchor OUGM&apos;s program. Use these resources to
          facilitate the 90-minute workshop plus microlearning follow-up.
        </p>
      </div>

      <Separator />

      <Card id="slides" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Slide deck & talking points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            The live deck below is presentation-ready. Use the arrows or keyboard to move through each slide, and reference
            the facilitator notes provided. You can mirror your screen for participants while keeping notes on a secondary
            device.
          </p>
          <SlideDeck slides={module1Slides} accentLabel="Module 1 · Foundations" />
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Need to download or customize? From your browser, print the deck to PDF or request an editable version at{" "}
            <Link href="mailto:restorativejustice@ougmission.org" className="font-medium text-emerald-700 underline">restorativejustice@ougmission.org</Link>.
          </p>
        </CardContent>
      </Card>

      <Card id="trainer-script" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Trainer script</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Use the following script excerpts to guide new facilitators through the foundational content. Encourage
            trainers to adapt the language to their voice while holding steady to the theology and values below.
          </p>
          <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Opening (3 minutes)</p>
            <p>
              “Welcome home. At Union Gospel Mission we believe reconciliation is not optional—it is the heartbeat of the
              gospel. Tonight we remember Micah&apos;s charge: to do justice, love mercy, and walk humbly. Restorative justice
              is how we live that out in the shelter.”
            </p>
          </div>
          <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Restorative triangle introduction (5 minutes)</p>
            <p>
              “Harms, needs, and obligations: every restorative response balances these three. When harm happens in our
              community we refuse to push people out. Instead we gather, name what was broken, and co-create a path back to
              wholeness.”
            </p>
          </div>
          <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Values mapping debrief (7 minutes)</p>
            <p>
              “Which values surfaced for you? How do they show up in the dorms, the kitchen, case management? When we
              notice gaps, restorative practice gives us tools to respond with dignity.”
            </p>
          </div>
        </CardContent>
      </Card>

      <Card id="values-worksheet" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Values mapping worksheet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Print or distribute digitally during the module. Participants list personal values, match them with OUGM core
            commitments, and identify relational practices that embody each value.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-slate-700">
            <li>Column 1 – Personal value (e.g., hospitality, safety, dignity).</li>
            <li>Column 2 – OUGM expression (scripture, policy, or story that illustrates the value).</li>
            <li>Column 3 – Restorative action (behavior that brings the value to life in daily shelter rhythms).</li>
          </ul>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            To distribute digitally, duplicate this worksheet in Google Docs or copy the table into your learning
            management system. Printed copies work well for pair discussions during the module.
          </div>
        </CardContent>
      </Card>

      <Card id="video" className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Supplemental video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Share this Oakland Unified School District circle video as pre-work or during the session to illustrate a
            living example of community-building practice. Follow up with the reflection questions below.
          </p>
          <VideoEmbed
            embedUrl="https://www.youtube.com/embed/RdKhcQrLD1w"
            title="Restorative Justice in Oakland Schools"
          />
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">Reflection prompts</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Where do you see harms, needs, and obligations addressed in the video?</li>
              <li>What emotions surfaced for the participants, and how were they held?</li>
              <li>How might this translate to a conflict you have witnessed inside OUGM?</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Further reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            Pair Module 1 with these curated readings to deepen facilitator understanding. These links open in a new tab.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <Link
                href="https://www.iirp.edu/restorative-practices/explained"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Defining Restorative Practices (IIRP)
              </Link>
            </li>
            <li>
              <Link
                href="https://www.justice.gc.ca/eng/rp-pr/cj-jp/rr06_1/rr06_1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Restorative Justice in Canada – Overview (Department of Justice)
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
