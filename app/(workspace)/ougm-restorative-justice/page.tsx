'use client';

import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InteractiveModuleCard, type InteractiveTrainingModule } from "@/components/ougm/InteractiveModuleCard";
import { DigitalFormCard, type DigitalForm } from "@/components/ougm/DigitalFormCard";
import { RestorativePortal } from "@/components/case-management/RestorativePortal";

const implementationPhases = [
  {
    title: "Phase 1 · Foundation Building (Weeks 1–4)",
    focus: [
      "Establish shared language about restorative justice across shelter leadership and frontline staff.",
      "Map current incident response, intake, and follow-up workflows to identify restorative entry points.",
      "Recruit a cross-functional implementation team that includes staff, residents, and community partners.",
    ],
    deliverables: [
      "Restorative justice vision statement tailored to OUGM’s mission and shelter context.",
      "Updated policy draft aligning restorative practices with existing safety protocols.",
      "Implementation charter defining decision-makers, training expectations, and success metrics.",
    ],
  },
  {
    title: "Phase 2 · Capacity Building (Weeks 5–8)",
    focus: [
      "Deliver core facilitator and staff trainings (see modules below).",
      "Pilot restorative conversations for low-risk conflicts with coaching support.",
      "Create trauma-informed safety plans and escalation pathways.",
    ],
    deliverables: [
      "Facilitator cohort roster with practice logs and coaching notes.",
      "Customized participant intake and agreement templates for the shelter.",
      "Resource library for printable handouts, posters, and de-escalation aids.",
    ],
  },
  {
    title: "Phase 3 · Program Launch (Weeks 9–12)",
    focus: [
      "Integrate restorative options into resident orientation and staff shift briefings.",
      "Host circle-based community building events to normalize the process before crises occur.",
      "Collect initial participant feedback and refine facilitation guides.",
    ],
    deliverables: [
      "Launch calendar with recurring circle sessions and drop-in support hours.",
      "Feedback dashboard summarizing participant voice, agreements reached, and follow-up tasks.",
      "Communication kit for stakeholders, partner agencies, and faith community supporters.",
    ],
  },
  {
    title: "Phase 4 · Sustain & Evaluate (Ongoing)",
    focus: [
      "Review data quarterly to adapt the program to seasonal shelter trends and evolving resident needs.",
      "Offer advanced coaching for facilitators and resident leaders to prevent burnout.",
      "Align restorative outcomes with rehousing, recovery, and wrap-around service goals.",
    ],
    deliverables: [
      "Quarterly learning reports connecting restorative outcomes to housing stability metrics.",
      "Updated facilitator competency framework and reflective supervision schedule.",
      "Annual recommitment retreat agenda and celebration toolkit for the OUGM community.",
    ],
  },
];

