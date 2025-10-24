"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Loader2, RefreshCw, Sparkles, Wand2, Copy, Trash2, PanelRightClose, PanelRightOpen } from "lucide-react";
import { toast } from "sonner";

import { AVAILABLE_GROQ_MODELS, DEFAULT_GROQ_MODEL, type GroqModelId } from "@/lib/ai/groq";
import type { AssistantWebResult } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  error?: boolean;
  createdAt: number;
  webResults?: AssistantWebResult[];
};

const API_ENDPOINT = "/api/assistant/chat";

const quickPrompts = [
  "Create a launch checklist for our restorative justice cohort.",
  "Summarize the latest status of our community cases and suggest next steps.",
  "Draft an outreach email inviting partners to our upcoming training.",
  "Brainstorm a facilitation plan that blends scripture, trauma care, and policy reminders.",
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function AiInput() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content: "Hi! I’m Life-AI Copilot. Ask me anything—from drafting letters to brainstorming facilitation plans.",
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [canvas, setCanvas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [model, setModel] = useState<GroqModelId>(DEFAULT_GROQ_MODEL);
  const [error, setError] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasConversation = messages.length > 1;

  const conversationHistory = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages],
  );

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };

    const assistantPlaceholder: ChatMessage = {
      id: createId(),
      role: "assistant",
      content: "Thinking…",
      createdAt: Date.now(),
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");

    try {
      const body = {
        model,
        messages: [...conversationHistory, { role: "user" as const, content: trimmed }],
        useWebSearch,
      };

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = typeof payload?.error === "string" ? payload.error : "Unable to contact Copilot.";
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantPlaceholder.id
              ? { ...message, content: errorMessage, pending: false, error: true }
              : message,
          ),
        );
        setError(errorMessage);
        return;
      }

      const assistantContent = typeof payload?.content === "string" ? payload.content.trim() : "No response received.";
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholder.id
            ? {
                ...message,
                content: assistantContent,
                pending: false,
                webResults: Array.isArray(payload?.webResults) ? payload.webResults : [],
              }
            : message,
        ),
      );
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error ? requestError.message : "Unexpected error contacting Copilot.";
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantPlaceholder.id
            ? { ...message, content: errorMessage, pending: false, error: true }
            : message,
        ),
      );
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetConversation() {
    setMessages((prev) => [prev[0]]);
    setError(null);
  }

  function handleCanvasCopy() {
    if (!canvas.trim()) {
      return;
    }
    navigator.clipboard
      ?.writeText(canvas)
      .then(() => toast.success("Canvas copied to clipboard"))
      .catch(() => toast.error("Unable to copy canvas right now."));
  }

  return (
    <div className="flex h-full w-full flex-col bg-slate-950/5">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 py-4">
        <div className="flex flex-1 gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <Switch checked={useWebSearch} onCheckedChange={(checked) => setUseWebSearch(!!checked)} id="toggle-web" />
                <Label htmlFor="toggle-web" className="text-sm text-slate-600">
                  Live web search
                </Label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={model} onValueChange={(value: GroqModelId) => setModel(value)}>
                  <SelectTrigger className="w-[200px] bg-white/80">
                    <SelectValue placeholder="Groq model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_GROQ_MODELS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleResetConversation} disabled={messages.length <= 1}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  type="button"
                  variant={showCanvas ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCanvas((prev) => !prev)}
                >
                  {showCanvas ? <PanelRightClose className="mr-2 h-4 w-4" /> : <PanelRightOpen className="mr-2 h-4 w-4" />}
                  {showCanvas ? "Hide canvas" : "Canvas"}
                </Button>
              </div>
            </div>
            <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex w-full", message.role === "assistant" ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-sm",
                      message.role === "assistant"
                        ? "border-slate-200 bg-white text-slate-900"
                        : "border-emerald-200 bg-emerald-600 text-white",
                      message.error ? "border-rose-200 bg-rose-50 text-rose-900" : "",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                      <Badge
                        variant={message.role === "assistant" ? "outline" : "secondary"}
                        className={cn(
                          "border-slate-200 text-xs",
                          message.role === "assistant" ? "text-slate-600" : "border-emerald-400 bg-emerald-500 text-white",
                        )}
                      >
                        {message.role === "assistant" ? "Copilot" : "You"}
                      </Badge>
                      <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                      {message.pending ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking
                        </span>
                      ) : null}
                    </div>
                    <div className="whitespace-pre-line leading-relaxed">{message.content}</div>
                    {message.webResults && message.webResults.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-600">
                        <p className="mb-1 font-semibold text-slate-800">Sources</p>
                        <ul className="space-y-1">
                          {message.webResults.map((result, index) => (
                            <li key={`${result.title}-${index}`}>
                              [{index + 1}] {result.title}{" "}
                              {result.url ? (
                                <a className="text-emerald-600 underline" href={result.url} target="_blank" rel="noreferrer">
                                  {result.url}
                                </a>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {!hasConversation ? (
                <div className="flex flex-wrap gap-3">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white/90 p-4">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Message Copilot…"
                className="min-h-[72px] resize-none border-none bg-transparent text-base focus-visible:ring-0"
              />
              {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
              <div className="mt-3 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  {useWebSearch ? "Using live search for this turn" : "Live search paused"}
                </div>
                <Button type="submit" disabled={isSubmitting} className="self-end sm:self-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {showCanvas ? (
            <Card className="hidden h-full w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm sm:flex sm:w-80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Wand2 className="h-4 w-4 text-emerald-500" />
                    Canvas
                  </CardTitle>
                  <p className="text-xs text-slate-500">Capture notes alongside chat.</p>
                </div>
                <Badge variant="outline" className="text-[10px] text-slate-500">
                  Beta
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <Textarea
                  value={canvas}
                  onChange={(event) => setCanvas(event.target.value)}
                  placeholder="Use the canvas like a scratchpad for bullets, pseudo-code, or timelines."
                  className="flex-1 resize-none"
                />
                <div className="flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCanvas("")} disabled={!canvas.trim()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleCanvasCopy} disabled={!canvas.trim()}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
