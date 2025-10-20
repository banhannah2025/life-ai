'use client';

import { useMemo, useState } from "react";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type KnowledgeCheckOption = {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
};

type ScenarioChoice = {
  id: string;
  label: string;
  recommended: boolean;
  rationale: string;
};

type ModuleDefinition = {
  term: string;
  definition: string;
  scripture?: string;
  practiceTip?: string;
};

type ModuleResource = {
  title: string;
  description: string;
  url: string;
  type: "slide" | "video" | "article" | "tool" | "podcast" | "template";
  duration?: string;
};

export type InteractiveTrainingModule = {
  title: string;
  duration: string;
  overview: string;
  introduction: string[];
  definitions: ModuleDefinition[];
  goals: string[];
  practice: string[];
  knowledgeCheck: {
    question: string;
    options: KnowledgeCheckOption[];
  };
  scenarioPractice: {
    prompt: string;
    coachingNote?: string;
    choices: ScenarioChoice[];
  };
  reflection: {
    prompt: string;
    guidance: string[];
  };
  resourceLinks: ModuleResource[];
};

type InteractiveModuleCardProps = {
  module: InteractiveTrainingModule;
};

export function InteractiveModuleCard({ module }: InteractiveModuleCardProps) {
  const [selectedKnowledgeOption, setSelectedKnowledgeOption] = useState<string | null>(null);
  const [knowledgeChecked, setKnowledgeChecked] = useState(false);
  const [selectedScenarioChoice, setSelectedScenarioChoice] = useState<string | null>(null);
  const [reflectionResponse, setReflectionResponse] = useState("");
  const [copied, setCopied] = useState(false);

  const knowledgeOutcome = useMemo(() => {
    if (!selectedKnowledgeOption) {
      return null;
    }
    return module.knowledgeCheck.options.find((option) => option.id === selectedKnowledgeOption) ?? null;
  }, [module.knowledgeCheck.options, selectedKnowledgeOption]);

  const scenarioOutcome = useMemo(() => {
    if (!selectedScenarioChoice) {
      return null;
    }
    return module.scenarioPractice.choices.find((choice) => choice.id === selectedScenarioChoice) ?? null;
  }, [module.scenarioPractice.choices, selectedScenarioChoice]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-xl font-semibold text-slate-900">{module.title}</CardTitle>
          <Badge variant="secondary" className="w-fit">
            {module.duration}
          </Badge>
        </div>
        <p className="text-sm text-slate-600">
          {module.overview}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {module.introduction.length ? (
          <section className="space-y-2">
            {module.introduction.map((paragraph, index) => (
              <p key={index} className="text-sm text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ) : null}

        {module.definitions.length ? (
          <section className="space-y-3 rounded-lg border border-slate-100 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Key definitions</h3>
            <div className="space-y-3">
              {module.definitions.map((definition) => (
                <div key={definition.term} className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{definition.term}</p>
                  <p className="text-sm text-slate-600">{definition.definition}</p>
                  {definition.practiceTip ? (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Practice tip:</span> {definition.practiceTip}
                    </p>
                  ) : null}
                  {definition.scripture ? (
                    <p className="text-xs italic text-emerald-700">{definition.scripture}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Learning outcomes</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {module.goals.map((goal) => (
                <li key={goal} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Practice &amp; coaching</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {module.practice.map((activity) => (
                <li key={activity} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-fuchsia-400" />
                  <span>{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Knowledge check</h3>
            <p className="text-sm text-slate-600">{module.knowledgeCheck.question}</p>
          </div>
          <RadioGroup
            value={selectedKnowledgeOption ?? ""}
            onValueChange={(value) => {
              setSelectedKnowledgeOption(value);
              setKnowledgeChecked(false);
            }}
          >
            {module.knowledgeCheck.options.map((option) => (
              <div key={option.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <RadioGroupItem value={option.id} id={`${module.title}-kc-${option.id}`} className="mt-1" />
                <Label htmlFor={`${module.title}-kc-${option.id}`} className="cursor-pointer text-sm text-slate-700">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => setKnowledgeChecked(true)}
              disabled={!selectedKnowledgeOption}
            >
              Check my answer
            </Button>
            {knowledgeChecked && knowledgeOutcome ? (
              <Alert variant={knowledgeOutcome.correct ? "default" : "destructive"} className="flex-1">
                <AlertTitle>{knowledgeOutcome.correct ? "Correct" : "Consider another response"}</AlertTitle>
                <AlertDescription className="text-sm">{knowledgeOutcome.explanation}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Scenario practice</h3>
            <p className="text-sm text-slate-600">{module.scenarioPractice.prompt}</p>
            {module.scenarioPractice.coachingNote ? (
              <p className="mt-2 text-xs text-slate-500">{module.scenarioPractice.coachingNote}</p>
            ) : null}
          </div>
          <RadioGroup
            value={selectedScenarioChoice ?? ""}
            onValueChange={(value) => setSelectedScenarioChoice(value)}
          >
            {module.scenarioPractice.choices.map((choice) => (
              <div key={choice.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <RadioGroupItem value={choice.id} id={`${module.title}-scenario-${choice.id}`} className="mt-1" />
                <Label htmlFor={`${module.title}-scenario-${choice.id}`} className="cursor-pointer text-sm text-slate-700">
                  {choice.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {scenarioOutcome ? (
            <Alert variant={scenarioOutcome.recommended ? "default" : "destructive"}>
              <AlertTitle>{scenarioOutcome.recommended ? "Recommended approach" : "Alternate approach"}</AlertTitle>
              <AlertDescription className="text-sm text-slate-600">{scenarioOutcome.rationale}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Reflection journal</h3>
            <p className="text-sm text-slate-600">{module.reflection.prompt}</p>
          </div>
          <ul className="space-y-2 text-xs text-slate-500">
            {module.reflection.guidance.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Textarea
            value={reflectionResponse}
            onChange={(event) => {
              setReflectionResponse(event.target.value);
              setCopied(false);
            }}
            placeholder="Capture insights, next steps, or support you need..."
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>{reflectionResponse.trim().length} characters</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!reflectionResponse.trim()) {
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(reflectionResponse);
                    setCopied(true);
                  } catch (error) {
                    console.error("Unable to copy reflection", error);
                  }
                }}
                disabled={!reflectionResponse.trim()}
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReflectionResponse("");
                  setCopied(false);
                }}
                disabled={!reflectionResponse}
              >
                Clear
              </Button>
            </div>
          </div>
        </section>

        {module.resourceLinks.length ? (
          <>
            <Separator />
            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Resource library</h3>
                <p className="text-sm text-slate-600">
                  Use these ready-to-train assets—slide decks, videos, articles, and templates—to facilitate live sessions
                  or assign pre-work. Links open in a new tab.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {module.resourceLinks.map((resource) => (
                  <div key={resource.title} className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {resource.type}
                        </Badge>
                        {resource.duration ? (
                          <span className="text-xs text-slate-500">{resource.duration}</span>
                        ) : null}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">{resource.title}</h4>
                      <p className="text-sm text-slate-600">{resource.description}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                      <Link href={resource.url} target="_blank" rel="noopener noreferrer">
                        Open resource
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