const trainingModules: InteractiveTrainingModule[] = [
  {
    title: "Module 1 · Restorative Justice Foundations",
    duration: "90-minute live workshop + 30-minute microlearning",
    overview:
      "Ground staff in the biblical, historical, and trauma-responsive roots of restorative justice so they can explain why OUGM leads with repair over punishment.",
    introduction: [
      "Restorative justice at OUGM is more than an alternative discipline plan—it is a discipleship practice that repairs harm, strengthens relationships, and reconnects people to healing resources. Trainers should use this module to anchor every participant in the language, theology, and core commitments that make the program distinct.",
      "Before the session, download the slide deck from the Life-AI library and assign the optional pre-read on restorative practices. Encourage facilitators-in-training to arrive having reflected on a time they witnessed or experienced repair.",
    ],
    definitions: [
      {
        term: "Restorative justice",
        definition:
          "A collaborative process where those harmed, those responsible, and community members name the impact of harm, identify needs, and co-create agreements that repair relationships and restore belonging.",
        practiceTip: "Whenever you introduce restorative justice, pair the definition with a lived example from the shelter to make it tangible.",
        scripture: "“What does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.” — Micah 6:8",
      },
      {
        term: "Restorative triangle",
        definition:
          "A framework that balances harms, needs, and obligations. Facilitators must ensure every plan addresses the harm done, the needs created, and the obligations of those responsible and the community.",
        practiceTip: "Use the triangle visual on slide 7 to help participants map a recent incident onto the three points.",
      },
    ],
    goals: [
      "Differentiate restorative, punitive, and permissive responses in a shelter environment.",
      "Define the restorative triangle and connect its three pillars to OUGM’s mission and theology.",
      "Identify shelter scenarios that are best suited for conversations, circles, or conferences.",
    ],
    practice: [
      "Values mapping activity using scripture and OUGM’s mission commitments.",
      "Scenario sort that matches incidents to restorative pathways and alternative responses.",
    ],
    knowledgeCheck: {
      question: "Which statement best captures restorative justice inside OUGM shelters?",
      options: [
        {
          id: "a",
          label: "It enforces shelter rules quickly so conflict is minimized through discipline.",
          correct: false,
          explanation:
            "Rule enforcement alone is a punitive response. Restorative justice moves beyond punishment to repair relationships and unmet needs.",
        },
        {
          id: "b",
          label: "It gathers the harmed, those responsible, and the wider community to understand impact and co-create repair plans.",
          correct: true,
          explanation:
            "Restorative approaches balance accountability, healing, and community support—exactly what OUGM aims to cultivate.",
        },
        {
          id: "c",
          label: "It ignores conflict so everyone can calm down and avoid further tension.",
          correct: false,
          explanation:
            "Conflict avoidance can retraumatize residents and leaves harm unaddressed. Restorative justice leans in with care and structure.",
        },
      ],
    },
    scenarioPractice: {
      prompt:
        "During a busy dinner service, two residents exchange heated words and one storms out. You witnessed the moment and plan to offer a restorative response. What is your next step?",
      coachingNote: "Choose the option that models dignity-first preparation and informed consent.",
      choices: [
        {
          id: "a",
          label: "Remind both residents they violated policy and require immediate apologies before letting them back in line.",
          recommended: false,
          rationale: "This prioritizes quick compliance over understanding the harm and readiness for dialogue.",
        },
        {
          id: "b",
          label: "Invite each resident to a brief preparation conversation, name the harm you observed, and ask what support they need to feel safe entering a circle.",
          recommended: true,
          rationale:
            "Preparation conversations build consent, surface needs, and model shared stewardship—key restorative practices at OUGM.",
        },
        {
          id: "c",
          label: "Tell both residents to complete written statements and postpone any conversation for two weeks to allow cooling off.",
          recommended: false,
          rationale: "Delay can be helpful, but without contact or support the harm may deepen. Preparation with support is more restorative.",
        },
      ],
    },
    reflection: {
      prompt: "How will you explain restorative justice to a new volunteer or resident this week?",
      guidance: [
        "Describe the difference between punishment and restoration using OUGM’s mission language.",
        "Connect your explanation to scripture, core values, or community commitments.",
        "List one opportunity in the coming days to intentionally offer a restorative pathway.",
      ],
    },
    resourceLinks: [
      {
        title: "Module 1 resource hub",
        description: "Open the module hub with slides, trainer script, and values mapping worksheet.",
        url: "/ougm-restorative-justice/resources/module-1",
        type: "slide",
        duration: "28 slides",
      },
      {
        title: "Restorative justice explained (IIRP article)",
        description: "Background reading that defines restorative practices and highlights common applications.",
        url: "https://www.iirp.edu/restorative-practices/explained",
        type: "article",
      },
      {
        title: "Restorative Justice in Oakland Schools (OUSD)",
        description: "Community-building circle demonstration from Oakland Unified’s nationally recognized restorative program.",
        url: "https://www.youtube.com/watch?v=RdKhcQrLD1w",
        type: "video",
        duration: "12 min",
      },
      {
        title: "Facilitator preparation checklist (digital form)",
        description: "Use the online checklist to plan every conversation or circle from consent through closing.",
        url: "#form-facilitator-prep",
        type: "template",
      },
    ],
  },
  {
    title: "Module 2 · Trauma-Responsive Facilitation",
    duration: "2-hour interactive intensive",
    overview:
      "Equip staff with the trauma-responsive skills required to keep restorative spaces emotionally safe and grounded for survivors of homelessness, violence, and substance use.",
    introduction: [
      "This module invites trainers to name common trauma responses in the shelter, demonstrate grounding tools, and practice scripting that honors voice and choice.",
      "Assign the optional pre-work video on trauma and the brain. Encourage participants to bring a personal grounding object to use during practice.",
    ],
    definitions: [
      {
        term: "Trauma-responsive facilitation",
        definition:
          "An approach that recognizes trauma’s impact on the body and brain, prioritizes safety and choice, and adapts processes to avoid re-traumatization while promoting healing.",
        practiceTip: "Invite facilitators to pause, breathe, and check their own regulation before they try to co-regulate others.",
      },
      {
        term: "Co-regulation",
        definition:
          "The process by which a grounded facilitator helps participants calm their nervous systems through voice, posture, pacing, and supportive techniques.",
        practiceTip: "Practice the 5-4-3-2-1 sensory grounding exercise so facilitators can lead it confidently in sessions.",
      },
    ],
    goals: [
      "Recognize trauma responses common among people experiencing homelessness and substance use recovery.",
      "Apply grounding and co-regulation techniques before, during, and after restorative sessions.",
      "Develop safety agreements that balance choice, voice, and clear boundaries.",
    ],
    practice: [
      "Guided regulation exercises and sensory toolkit exploration.",
      "Role-play de-escalation scripts with peer feedback.",
    ],
    knowledgeCheck: {
      question: "A participant shuts down and stops making eye contact during a circle. What is the first trauma-responsive action?",
      options: [
        {
          id: "a",
          label: "Continue with the agenda so the participant sees you won’t be derailed.",
          correct: false,
          explanation: "Pressing ahead can escalate distress. Trauma-responsive facilitators slow down to re-establish safety.",
        },
        {
          id: "b",
          label: "Pause, offer a grounding choice (water, brief break, support person), and check in about what would help them stay present.",
          correct: true,
          explanation: "Grounding options, voice, and consent help regulate the nervous system and model compassionate boundaries.",
        },
        {
          id: "c",
          label: "End the circle immediately and document the participant as non-compliant.",
          correct: false,
          explanation: "Ending without support labels the participant rather than addressing the nervous system response.",
        },
      ],
    },
    scenarioPractice: {
      prompt:
        "During a preparation meeting, a resident starts breathing rapidly and cannot focus on your questions after describing a traumatic event. How do you respond?",
      choices: [
        {
          id: "a",
          label: "Offer a grounding prompt (e.g., name five things in the room), slow your voice, and ask if they would like a supportive person present before continuing.",
          recommended: true,
          rationale: "Grounding plus choice honors trauma responses and gives the resident control over support.",
        },
        {
          id: "b",
          label: "Tell them to push through the discomfort so you can finish the agenda on time.",
          recommended: false,
          rationale: "Rushing may re-traumatize the resident and erode trust in the process.",
        },
        {
          id: "c",
          label: "Stop asking questions and instead offer to reschedule without naming what changed.",
          recommended: false,
          rationale: "Rescheduling without context leaves the resident confused and may signal you can’t handle hard stories.",
        },
      ],
    },
    reflection: {
      prompt: "What grounding tool or ritual will you keep nearby for your next facilitation?",
      guidance: [
        "Identify sensory items, prayers, or breathing cues that support you and participants.",
        "Note how you will introduce the tool so residents understand it is an invitation, not a requirement.",
        "Plan how you will debrief with a co-facilitator or supervisor after high-intensity sessions.",
      ],
    },
    resourceLinks: [
      {
        title: "Module 2 resource hub",
        description: "Access trauma-responsive slides, grounding toolkit, and audio practices inside the OUGM hub.",
        url: "/ougm-restorative-justice/resources/module-2",
        type: "slide",
        duration: "32 slides",
      },
      {
        title: "Understanding Trauma: Learning Brain vs. Survival Brain",
        description: "Dr. Jacob Ham explains how facilitators can recognize and respond to trauma physiology.",
        url: "https://www.youtube.com/watch?v=KoqaUANGvpA",
        type: "video",
        duration: "6 min",
      },
      {
        title: "Trauma-informed frontline workers guide (NCTSN)",
        description: "Downloadable guide with immediate grounding practices and accommodation ideas.",
        url: "https://www.nctsn.org/resources/trauma-informed-frontline-workers",
        type: "article",
      },
      {
        title: "Participant orientation record (digital form)",
        description: "Capture informed consent conversations and accommodation needs online.",
        url: "#form-participant-orientation",
        type: "template",
      },
    ],
  },
  {
    title: "Module 3 · Circle Process & Conference Design",
    duration: "Half-day practicum",
    overview:
      "Walk trainers and facilitators through the full lifecycle of a harm circle—from preparation to agreements—using detailed scripts, visuals, and practice rounds.",
    introduction: [
      "This practicum provides the muscle memory facilitators need to run circles and conferences with confidence. Trainers should leverage the demo script, printable role packets, and live annotation to make every step explicit.",
      "Invite participants to review Module 1 before this session and arrive having observed at least one circle or restorative conversation on site.",
    ],
    definitions: [
      {
        term: "Circle keeper",
        definition:
          "The facilitator who safeguards the circle process by guiding the flow, upholding agreements, and ensuring every voice is heard without domination.",
        practiceTip: "Emphasize neutrality—keepers invite stories and solutions but do not force outcomes.",
      },
      {
        term: "Harm statement",
        definition:
          "A concise description of the impact that centers the harmed person’s experience. It names behaviors, feelings, and needs without blaming language.",
        practiceTip: "Coach facilitators to help participants write harm statements during pre-conferences.",
      },
    ],
    goals: [
      "Structure pre-conference meetings that center dignity, consent, and informed participation.",
      "Sequence opening, storytelling, naming harm, collaborative solutioning, and closure.",
      "Document action agreements that connect residents with wrap-around supports.",
    ],
    practice: [
      "Facilitate mini-circles with real shelter scenarios and observers.",
      "Peer assessment using the OUGM Facilitator Quality Rubric.",
    ],
    knowledgeCheck: {
      question: "Which step should always come directly after storytelling rounds in a harm circle?",
      options: [
        {
          id: "a",
          label: "Move immediately to agreements so momentum isn’t lost.",
          correct: false,
          explanation: "Skipping the naming of harm and needs can lead to shallow or unsustainable agreements.",
        },
        {
          id: "b",
          label: "Invite participants to name the harms, needs, and obligations they heard.",
          correct: true,
          explanation: "Surfacing harms and needs ensures everyone understands impact before crafting solutions.",
        },
        {
          id: "c",
          label: "Offer closing words to end on a hopeful note.",
          correct: false,
          explanation: "Closings are important but belong after agreements and commitments are made.",
        },
      ],
    },
    scenarioPractice: {
      prompt:
        "You are preparing a harm circle involving a resident, a staff member, and a community volunteer. What planning action keeps the process trauma-informed and balanced?",
      choices: [
        {
          id: "a",
          label: "Hold individual preparation meetings, review each person’s hopes and boundaries, and agree on shared circle values before convening.",
          recommended: true,
          rationale: "Preparation establishes consent, clarifies expectations, and protects participants.",
        },
        {
          id: "b",
          label: "Ask everyone to write their statements and read them aloud without prep so reactions are authentic.",
          recommended: false,
          rationale: "Without preparation, participants may be surprised or overwhelmed, risking additional harm.",
        },
        {
          id: "c",
          label: "Skip a closing round to keep the meeting short and efficient.",
          recommended: false,
          rationale: "Closings support emotional regulation and honor the spiritual dimension of OUGM circles.",
        },
      ],
    },
    reflection: {
      prompt: "How will you adjust your circle openings or closings to reflect OUGM’s mission?",
      guidance: [
        "List rituals, scriptures, or values statements that feel inclusive and grounding.",
        "Consider how you will invite participants to contribute to openings or closings.",
        "Identify one question that helps participants transition back to daily shelter life after a circle.",
      ],
    },
    resourceLinks: [
      {
        title: "Module 3 resource hub",
        description: "Open the module hub with circle scripts, facilitator rubrics, and scenario packets.",
        url: "/ougm-restorative-justice/resources/module-3",
        type: "slide",
        duration: "34 slides",
      },
      {
        title: "Core Processes of Restorative Justice Circles",
        description: "SchoolTalk DC training video breaking down each stage of a restorative circle with on-screen coaching.",
        url: "https://www.youtube.com/watch?v=wDAc6Qkqhj0",
        type: "video",
        duration: "12 min",
      },
      {
        title: "Restorative agreement builder (digital form)",
        description: "Complete agreements in real time and copy them into the shared tracker without handwriting.",
        url: "#form-agreement-builder",
        type: "template",
      },
      {
        title: "Facilitator quality rubric",
        description: "Download the observation rubric and coaching notes for circle keepers from the module hub.",
        url: "/ougm-restorative-justice/resources/module-3#facilitator-rubric",
        type: "tool",
      },
    ],
  },
  {
    title: "Module 4 · Accountability, Re-entry, and Reconciliation",
    duration: "90-minute clinic",
    overview:
      "Train facilitators to translate restorative conversations into actionable agreements, compassionate follow-up, and meaningful re-entry experiences.",
    introduction: [
      "This clinic helps trainers show how restorative outcomes connect to case management, recovery services, and pastoral care. Use the included dashboards and scripts to illustrate seamless follow-up.",
      "Ask participants to review one anonymized agreement before class and note what worked well and what could improve.",
    ],
    definitions: [
      {
        term: "Restorative agreement",
        definition:
          "A documented set of commitments created by participants that addresses harms, meets needs, and outlines supports. Agreements are specific, time-bound, and shared with responsible support teams.",
        practiceTip: "Coach facilitators to use language that is plain, strengths-based, and co-authored by participants.",
      },
      {
        term: "Re-entry circle",
        definition:
          "A gathering that welcomes someone back after a suspension, treatment stay, or absence; it revisits agreements, celebrates growth, and clarifies ongoing support.",
        practiceTip: "Include both allies and accountability partners so returning residents feel held, not scrutinized.",
      },
    ],
    goals: [
      "Pair restorative agreements with case management, recovery, and spiritual care plans.",
      "Plan re-entry circles for residents returning after suspension or treatment stays.",
      "Track progress using compassionate accountability dashboards.",
    ],
    practice: [
      "Co-design resident support teams using multidisciplinary case exercises.",
      "Draft follow-up scripts for 24-hour, 7-day, and 30-day check-ins.",
    ],
    knowledgeCheck: {
      question: "What makes a restorative agreement action-ready within OUGM?",
      options: [
        {
          id: "a",
          label: "It lists the punishment the responsible person must complete before services resume.",
          correct: false,
          explanation: "Punishments alone don’t foster restoration. Agreements should address harms, needs, and support.",
        },
        {
          id: "b",
          label: "It names specific commitments, timelines, and support people who will walk alongside implementation.",
          correct: true,
          explanation: "Actionable agreements are collaborative, time-bound, and include wrap-around support to succeed.",
        },
        {
          id: "c",
          label: "It is verbally agreed to without written documentation to maintain confidentiality.",
          correct: false,
          explanation: "Documenting agreements ensures clarity and accountability while still respecting privacy needs.",
        },
      ],
    },
    scenarioPractice: {
      prompt:
        "A resident is returning after a 7-day safety suspension. What re-entry practice aligns with restorative values?",
      choices: [
        {
          id: "a",
          label: "Host a re-entry circle including the resident, key staff, and peers to revisit agreements, celebrate growth, and clarify supports.",
          recommended: true,
          rationale:
            "Re-entry circles honor transformation, re-establish expectations, and reconnect the resident to community support.",
        },
        {
          id: "b",
          label: "Allow the resident to return quietly without revisiting agreements to avoid discomfort.",
          recommended: false,
          rationale: "Avoiding conversation can leave misunderstandings unresolved and weaken community trust.",
        },
        {
          id: "c",
          label: "Require the resident to sign a generic behavior contract with no discussion.",
          recommended: false,
          rationale: "Generic contracts miss individualized needs and can feel punitive rather than restorative.",
        },
      ],
    },
    reflection: {
      prompt: "How will you coordinate follow-up on agreements with the larger OUGM support network?",
      guidance: [
        "List the teammates or partners you need to notify after a circle concludes.",
        "Identify how you will track progress (shared notes, dashboard, supervision) and celebrate milestones.",
        "Name one action you will take if an agreement begins to stall or needs revision.",
      ],
    },
    resourceLinks: [
      {
        title: "Module 4 resource hub",
        description: "Review agreement templates, dashboards, and re-entry planning tools in the module hub.",
        url: "/ougm-restorative-justice/resources/module-4",
        type: "slide",
        duration: "26 slides",
      },
      {
        title: "Restorative agreement builder (digital form)",
        description: "Complete agreements live and paste results into the Life-AI accountability tracker.",
        url: "#form-agreement-builder",
        type: "template",
      },
      {
        title: "Follow-up reflection log (digital form)",
        description: "Document 24-hour, 7-day, and 30-day check-ins without paper forms.",
        url: "#form-follow-up-log",
        type: "template",
      },
      {
        title: "Restorative Justice, Prison & Re-entry Program",
        description: "Catholic Charities spotlight on a restorative re-entry team supporting people returning from custody.",
        url: "https://www.youtube.com/watch?v=47IzWX_Zlgo",
        type: "video",
        duration: "3 min",
      },
      {
        title: "Restorative justice backgrounder (GBV Learning Network)",
        description: "Evidence-informed overview of restorative justice principles and implementation considerations.",
        url: "https://www.gbvlearningnetwork.ca/our-work/backgrounders/restorative-justice.html",
        type: "article",
      },
    ],
  },
  {
    title: "Module 5 · Facilitator Wellness & Mutual Care",
    duration: "60-minute reflective session",
    overview:
      "Help facilitators build rhythms of wellness, supervision, and mutual care so they can sustain restorative work without burning out.",
    introduction: [
      "Wellness is both personal and communal. Use this session to normalize boundary-setting, share supervision tools, and celebrate stories of transformation.",
      "Ask participants to complete the short compassion fatigue self-assessment before class and bring one practice that refreshes them.",
    ],
    definitions: [
      {
        term: "Compassion fatigue",
        definition:
          "Emotional and physical exhaustion that results from chronic exposure to others’ trauma, often leading to decreased empathy and increased irritability.",
        practiceTip: "Remind facilitators that compassion fatigue is a signal, not a failure. Have a plan for early intervention.",
      },
      {
        term: "Mutual care covenant",
        definition:
          "A shared agreement among facilitators to check in, rest, and ask for help. It names specific actions teammates will take to support each other.",
        practiceTip: "Create covenants during the session and schedule quarterly reviews in supervision.",
      },
    ],
    goals: [
      "Name indicators of vicarious trauma and compassion fatigue for staff and volunteers.",
      "Set up buddy systems, debrief structures, and Sabbath rhythms.",
      "Build personal action plans for ongoing formation and supervision.",
    ],
    practice: [
      "Personal resilience inventory and peer coaching triads.",
      "Commitment-sharing circle with gratitude practice.",
    ],
    knowledgeCheck: {
      question: "Which practice best protects facilitator wellness during high-volume shelter seasons?",
      options: [
        {
          id: "a",
          label: "Taking on extra circles to cover for teammates and demonstrate commitment.",
          correct: false,
          explanation: "Overextending increases burnout risk. Wellness requires boundaries and shared workload.",
        },
        {
          id: "b",
          label: "Scheduling regular debriefs, tracking emotional load, and requesting respite before crises emerge.",
          correct: true,
          explanation: "Proactive rhythms sustain facilitators and model mutual care for the whole community.",
        },
        {
          id: "c",
          label: "Processing sessions alone to avoid burdening others.",
          correct: false,
          explanation: "Isolation can intensify vicarious trauma. Community support is essential for resilience.",
        },
      ],
    },
    scenarioPractice: {
      prompt:
        "You notice you are carrying several intense cases and feel exhausted before an upcoming circle. What is the most restorative action?",
      choices: [
        {
          id: "a",
          label: "Name your capacity to the coordination team, request a co-facilitator or postponement, and engage your wellness plan.",
          recommended: true,
          rationale:
            "Transparent boundary-setting protects you and participants while modeling healthy leadership.",
        },
        {
          id: "b",
          label: "Push through silently so residents don’t worry about scheduling changes.",
          recommended: false,
          rationale: "Ignoring your needs can compromise facilitation quality and increases burnout risk.",
        },
        {
          id: "c",
          label: "Withdraw from all facilitation duties without informing anyone to take a personal break.",
          recommended: false,
          rationale: "Stepping away without coordination leaves the team without support and disrupts resident care.",
        },
      ],
    },
    reflection: {
      prompt: "What rhythms or supports will you commit to this quarter to sustain your facilitation practice?",
      guidance: [
        "Identify who will be your accountability partner or peer coach.",
        "Describe how you will integrate rest, prayer, or reflection into your weekly schedule.",
        "List early warning signs that signal you need additional support and how you plan to respond.",
      ],
    },
    resourceLinks: [
      {
        title: "Module 5 resource hub",
        description: "Open the module hub with wellness slide deck, ProQOL assessment, and Sabbath retreat guide.",
        url: "/ougm-restorative-justice/resources/module-5",
        type: "slide",
        duration: "20 slides",
      },
      {
        title: "Compassion Fatigue: Causes, Signs, & Ways to Cope",
        description: "Choosing Therapy outlines practical strategies frontline teams use to prevent burnout and secondary trauma.",
        url: "https://www.youtube.com/watch?v=QkmIEprw0lY",
        type: "video",
        duration: "5 min",
      },
      {
        title: "Facilitator wellness tracker (digital form)",
        description: "Log check-ins, red flags, and supports directly in the Life-AI system.",
        url: "#form-wellness-tracker",
        type: "template",
      },
    ],
  },
];

