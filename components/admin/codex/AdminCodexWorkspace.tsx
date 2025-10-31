"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Loader2 } from "lucide-react";

import {
  AVAILABLE_GROQ_MODELS,
  DEFAULT_GROQ_MODEL,
  type GroqChatMessage,
  type GroqModelId,
} from "@/lib/ai/groq";
import type { AssistantWebResult } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type CodexMessage = GroqChatMessage & {
  id: string;
  createdAt: number;
  pending?: boolean;
  error?: boolean;
  webResults?: AssistantWebResult[];
};

type GroqUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
} | null;

const DEFAULT_SYSTEM_PROMPT = [
  "You are Life-AI Codex, the in-house engineering assistant for the Life-AI organization.",
  "You specialize in the Life-AI Next.js, TypeScript, and Tailwind stack.",
  "Provide responses that are safe, actionable, and aligned with existing patterns in this repository.",
  "Explain risks before suggesting commands that modify state or run destructive Git operations.",
  "Prefer concise code samples using fenced blocks and include reasoning when the change is complex.",
].join(" ");

const API_ENDPOINT = "/api/admin/codex/chat";

function createMessage(role: CodexMessage["role"], content: string, overrides?: Partial<CodexMessage>): CodexMessage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    role,
    content,
    createdAt: Date.now(),
    ...overrides,
  };
}

export function AdminCodexWorkspace() {
  const [model, setModel] = useState<GroqModelId>(DEFAULT_GROQ_MODEL);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [messages, setMessages] = useState<CodexMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<GroqUsage>(null);
  const [useWebSearch, setUseWebSearch] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasConversation = messages.length > 0;

  const modelOptions = useMemo(() => AVAILABLE_GROQ_MODELS, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const conversationHistory: GroqChatMessage[] = [
      ...(systemPrompt.trim()
        ? [
            {
              role: "system" as const,
              content: systemPrompt.trim(),
            },
          ]
        : []),
      ...messages
        .filter((message) => !message.pending && !message.error)
        .map<GroqChatMessage>((message) => ({
          role: message.role,
          content: message.content,
        })),
      {
        role: "user",
        content: trimmed,
      },
    ];

    const userMessage = createMessage("user", trimmed);
    const assistantPlaceholder = createMessage("assistant", "Thinking…", { pending: true });

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: conversationHistory,
          useWebSearch,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = typeof body?.error === "string" ? body.error : "Groq request failed.";
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantPlaceholder.id
              ? {
                  ...message,
                  content: errorMessage,
                  pending: false,
                  error: true,
                }
              : message,
          ),
        );
        setError(errorMessage);
        setUsage(null);
        return;
      }

      const content = typeof body?.content === "string" ? body.content.trim() : "";
      const assistantContent = content || "No response received.";

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholder.id
            ? {
                ...message,
                content: assistantContent,
                pending: false,
                webResults: Array.isArray(body?.webResults) ? body.webResults : undefined,
              }
            : message,
        ),
      );
      setUsage(body?.usage ?? null);
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error ? requestError.message : "Unexpected error contacting Groq.";
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholder.id
            ? {
                ...message,
                content: errorMessage,
                pending: false,
                error: true,
                webResults: undefined,
              }
            : message,
        ),
      );
      setError(errorMessage);
      setUsage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetConversation() {
    setMessages([]);
    setUsage(null);
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Conversation</CardTitle>
            <p className="text-sm text-slate-500">
              Chat with Groq models, request diffs, and iterate on Life-AI code changes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={model} onValueChange={(value) => setModel(value as GroqModelId)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
              <Switch
                id="codex-live-search"
                checked={useWebSearch}
                onCheckedChange={(value) => setUseWebSearch(!!value)}
              />
              <Label
                htmlFor="codex-live-search"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                Live web search
              </Label>
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetConversation} disabled={!hasConversation}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={scrollRef} className="h-[520px] space-y-4 overflow-y-auto p-6">
            {!messages.length ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                <p className="font-medium text-slate-600">Start a new request</p>
                <p className="mt-2 max-w-md">
                  Ask Life-AI Codex to summarize files, propose refactors, draft tests, or review Git diffs. Share
                  relevant context so the assistant can ground its answer.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={message.role === "user" ? "default" : message.error ? "destructive" : "secondary"}>
                      {message.role === "assistant" ? "Codex" : "Admin"}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(message.createdAt).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.pending ? <span className="text-xs text-blue-500">Drafting…</span> : null}
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 shadow-sm",
                      message.role === "user" ? "bg-slate-900 text-slate-100 shadow" : "",
                      message.error ? "border-red-200 bg-red-50 text-red-700" : "",
                    )}
                  >
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm">{message.content}</pre>
                  </div>
                  {message.webResults && message.webResults.length ? (
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold uppercase tracking-wide text-slate-500">Live sources</p>
                      <ul className="space-y-1">
                        {message.webResults.map((result, index) => (
                          <li key={`${result.title}-${index}`} className="space-y-0.5">
                            <div className="font-medium text-slate-700">
                              [{index + 1}] {result.title}
                            </div>
                            {result.snippet ? <p>{result.snippet}</p> : null}
                            {result.url ? (
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                {result.url}
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-slate-100 bg-slate-50 p-6">
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="codex-input" className="text-sm font-medium text-slate-700">
                Prompt
              </Label>
              <Textarea
                id="codex-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Describe the change, share relevant paths, or paste code to review…"
                rows={4}
              />
            </div>
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            ) : null}
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400" />
                {useWebSearch ? "Live search enabled for this turn" : "Live search paused"}
              </div>
              <div>
                {usage ? (
                  <span>
                    Prompt {usage.prompt_tokens ?? 0} tok · Completion {usage.completion_tokens ?? 0} tok · Total{" "}
                    {usage.total_tokens ?? 0} tok
                  </span>
                ) : (
                  <span>Select a model and ask for help with your next change.</span>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="sm:ml-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Send to Codex"
                )}
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>

      <Card className="h-fit border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Session Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-slate-600">
          <div className="space-y-2">
            <Label htmlFor="codex-system-prompt" className="text-sm font-medium text-slate-700">
              System prompt
            </Label>
            <Textarea
              id="codex-system-prompt"
              rows={8}
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
            />
            <p className="text-xs text-slate-500">
              Customize how Codex responds. Keep instructions grounded in Life-AI&apos;s architecture and safety
              guidelines.
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Model guidance</h3>
              <p className="text-xs text-slate-500">
                The 70B versatile model offers the best balance for code reasoning. Drop to the 8B instant model for quick
                iterations, or escalate to GPT-OSS 120B when you need deeper architectural insight.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-500">
              {modelOptions.map((item) => (
                <li key={item.id} className={cn("rounded-md border border-slate-200 p-3", model === item.id ? "border-blue-400 bg-blue-50 text-blue-900" : "")}>
                  <div className="font-medium text-slate-700">{item.label}</div>
                  <div>{item.description}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                    <span>Context {Math.round(item.tokenContext / 1024)}k tokens</span>
                    <span>~{Math.round(item.tokenLimitPerMinute / 1000)}k TPM</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