type ModuleAsset = {
  label: string;
  description: string;
  href?: string;
  hrefLabel?: string;
};

type ModuleAssetShelf = {
  id: string;
  moduleTitle: string;
  summary: string;
  assets: ModuleAsset[];
};

const moduleAssetShelves: ModuleAssetShelf[] = [
  {
    id: "module-1-assets",
    moduleTitle: trainingModules[0].title,
    summary:
      "Core media for orienting staff and volunteers. Use these files to introduce OUGM’s restorative vision and covenantal expectations.",
    assets: [
      {
        label: "Slide deck (PDF/Slides)",
        description: "Download the latest Module 1 slide deck with facilitator notes.",
        href: "/ougm-restorative-justice/resources/module-1#slides",
        hrefLabel: "Open slide deck",
      },
      {
        label: "Trainer script & covenant",
        description: "Detailed talking points and sample covenant located on the Module 1 resource page.",
        href: "/ougm-restorative-justice/resources/module-1#trainer-script",
        hrefLabel: "View script",
      },
      {
        label: "Values mapping worksheet",
        description: "Printable worksheet available as a PDF download on the Module 1 resource page.",
        href: "/ougm-restorative-justice/resources/module-1#values-worksheet",
        hrefLabel: "Download worksheet",
      },
    ],
  },
  {
    id: "module-2-assets",
    moduleTitle: trainingModules[1].title,
    summary:
      "Resources for trauma-responsive facilitation, including grounding practices and safety planning templates.",
    assets: [
      {
        label: "Slide deck (PDF/Slides)",
        description: "Download the trauma-responsive facilitation deck with embedded videos and facilitator stance visuals.",
        href: "/ougm-restorative-justice/resources/module-2#slides",
        hrefLabel: "Open slide deck",
      },
      {
        label: "Grounding toolkit",
        description: "Downloadable card set with 5-4-3-2-1 prompts, sensory aids, and co-regulation scripts.",
        href: "/ougm-restorative-justice/resources/module-2#grounding-toolkit",
        hrefLabel: "Download toolkit",
      },
      {
        label: "Guided grounding practice",
        description: "Two-minute breath prayer video to model co-regulation before and after circles.",
        href: "/ougm-restorative-justice/resources/module-2#audio",
        hrefLabel: "Play practice",
      },
    ],
  },
  {
    id: "module-3-assets",
    moduleTitle: trainingModules[2].title,
    summary:
      "Facilitation aids for circle design, including annotated scripts, room layouts, and practice rubrics.",
    assets: [
      {
        label: "Slide deck (PDF/Slides)",
        description: "Annotated circle process slide deck used in demonstrations.",
        href: "/ougm-restorative-justice/resources/module-3#slides",
        hrefLabel: "Open slide deck",
      },
      {
        label: "Facilitator quality rubric",
        description: "Scoring rubric and coaching form ready for download.",
        href: "/ougm-restorative-justice/resources/module-3#facilitator-rubric",
        hrefLabel: "Download rubric",
      },
      {
        label: "Scenario packets",
        description: "Editable role packets (resident, staff, volunteer perspectives) for practice circles.",
        href: "/ougm-restorative-justice/resources/module-3#scenario-packets",
        hrefLabel: "Download packets",
      },
    ],
  },
  {
    id: "module-4-assets",
    moduleTitle: trainingModules[3].title,
    summary:
      "Materials for agreement drafting, re-entry circles, and follow-up coaching.",
    assets: [
      {
        label: "Slide deck (PDF/Slides)",
        description: "Accountability module deck featuring agreement anatomy, dashboards, and re-entry scripts.",
        href: "/ougm-restorative-justice/resources/module-4#slides",
        hrefLabel: "Open slide deck",
      },
      {
        label: "Agreement template bundle",
        description: "Fillable agreement PDF and Word template ready for download.",
        href: "/ougm-restorative-justice/resources/module-4#agreement-templates",
        hrefLabel: "Download templates",
      },
      {
        label: "Re-entry celebration checklist",
        description: "Two-page checklist with celebration ideas and follow-up cadence.",
        href: "/ougm-restorative-justice/resources/module-4#celebration-checklist",
        hrefLabel: "Download checklist",
      },
    ],
  },
  {
    id: "module-5-assets",
    moduleTitle: trainingModules[4].title,
    summary:
      "Content that supports facilitator wellness rhythms, supervision, and Sabbath practices.",
    assets: [
      {
        label: "Slide deck (PDF/Slides)",
        description: "Facilitator wellness slide deck with reflection prompts.",
        href: "/ougm-restorative-justice/resources/module-5#slides",
        hrefLabel: "Open slide deck",
      },
      {
        label: "ProQOL self-assessment",
        description: "Download the compassion fatigue inventory (PDF) for personal reflection or supervision conversations.",
        href: "/ougm-restorative-justice/resources/module-5#proqol",
        hrefLabel: "Download assessment",
      },
      {
        label: "Sabbath retreat guide",
        description: "Half-day retreat outline with scripture reflections and embodiment practices.",
        href: "/ougm-restorative-justice/resources/module-5#retreat-guide",
        hrefLabel: "Download guide",
      },
    ],
  },
];

const printableResources = [
  {
    title: "Facilitator Preparation Checklist",
    description: "Step-by-step walkthrough to prepare a circle or conference safely and confidently.",
    items: [
      "Review referral information, history of incidents, and any known triggers or accommodations.",
      "Confirm consent and readiness with each participant; note preferred support people or advocates.",
      "Reserve a trauma-informed space (privacy, flexible seating, refreshments, sensory aids).",
      "Gather opening reflection, values prompts, and closing blessing aligned with OUGM mission.",
      "Coordinate debrief schedule and ensure a co-facilitator or observer is assigned.",
    ],
  },
  {
    title: "Participant Orientation Handout",
    description: "One-page explainer for residents, staff, and community partners entering the process.",
    items: [
      "Purpose of restorative justice at OUGM: repairing harm, strengthening community, and supporting healing.",
      "What to expect before, during, and after a session, including confidentiality and safety commitments.",
      "Roles of participants, facilitators, support persons, and observers.",
      "Guiding agreements (speak from the heart, listen to understand, honor dignity, focus on solutions).",
      "Contacts for additional support (case management, chaplaincy, recovery groups).",
    ],
  },
  {
    title: "Restorative Agreement Template",
    description: "Structured form to document commitments, timelines, and accountability supports.",
    items: [
      "Summary of harms named and needs identified by all voices.",
      "Actions to be taken, by whom, and by when (categorize into safety, restitution, relationship, and growth).",
      "Support resources required (housing, recovery, employment, health, spiritual care).",
      "Follow-up checkpoints with responsible connector (staff lead, mentor, peer advocate).",
      "Celebration or closure plan once commitments are fulfilled.",
    ],
  },
  {
    title: "Incident Intake & Suitability Screen",
    description: "Printable triage tool for staff receiving referrals or requests for restorative response.",
    items: [
      "Brief summary of incident, location, and immediate safety actions taken.",
      "Stakeholders involved, including residents, staff, or community members.",
      "Assessment of immediate risks (medical, legal, safety) and required referrals.",
      "Readiness indicators: willingness to participate, support networks, accommodation needs.",
      "Routing decision (restorative conversation, circle, alternative response) with rationale.",
    ],
  },
  {
    title: "Follow-up Reflection Log",
    description: "Used by facilitators and case managers to track progress after agreements are made.",
    items: [
      "Date of contact, people present, and method (in-person, phone, outreach).",
      "Progress on each action item and any barriers encountered.",
      "Adjustments requested by participants or support teams.",
      "Well-being check (emotional, physical, spiritual) and referrals provided.",
      "Next steps and scheduled encouragement or celebration moments.",
    ],
  },
];

const trainerHandbookChapters = [
  {
    title: "Chapter 1 · Program Orientation for Trainers",
    overview:
      "Use this session to ground staff in the heart behind OUGM’s restorative justice program and set expectations for how trainings will run. Trainers should model warm hospitality, clear structure, and trauma-aware language from the start.",
    learningOutcomes: [
      "Explain OUGM’s restorative justice theology and how it intersects with trauma-responsive shelter practices.",
      "Detail the training cadence, adult learning posture, and documentation requirements for facilitators-in-training.",
      "Establish a psychologically safe learning environment through shared covenants and inclusive spiritual practices.",
    ],
    sessionPlan: [
      {
        segment: "Welcome, prayer, and community agreement · 10 minutes",
        trainerMoves: [
          "Share a brief welcome rooted in OUGM’s mission and invite an opening prayer or reflection.",
          "Facilitate a quick pair share on why restorative justice matters in the shelter context.",
          "Co-create a training covenant covering confidentiality, feedback norms, and cultural humility.",
        ],
        participantExperience: [
          "Feel seen and oriented; name personal hopes and concerns.",
          "Begin internalizing the shared values that will guide every session.",
        ],
      },
      {
        segment: "Teaching block: Restorative justice at OUGM · 20 minutes",
        trainerMoves: [
          "Walk through a visual that connects harms, needs, and obligations to scripture and trauma theory.",
          "Contrast punitive vs. restorative responses using a recent (anonymized) shelter scenario.",
          "Invite participants to identify restorative opportunities currently missed in daily operations.",
        ],
        participantExperience: [
          "Articulate key differences between punitive, permissive, and restorative responses.",
          "See how restorative practices advance housing stability, recovery, and spiritual care outcomes.",
        ],
      },
      {
        segment: "Practice lab: Learn · Practice · Integrate model · 25 minutes",
        trainerMoves: [
          "Explain the Learn–Practice–Integrate framework that every training module will follow.",
          "Run a micro-demo of the framework using a simple scenario (e.g., welcoming a resident to a circle).",
          "Facilitate a fishbowl debrief asking participants to name what the trainer did before, during, and after the demo.",
        ],
        participantExperience: [
          "Observe facilitation moves in action and analyze them with peers.",
          "Understand how each module will combine skill building and reflection.",
        ],
      },
      {
        segment: "Documentation walkthrough & next steps · 15 minutes",
        trainerMoves: [
          "Demonstrate where to find the digital forms, interactive modules, and reporting templates on Life-AI.",
          "Show how to log training attendance and agreements reached during practice circles.",
          "Assign a reflection prompt and clarify support channels before closing with prayer/affirmation.",
        ],
        participantExperience: [
          "Know exactly how to access materials online and where to store documentation.",
          "Leave with a concrete action: complete Module 1 and submit a reflection before the next session.",
        ],
      },
    ],
    discussionPrompts: [
      "Where have you seen restorative values show up in our shelter already? Where are they missing?",
      "What support do you need from supervisors or chaplains to practice restorative responses confidently?",
    ],
    coachingStrategies: [
      "Model vulnerability by sharing a time you needed restoration and what helped.",
      "Use strengths-based language when offering feedback; anchor comments to the covenant.",
      "Assign training buddies so staff can process materials between sessions.",
    ],
    followUp: [
      "Trainers review attendance and reflections using the digital Trainer Session Report.",
      "Schedule coaching touch points with anyone who names hesitancy or specific learning needs.",
      "Email recap with links to Module 1, the facilitator covenant, and required forms.",
    ],
    digitalResources: [
      "Kick-off slide deck template with editable scripture/service prompts.",
      "Trainer onboarding checklist and facilitator covenant form (fillable).",
      "Learning agreement template stored in the Life-AI library for participant signatures.",
    ],
  },
  {
    title: "Chapter 2 · Facilitation Skills Lab",
    overview:
      "Focus on practicing core facilitator moves—presence, trauma-aware questioning, and circle choreography. This chapter is highly experiential and should include live demos, role-play packets, and structured debriefs.",
    learningOutcomes: [
      "Coach facilitators to balance empathy, boundaries, and dignity restoration in every interaction.",
      "Demonstrate pre-conference, circle, and debrief processes with explicit scripting and decision points.",
      "Adapt facilitation techniques to honor participants navigating mental health, neurodiversity, and cultural differences.",
    ],
    sessionPlan: [
      {
        segment: "Facilitator stance tune-up · 15 minutes",
        trainerMoves: [
          "Guide a brief grounding exercise to model co-regulation techniques.",
          "Lead a discussion on what ‘presence’ feels like when facilitation is going well versus off-track.",
          "Introduce the facilitator stance triangle: hospitality, accountability, humility.",
        ],
        participantExperience: [
          "Practice centering themselves before leading others.",
          "Identify personal strengths and growth edges in holding restorative space.",
        ],
      },
      {
        segment: "Live demo + fishbowl · 25 minutes",
        trainerMoves: [
          "Run a full mini-circle with two trainers role-playing participants and one as facilitator.",
          "Pause at decision points (setting agreements, responding to dysregulation) to narrate what you are considering.",
          "Invite observers to capture ‘moves’ they notice on the Facilitator Quality Rubric.",
        ],
        participantExperience: [
          "See facilitation handled in real time with transparent decision-making.",
          "Use the rubric to sharpen observation skills they will need as peers give feedback.",
        ],
      },
      {
        segment: "Role-play breakout · 30 minutes",
        trainerMoves: [
          "Assign triads (facilitator, participant, observer) with tailored scenario packets.",
          "Coach observers to offer feedback using N.O.W. structure (Notice, Outcome, Wonder).",
          "Rotate roles so each person facilitates once, offering in-the-moment prompts and praise.",
        ],
        participantExperience: [
          "Facilitate a realistic scenario with guidance while peers track strengths and adjustments.",
          "Receive concrete, strengths-based feedback linked to the quality rubric.",
        ],
      },
      {
        segment: "Integration & documentation · 15 minutes",
        trainerMoves: [
          "Debrief as a full group: what practices felt most natural, and where did they need support?",
          "Demonstrate logging practice notes using the Facilitator Preparation Checklist and Follow-up Log.",
          "Confirm next steps (co-facilitation assignments, modules to review).",
        ],
        participantExperience: [
          "Commit to specific practice goals before their next supervised circle.",
          "Understand how to document practice reflections digitally.",
        ],
      },
    ],
    discussionPrompts: [
      "Which facilitator moves built trust fastest in your breakout?",
      "How did your body respond while leading? What support did you need to stay grounded?",
    ],
    coachingStrategies: [
      "Use slow-down moments—ask the facilitator to rewind 30 seconds and try another approach.",
      "Name observable behaviors (“You shifted eye contact, softened your tone…”) before offering suggestions.",
      "Pair less-experienced facilitators with mentors for co-facilitation and structured debriefs.",
    ],
    followUp: [
      "Upload video or audio recordings (if consented) for asynchronous feedback.",
      "Assign Module 2 trauma-responsive practice exercises and log completion.",
      "Schedule supervised circles within two weeks to reinforce learning.",
    ],
    digitalResources: [
      "Facilitator Quality Rubric (fillable) with auto-calculated competency highlights.",
      "Scenario packet generator with trauma-informed guardrails and prompts.",
      "Video library (tagged by skill) linked in the training calendar for pre/post session study.",
    ],
  },
  {
    title: "Chapter 3 · Data, Documentation, and Quality Assurance",
    overview:
      "Ensure the program remains accountable by teaching trainers how to capture every interaction digitally, analyze patterns, and communicate progress to leadership.",
    learningOutcomes: [
      "Record attendance, assessment scores, and reflective journals in centralized systems without paper.",
      "Teach facilitators to log agreements, supports, and follow-up tasks in harmony with case management workflows.",
      "Interpret key metrics (circles requested vs. completed, agreement completion, satisfaction) to drive improvement.",
    ],
    sessionPlan: [
      {
        segment: "Data stewardship devotional · 5 minutes",
        trainerMoves: [
          "Offer a short reflection on stewardship and confidentiality rooted in OUGM values.",
          "Frame data as a way to honor stories and advocate for resources, not as surveillance.",
        ],
        participantExperience: [
          "Connect data practices to mission and trust-building.",
        ],
      },
      {
        segment: "System walkthrough · 25 minutes",
        trainerMoves: [
          "Navigate the Life-AI restorative justice workspace, highlighting folders for forms, reports, and agreements.",
          "Demonstrate how interactive forms copy to clipboard and how to store them in shared trackers.",
          "Show sample dashboards (agreement progress, incident trends) and how they refresh.",
        ],
        participantExperience: [
          "Gain confidence locating, completing, and filing digital records.",
          "Understand how their data entries populate leadership dashboards.",
        ],
      },
      {
        segment: "Practice lab: Intake to follow-up · 25 minutes",
        trainerMoves: [
          "Assign mini-cases; teams complete the Intake Screen, Agreement Builder, and Follow-up Log online.",
          "Provide real-time coaching on clarity, trauma-informed language, and support referrals.",
          "Review common errors (missing consent notes, vague follow-up plans) and how to correct them.",
        ],
        participantExperience: [
          "Complete end-to-end documentation workflow digitally with coach feedback.",
          "Spot how thorough documentation supports continuity of care.",
        ],
      },
      {
        segment: "Quality review & improvement planning · 20 minutes",
        trainerMoves: [
          "Review anonymized monthly data to identify strengths, gaps, and equity considerations.",
          "Facilitate a rapid improvement plan: choose one metric, plan a micro-change, assign owners.",
          "Confirm reporting cadence to leadership, chaplaincy, and community partners.",
        ],
        participantExperience: [
          "Practice translating numbers into action steps and storytelling.",
          "Commit to a concrete improvement experiment before the next session.",
        ],
      },
    ],
    discussionPrompts: [
      "What stories do our current data tell—and what are we missing?",
      "How can we honor participant confidentiality while still sharing impact?",
    ],
    coachingStrategies: [
      "Provide checklists for trainers to audit documentation weekly.",
      "Celebrate teams whose data shows growth, reinforcing desired behaviors.",
      "Pair data review with qualitative testimonies to keep reports human-centered.",
    ],
    followUp: [
      "Submit a Trainer Session Report summarizing insights and next steps.",
      "Update the improvement experiment in the quarterly reporting template.",
      "Schedule a huddle to review impact dashboards with supervisors.",
    ],
    digitalResources: [
      "Training attendance & assessment tracker (fillable sheet) linked to interactive modules.",
      "Quarterly reporting template summarizing restorative outputs/outcomes for leadership.",
      "Automated reminder scripts for follow-up contacts (24h / 7-day / 30-day).",
    ],
  },
  {
    title: "Chapter 4 · Spiritual Care & Mutual Support",
    overview:
      "Protect facilitator resilience and nurture a culture of mutual care so restorative justice remains sustainable and hope-filled.",
    learningOutcomes: [
      "Integrate pastoral care, prayer, and reflective listening into facilitator support plans.",
      "Identify early warning signs of compassion fatigue and deploy caring interventions quickly.",
      "Collect and celebrate stories of transformation to reinforce hope-centered praxis.",
    ],
    sessionPlan: [
      {
        segment: "Opening liturgy & gratitude circle · 10 minutes",
        trainerMoves: [
          "Invite participants to share a moment of restoration they witnessed recently.",
          "Offer a flexible liturgy or reflection welcoming diverse faith expressions.",
        ],
        participantExperience: [
          "Experience spiritual and emotional grounding before tackling heavy topics.",
        ],
      },
      {
        segment: "Teach: Compassion fatigue & resilience · 20 minutes",
        trainerMoves: [
          "Review signs of vicarious trauma and burnout common in shelter work.",
          "Introduce the facilitator wellness tracker and demonstrate how to log check-ins.",
          "Share stories (with permission) of facilitators naming their limits and receiving support.",
        ],
        participantExperience: [
          "Normalize asking for help and setting boundaries.",
          "Learn how to use digital tools to monitor their well-being.",
        ],
      },
      {
        segment: "Mutual care design lab · 25 minutes",
        trainerMoves: [
          "Guide teams to design buddy systems, Sabbath rhythms, and debrief plans for their site.",
          "Prompt groups to role-play requesting support from a supervisor or chaplain.",
          "Collect commitments and capture them in the Facilitator Wellness Tracker.",
        ],
        participantExperience: [
          "Create tangible care plans and practice courageous conversations.",
          "Experience community support in real time.",
        ],
      },
      {
        segment: "Story capture & commissioning · 15 minutes",
        trainerMoves: [
          "Teach trainers how to use the story capture template to record testimonies ethically.",
          "Commission facilitators with a blessing, inviting them to share one commitment for the week ahead.",
        ],
        participantExperience: [
          "Leave encouraged and connected to the bigger story of transformation.",
        ],
      },
    ],
    discussionPrompts: [
      "What practices help you notice when you are nearing exhaustion?",
      "How can we make it safe for facilitators to request respite or reassignment?",
    ],
    coachingStrategies: [
      "Model asking for help yourself; name the supports you rely on.",
      "Schedule quarterly Sabbath workshops focused on rest, creativity, and prayer.",
      "Use supervision notes to track wellness commitments and celebrate progress.",
    ],
    followUp: [
      "Complete the Facilitator Wellness Tracker after each intensive week.",
      "Submit one story capture entry highlighting reconciliation or healing.",
      "Plan a peer gratitude circle to close the current training cohort.",
    ],
    digitalResources: [
      "Facilitator wellness tracker for supervision conversations (fillable form).",
      "Story capture template to archive testimonies for reports, fundraising, and worship gatherings.",
      "Prayer & reflection library curated with staff, resident, and alumni contributions.",
    ],
  },
];

const digitalForms: DigitalForm[] = [
  {
    id: "form-facilitator-prep",
    title: "Facilitator Preparation Checklist",
    purpose: "Plan a restorative conversation, circle, or conference with safety, dignity, and support at the center.",
    tags: ["Preparation", "Facilitation", "Safety"],
    stage: "Before a restorative response",
    fields: [
      { id: "date", label: "Preparation date", type: "date" },
      { id: "facilitator", label: "Facilitator(s)", type: "text", placeholder: "Add co-facilitators if applicable" },
      {
        id: "circle-type",
        label: "Process type",
        type: "select",
        options: ["Restorative conversation", "Harm circle", "Community-building circle", "Re-entry circle", "Other"],
      },
      { id: "participants", label: "Confirmed participants & support persons", type: "textarea", rows: 4 },
      { id: "summary", label: "Incident summary & known needs", type: "textarea", rows: 4 },
      { id: "consent", label: "Readiness/consent notes", type: "textarea", rows: 4 },
      { id: "environment", label: "Space & accessibility plan", type: "textarea", rows: 3 },
      { id: "opening", label: "Opening reflection/values prompt", type: "textarea", rows: 3 },
      { id: "closing", label: "Closing blessing/next steps cue", type: "textarea", rows: 3 },
    ],
    completionNote: "Paste into the shared preparation log so supervisors can confirm readiness and provide coaching.",
  },
  {
    id: "form-participant-orientation",
    title: "Participant Orientation Record",
    purpose: "Document informed consent conversations with residents, staff, volunteers, or community members.",
    tags: ["Orientation", "Documentation"],
    stage: "Before a restorative response",
    fields: [
      { id: "orientation-date", label: "Orientation date", type: "date" },
      { id: "oriented-by", label: "Orientation lead", type: "text" },
      { id: "participant-name", label: "Participant name", type: "text" },
      {
        id: "role",
        label: "Participant role",
        type: "select",
        options: ["Resident", "Staff", "Volunteer", "Community member", "Family/Support person"],
      },
      { id: "hopes", label: "Participant hopes & needs", type: "textarea", rows: 3 },
      { id: "concerns", label: "Concerns/accommodations requested", type: "textarea", rows: 3 },
      { id: "support", label: "Support people or resources requested", type: "textarea", rows: 3 },
      { id: "consent-notes", label: "Consent confirmation & boundaries", type: "textarea", rows: 3 },
    ],
    completionNote: "Upload to the participant’s case file and share highlights with co-facilitators.",
  },
  {
    id: "form-agreement-builder",
    title: "Restorative Agreement Builder",
    purpose: "Capture harms, needs, action steps, and accountability supports created during a restorative session.",
    tags: ["Agreements", "Accountability"],
    stage: "During the process",
    fields: [
      { id: "agreement-date", label: "Agreement date", type: "date" },
      { id: "agreement-type", label: "Process type", type: "select", options: ["Harm circle", "Conference", "Conversation"] },
      { id: "harms", label: "Harms named", type: "textarea", rows: 4 },
      { id: "needs", label: "Needs identified", type: "textarea", rows: 4 },
      { id: "actions", label: "Action commitments (who/what/when)", type: "textarea", rows: 5 },
      { id: "supports", label: "Support resources required", type: "textarea", rows: 4 },
      { id: "checkpoints", label: "Follow-up checkpoints & responsible persons", type: "textarea", rows: 4 },
      { id: "celebration", label: "Closure/Celebration plan", type: "textarea", rows: 3 },
    ],
    completionNote: "Share the completed agreement with all parties and store it in the secure Life-AI document library.",
  },
  {
    id: "form-intake-screen",
    title: "Incident Intake & Suitability Screen",
    purpose: "Triage referrals to determine whether a restorative pathway is appropriate and safe.",
    tags: ["Intake", "Safety"],
    stage: "Before a restorative response",
    fields: [
      { id: "referral-date", label: "Referral date", type: "date" },
      { id: "submitted-by", label: "Submitted by", type: "text", placeholder: "Name & role" },
      { id: "incident-summary", label: "Incident summary", type: "textarea", rows: 4 },
      {
        id: "immediate-actions",
        label: "Immediate safety actions taken",
        type: "textarea",
        rows: 3,
        helper: "Include medical attention, emergency services, separation plans, etc.",
      },
      {
        id: "risks",
        label: "Risks or mandated reporting considerations",
        type: "textarea",
        rows: 3,
      },
      {
        id: "readiness",
        label: "Readiness indicators (willingness, stability, support)",
        type: "textarea",
        rows: 3,
      },
      {
        id: "recommended-path",
        label: "Recommended pathway",
        type: "select",
        options: [
          "Restorative conversation",
          "Harm circle",
          "Community-building circle",
          "Alternative response (case management, clinical, disciplinary)",
        ],
      },
      { id: "notes", label: "Additional notes or referrals", type: "textarea", rows: 3 },
    ],
    completionNote: "Route the record to the restorative coordination team and upload to the secure intake tracker.",
  },
  {
    id: "form-follow-up-log",
    title: "Follow-up Reflection Log",
    purpose: "Document coaching conversations and well-being checks after an agreement is in motion.",
    tags: ["Follow-up", "Support"],
    stage: "After the process",
    fields: [
      { id: "follow-up-date", label: "Contact date", type: "date" },
      { id: "contact-method", label: "Contact method", type: "select", options: ["In-person", "Phone", "Outreach", "Virtual"] },
      { id: "participants-present", label: "People present", type: "textarea", rows: 3 },
      { id: "progress", label: "Progress on action items", type: "textarea", rows: 4 },
      { id: "barriers", label: "Barriers surfaced", type: "textarea", rows: 3 },
      { id: "adjustments", label: "Adjustments to agreements/supports", type: "textarea", rows: 3 },
      { id: "wellbeing", label: "Well-being check notes", type: "textarea", rows: 3 },
      { id: "next-steps", label: "Next steps & encouragement plans", type: "textarea", rows: 3 },
    ],
    completionNote: "Paste into the facilitator follow-up tracker to maintain a 100% digital audit trail.",
  },
  {
    id: "form-trainer-session",
    title: "Trainer Session Report",
    purpose: "Track attendance, assessment results, and next actions for facilitator cohorts.",
    tags: ["Training", "Quality assurance"],
    stage: "Trainer administration",
    fields: [
      { id: "session-date", label: "Session date", type: "date" },
      { id: "module", label: "Module delivered", type: "select", options: trainingModules.map((module) => module.title) },
      { id: "trainer", label: "Trainer(s)", type: "text" },
      { id: "attendance", label: "Attendance roster", type: "textarea", rows: 4 },
      { id: "pre-post", label: "Pre/post assessment insights", type: "textarea", rows: 3 },
      { id: "strengths", label: "Observed strengths", type: "textarea", rows: 3 },
      { id: "growth-areas", label: "Growth areas & coaching assignments", type: "textarea", rows: 3 },
      { id: "follow-up-actions", label: "Next steps (co-facilitations, mentorship, documentation)", type: "textarea", rows: 3 },
    ],
    completionNote: "Export to the Life-AI training tracker and share highlights during monthly trainer huddles.",
  },
  {
    id: "form-wellness-tracker",
    title: "Facilitator Wellness Tracker",
    purpose: "Log supervision check-ins, early warning signs, and mutual care commitments for each facilitator.",
    tags: ["Wellness", "Supervision"],
    stage: "Ongoing wellness",
    fields: [
      { id: "check-in-date", label: "Check-in date", type: "date" },
      { id: "facilitator-name", label: "Facilitator", type: "text" },
      {
        id: "energy-level",
        label: "Energy level",
        type: "select",
        options: ["Empowered", "Steady", "Stretched", "Exhausted"],
      },
      { id: "recent-highs", label: "Recent joys / wins", type: "textarea", rows: 3 },
      { id: "stress-signals", label: "Stress signals noticed", type: "textarea", rows: 3 },
      { id: "supports-requested", label: "Supports requested or provided", type: "textarea", rows: 3 },
      { id: "rest-plan", label: "Upcoming rest or Sabbath plan", type: "textarea", rows: 3 },
      { id: "follow-up-date", label: "Next check-in date", type: "date" },
    ],
    completionNote: "Copy entries into the supervision notes folder so leaders can monitor capacity across the facilitator team.",
  },
];

const tableOfContents = [
  { anchor: "section-orientation", label: "1. Program orientation & launch prep" },
  { anchor: "section-modules", label: "2. Facilitator training modules" },
  { anchor: "section-assets", label: "3. Module asset shelves" },
  { anchor: "section-handbook", label: "4. Trainer handbook & lesson plans" },
  { anchor: "section-printables", label: "5. Participant handouts (printable)" },
  { anchor: "digital-forms", label: "6. Digital forms & tracking" },
  { anchor: "section-integration", label: "7. Integration checklist" },
  { anchor: "section-faq", label: "8. Frequently asked questions" },
  { anchor: "section-support", label: "9. Support & next steps" },
];

function DigitalFormsTimeline() {
  const stageOrder = [
    "Before a restorative response",
    "During the process",
    "After the process",
    "Trainer administration",
    "Ongoing wellness",
  ];

  const formsByStage = digitalForms.reduce<Record<string, DigitalForm[]>>((acc, form) => {
    const stageKey = form.stage ?? "General use";
    acc[stageKey] = acc[stageKey] ? [...acc[stageKey], form] : [form];
    return acc;
  }, {});

  const additionalStages = Object.keys(formsByStage).filter(
    (stage) => !stageOrder.includes(stage),
  );

  const orderedStages = [...stageOrder, ...additionalStages].filter((stage) => formsByStage[stage]?.length);

  return (
    <div className="space-y-8">
      {orderedStages.map((stage) => (
        <div key={stage} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{stage}</h3>
            <span className="text-xs text-slate-500">
              {formsByStage[stage].length} form{formsByStage[stage].length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-4">
            {formsByStage[stage].map((form) => (
              <DigitalFormCard key={form.title} form={form} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const faqs = [
  {
    question: "How are OUGM staff identified as restorative justice facilitators?",
    answer:
      "Supervisors nominate staff or volunteers who demonstrate emotional maturity, cultural humility, and steady presence. After completing Modules 1–4, candidates co-facilitate three circles with coaching before operating independently. Facilitator status is renewed annually through reflective supervision and peer observation.",
  },
  {
    question: "What does success look like for the program?",
    answer:
      "We track reductions in repeated incidents, increased resident retention, timely follow-up on agreements, and qualitative feedback on safety and belonging. Data is reviewed quarterly alongside rehousing and recovery outcomes to show how restorative practices reinforce OUGM’s mission.",
  },
  {
    question: "How do residents request a restorative response?",
    answer:
      "Residents can complete the Incident Intake & Suitability Screen with a staff ally, mention the program during case management, or request a conversation at community meetings. Facilitators will follow up within 48 hours to schedule preparation meetings.",
  },
  {
    question: "How is confidentiality handled within a shelter setting?",
    answer:
      "Only those directly involved, their support persons, and required supervisors participate. Notes focus on agreements rather than detailed narratives. Safety concerns, mandated reports, or legal obligations are escalated immediately while honoring dignity and transparency.",
  },
];

const OUGM_RESTORATIVE_PUBLIC_ACCESS = true;

function useIsOUGMMember(): boolean {
  const { user } = useUser();

  return useMemo(() => {
    if (!user) {
      return false;
    }

    const metadata = user.publicMetadata ?? {};
    const organizations = Array.isArray((metadata as Record<string, unknown>).organizations)
      ? ((metadata as Record<string, unknown>).organizations as unknown[])
      : [];

    const normalizedOrgs = organizations
      .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
      .filter(Boolean);

    const explicitFlag =
      (metadata as Record<string, unknown>).ougm === true ||
      (metadata as Record<string, unknown>).ougmMember === true ||
      (metadata as Record<string, unknown>).ougm_access === true;

    return (
      explicitFlag ||
      normalizedOrgs.includes("ougm") ||
      normalizedOrgs.includes("union gospel mission") ||
      normalizedOrgs.includes("union gospel mission restorative justice")
    );
  }, [user]);
}

export default function OUGMRestorativeJusticePage() {
  const isOUGMMember = useIsOUGMMember();
  const canViewContent = OUGM_RESTORATIVE_PUBLIC_ACCESS || isOUGMMember;
  const [openSections, setOpenSections] = useState<string[]>([tableOfContents[0].anchor]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hash = window.location.hash.replace("#", "");
    if (hash && tableOfContents.some((item) => item.anchor === hash)) {
      setOpenSections((prev) => (prev.includes(hash) ? prev : [...prev, hash]));
    }
  }, []);

  const ensureSectionOpen = (anchor: string) => {
    setOpenSections((prev) => (prev.includes(anchor) ? prev : [...prev, anchor]));
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-4">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          OUGM Restorative Justice Initiative
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Restorative Justice Training Hub</h1>
        <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
          Welcome to the Union Gospel Mission&apos;s restorative justice resource center. This hub equips facilitators,
          shelter staff, volunteers, and resident leaders with practical training, printable tools, and spiritual
          practices that support reconciliation and healing inside OUGM shelters.
        </p>
      </header>

      {!OUGM_RESTORATIVE_PUBLIC_ACCESS && (
        <>
          <SignedOut>
            <Alert variant="default" className="border-amber-300 bg-amber-50">
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription>
                Please sign in with your Life-AI account. OUGM restorative justice resources are reserved for authorized
                Union Gospel Mission team members. Contact your program director if you need access.
              </AlertDescription>
            </Alert>
          </SignedOut>
          <SignedIn>
            {!canViewContent ? (
              <Alert variant="destructive" className="border-rose-300 bg-rose-50 text-rose-900">
                <AlertTitle>OUGM credentials needed</AlertTitle>
                <AlertDescription>
                  Your account is missing the <code>ougmMember</code> access flag. Supervisors can enable access in Clerk
                  by setting <code>publicMetadata.ougmMember</code> to <code>true</code> or adding &ldquo;OUGM&rdquo; to
                  the organizations list. Once updated, refresh this page to view the training materials.
                </AlertDescription>
              </Alert>
            ) : null}
          </SignedIn>
        </>
      )}

      {OUGM_RESTORATIVE_PUBLIC_ACCESS ? (
        <Alert variant="default" className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <AlertTitle>Temporary public access</AlertTitle>
          <AlertDescription>
            OUGM is sharing this restorative justice hub openly for now so partners can onboard quickly. Sign in with
            your Life-AI account to save notes and access personalized features.
          </AlertDescription>
        </Alert>
      ) : null}

      {canViewContent ? (
        <section className="space-y-10">
          <RestorativePortal />
          <nav className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Course roadmap</h2>
              <p className="mt-1 text-sm text-slate-600">
                Work through the curriculum in order. Each section links directly to the materials you need for that stage
                of training—from launch planning through post-program evaluation.
              </p>
              <ol className="mt-4 space-y-2 text-sm text-slate-700">
                {tableOfContents.map((item) => (
                  <li key={item.anchor} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                    <a
                      href={`#${item.anchor}`}
                      className="hover:text-emerald-700 hover:underline"
                      onClick={() => ensureSectionOpen(item.anchor)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={(value) => setOpenSections(value)}
              className="space-y-4"
            >
              <div id="section-orientation">
                <AccordionItem value="section-orientation">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    1. Program orientation &amp; launch prep
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">Implementation roadmap</CardTitle>
                <p className="text-sm text-slate-500">
                  Roll out the restorative justice program in four phases. Each milestone includes focus areas and
                  tangible deliverables to anchor accountability.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {implementationPhases.map((phase) => (
                  <div key={phase.title} className="space-y-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">{phase.title}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Focus</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {phase.focus.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deliverables</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {phase.deliverables.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="section-modules">
                <AccordionItem value="section-modules">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    2. Facilitator training modules
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-slate-900">Interactive training modules</h2>
                      <p className="text-sm text-slate-500">
                        Build facilitator capacity with blended learning experiences. Each module combines learning
                        outcomes, real-world scenarios, and reflection prompts contextualized for Union Gospel Mission shelters.
                      </p>
                    </div>
                    <Accordion type="multiple" className="space-y-4">
                      {trainingModules.map((module, index) => (
                        <AccordionItem key={module.title} value={`module-${index + 1}`}>
                          <AccordionTrigger className="flex flex-col items-start gap-1 px-1 text-left text-base font-semibold text-slate-900 sm:flex-row sm:items-center sm:justify-between">
                            <span>{module.title}</span>
                            <span className="text-sm font-medium text-slate-500 sm:text-right">Duration: {module.duration}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <InteractiveModuleCard module={module} />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="section-assets">
                <AccordionItem value="section-assets">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    3. Module asset shelves
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-slate-900">Module asset shelves</h2>
                      <p className="text-sm text-slate-500">
                        Keep all slides, scripts, and facilitator aids within the OUGM hub. Request files directly from the
                        coordination team when download links are not provided.
                      </p>
                    </div>
                    <div className="space-y-6">
                      {moduleAssetShelves.map((shelf) => (
                        <div
                          key={shelf.id}
                          id={shelf.id}
                          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-slate-900">{shelf.moduleTitle}</h3>
                            <p className="text-sm text-slate-600">{shelf.summary}</p>
                          </div>
                          <div className="space-y-4">
                            {shelf.assets.map((asset) => {
                              const href = asset.href;
                              const label = asset.hrefLabel ?? "Open resource";
                              const isExternal = href ? /^(https?:|mailto:)/.test(href) : false;

                              return (
                                <div key={asset.label} className="space-y-3 rounded-md border border-slate-100 bg-slate-50 p-4">
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-slate-900">{asset.label}</h4>
                                    <p className="text-sm text-slate-600">{asset.description}</p>
                                  </div>
                                  {href ? (
                                    <Link
                                      href={href}
                                      target={isExternal ? "_blank" : undefined}
                                      rel={isExternal ? "noopener noreferrer" : undefined}
                                      className="inline-flex w-fit items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                                    >
                                      {label}
                                      {isExternal ? <span aria-hidden>↗</span> : null}
                                    </Link>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="section-handbook">
                <AccordionItem value="section-handbook">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    4. Trainer handbook &amp; lesson plans
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-slate-900">Trainer handbook (digital)</CardTitle>
                        <p className="text-sm text-slate-500">
                          Equip trainers with ready-to-use guidance for facilitating cohorts, documenting progress, and caring
                          for themselves. Expand each chapter to view outcomes, key practices, and the digital tools that support
                          them.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="w-full">
                          {trainerHandbookChapters.map((chapter, index) => (
                            <AccordionItem key={chapter.title} value={`handbook-${index}`}>
                              <AccordionTrigger className="text-left text-base font-semibold text-slate-900">
                                {chapter.title}
                              </AccordionTrigger>
                              <AccordionContent className="space-y-5 bg-slate-50 p-4 text-sm text-slate-600">
                                <p>{chapter.overview}</p>

                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Learning outcomes</h4>
                          <ul className="mt-2 space-y-2">
                            {chapter.learningOutcomes.map((outcome) => (
                              <li key={outcome} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Session flow</h4>
                          <div className="grid gap-3">
                            {chapter.sessionPlan.map((segment) => (
                              <div key={segment.segment} className="rounded-lg border border-slate-200 bg-white p-3">
                                <h5 className="font-semibold text-slate-900">{segment.segment}</h5>
                                <div className="mt-2 grid gap-3 md:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trainer moves</p>
                                    <ul className="mt-1 space-y-2">
                                      {segment.trainerMoves.map((move) => (
                                        <li key={move} className="flex items-start gap-2">
                                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                                          <span>{move}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Participant experience
                                    </p>
                                    <ul className="mt-1 space-y-2">
                                      {segment.participantExperience.map((experience) => (
                                        <li key={experience} className="flex items-start gap-2">
                                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                                          <span>{experience}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Discussion prompts</h4>
                          <ul className="mt-2 space-y-2">
                            {chapter.discussionPrompts.map((prompt) => (
                              <li key={prompt} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-fuchsia-400" />
                                <span>{prompt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Coaching strategies</h4>
                          <ul className="mt-2 space-y-2">
                            {chapter.coachingStrategies.map((strategy) => (
                              <li key={strategy} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                                <span>{strategy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Follow-up assignments</h4>
                          <ul className="mt-2 space-y-2">
                            {chapter.followUp.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Digital tools &amp; templates
                          </h4>
                          <ul className="mt-2 space-y-2">
                            {chapter.digitalResources.map((tool) => (
                              <li key={tool} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                                <span>{tool}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="section-printables">
                <AccordionItem value="section-printables">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    5. Participant handouts (printable)
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-slate-900">Printable resources</CardTitle>
                        <p className="text-sm text-slate-500">
                          Expand sections to view or print facilitator tools and handouts. Use your browser’s print dialogue to
                          save as PDF or produce hard copies for training sessions. Digital form versions are available below.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="w-full">
                          {printableResources.map((resource, index) => (
                            <AccordionItem key={resource.title} value={`resource-${index}`}>
                              <AccordionTrigger className="text-left text-base font-semibold text-slate-900">
                                {resource.title}
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4 bg-slate-50 p-4 text-sm text-slate-600">
                                <p className="text-slate-600">{resource.description}</p>
                                <ul className="space-y-2">
                                  {resource.items.map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                                <Button
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                  onClick={() => {
                                    if (typeof window !== "undefined") {
                                      window.print();
                                    }
                                  }}
                                >
                                  Print or save this resource
                                </Button>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="digital-forms">
                <AccordionItem value="digital-forms">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    6. Digital forms &amp; tracking
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-slate-900">Digital forms &amp; tracking</h2>
                      <p className="text-sm text-slate-500">
                        Complete and store every restorative justice record online. Copy responses to the clipboard, print to
                        PDF, or upload directly to shared folders—no paper packets required.
                      </p>
                    </div>
                    <DigitalFormsTimeline />
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="section-integration">
                <AccordionItem value="section-integration">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    7. Integration checklist
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-slate-900">Integration checklist</CardTitle>
                        <p className="text-sm text-slate-500">
                          Ensure restorative justice practices stay rooted in shelter operations, resident support, and spiritual
                          care rhythms.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                              Daily &amp; weekly rhythms
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                              <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                                <span>Integrate restorative updates into shift-change briefings and community meeting agendas.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                                <span>Offer resident-led circles for welcome, gratitude, and grieving at least once per week.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                                <span>Log agreements and follow-ups in the shared case management system within 24 hours.</span>
                              </li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Care for facilitators</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                              <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                                <span>Schedule post-session debriefs to celebrate wins and surface support needs.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                                <span>Create peer respite opportunities—retreats, prayer sessions, and supervision circles.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                                <span>Track facilitator capacity quarterly to avoid overload during peak shelter seasons.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="section-faq">
                <AccordionItem value="section-faq">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    8. Frequently asked questions
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Frequently asked questions</h2>
                        <p className="text-sm text-slate-500">
                          Guidance for shelter leaders, facilitators, and resident advocates as you embed restorative practices.
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-6">
                        {faqs.map((faq) => (
                          <div key={faq.question} className="space-y-2">
                            <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                            <p className="text-sm text-slate-600">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </AccordionContent>
                </AccordionItem>
              </div>

              <div id="section-support">
                <AccordionItem value="section-support">
                  <AccordionTrigger className="text-left text-lg font-semibold text-slate-900">
                    9. Support &amp; next steps
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <Card className="border-slate-200 bg-gradient-to-r from-emerald-50 to-sky-50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-slate-900">Need help getting started?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-slate-700">
                        <p>
                          Connect with the OUGM restorative justice coordination team at{" "}
                          <Link href="mailto:restorativejustice@ougmission.org" className="font-medium text-emerald-700 underline">
                            restorativejustice@ougmission.org
                          </Link>{" "}
                          to schedule coaching, request printed packets, or onboard new facilitators.
                        </p>
                        <p>
                          Not sure how to tag users for access? From the Clerk dashboard, open a user profile &rarr; Public Metadata
                          &rarr; add <code>ougmMember: true</code>. Changes apply immediately after the user refreshes the page.
                        </p>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </div>
            </Accordion>
        </section>
      ) : null}
    </div>
  );
}
