"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { FilePlus, Loader2, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  title: string;
  content: string;
  notes: string;
};

export type SlideDeck = {
  slides: Slide[];
};

const createId = () => `slide-${Math.random().toString(36).slice(2, 10)}`;

const DEFAULT_DECK: SlideDeck = {
  slides: [
    {
      id: createId(),
      title: "New Slide",
      content: "Add your slide content here…",
      notes: "",
    },
  ],
};

function normalizeDeck(deck: SlideDeck | null | undefined): SlideDeck {
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    return DEFAULT_DECK;
  }

  const slides = deck.slides.map((slide) => ({
    id: slide.id || createId(),
    title: slide.title ?? "Untitled slide",
    content: slide.content ?? "",
    notes: slide.notes ?? "",
  }));

  return { slides };
}

type Status = "idle" | "saving" | "saved" | "error";

export function SlideEditor({ documentId, initialDeck }: { documentId: string; initialDeck: SlideDeck | null }) {
  const [deck, setDeck] = useState<SlideDeck>(() => normalizeDeck(initialDeck));
  const [currentSlideId, setCurrentSlideId] = useState(deck.slides[0]?.id ?? createId());
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const persistDeck = useCallback(
    async (payload: SlideDeck) => {
      try {
        setStatus("saving");
        setError(null);
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: JSON.stringify(payload) }),
        });

        if (!response.ok) {
          const message = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(message?.error ?? "Failed to save deck");
        }

        setStatus("saved");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to save deck");
      }
    },
    [documentId],
  );

  const saveDeck = useDebouncedCallback((payload: SlideDeck) => {
    void persistDeck(payload);
  }, 800);

  const queueSave = (next: SlideDeck) => {
    saveDeck(next);
  };

  const updateDeck = (updater: (prev: SlideDeck) => SlideDeck) => {
    let nextDeck: SlideDeck = DEFAULT_DECK;
    setDeck((prev) => {
      const next = normalizeDeck(updater(prev));
      nextDeck = next;
      queueSave(next);
      return next;
    });
    return nextDeck;
  };

  const currentSlide = deck.slides.find((slide) => slide.id === currentSlideId) ?? deck.slides[0];

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: createId(),
      title: "New Slide",
      content: "",
      notes: "",
    };
    const nextDeck = updateDeck((prev) => {
      const slides = [...prev.slides, newSlide];
      return { slides };
    });
    setCurrentSlideId(nextDeck.slides[nextDeck.slides.length - 1]?.id ?? newSlide.id);
  };

  const handleRemoveSlide = (id: string) => {
    const nextDeck = updateDeck((prev) => {
      const slides = prev.slides.filter((slide) => slide.id !== id);
      return slides.length ? { slides } : normalizeDeck(null);
    });

    if (currentSlideId === id) {
      setCurrentSlideId(nextDeck.slides[0]?.id ?? createId());
    }
  };

  const handleSlideChange = (id: string, fields: Partial<Slide>) => {
    updateDeck((prev) => {
      const slides = prev.slides.map((slide) => (slide.id === id ? { ...slide, ...fields } : slide));
      return { slides };
    });
  };

  const handleManualSave = async () => {
    setLoading(true);
    await persistDeck(deck);
    setLoading(false);
  };

  const footerMessage = useMemo(() => {
    if (status === "saving") {
      return "Saving…";
    }
    if (status === "saved") {
      return "All changes saved";
    }
    if (status === "error") {
      return error ?? "Failed to save";
    }
    return "Changes will save automatically";
  }, [status, error]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-slate-900">Slide editor</CardTitle>
        <Button variant="outline" size="sm" onClick={handleManualSave} disabled={loading || status === "saving"}>
          {loading || status === "saving" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving
            </span>
          ) : (
            "Save now"
          )}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row">
        <aside className="flex w-full flex-shrink-0 flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 md:w-64">
          <Button type="button" variant="secondary" size="sm" onClick={handleAddSlide} className="justify-start">
            <FilePlus className="mr-2 h-4 w-4" />
            Add slide
          </Button>
          <div className="flex flex-col gap-2 overflow-y-auto">
            {deck.slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlideId(slide.id)}
                className={cn(
                  "flex items-start justify-between rounded-md border px-3 py-2 text-left text-xs font-medium transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                  slide.id === currentSlide?.id ? "border-slate-400 bg-white shadow-sm" : "border-transparent bg-slate-100/70"
                )}
              >
                <span className="mr-2 line-clamp-2 text-slate-700">
                  {index + 1}. {slide.title || "Untitled"}
                </span>
                {deck.slides.length > 1 ? (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveSlide(slide.id);
                    }}
                    className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                    aria-label={`Delete slide ${slide.title}`}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </aside>
        {currentSlide ? (
          <section className="flex-1 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Slide title</label>
              <Input
                value={currentSlide.title}
                onChange={(event) => handleSlideChange(currentSlide.id, { title: event.target.value })}
                className="h-10 text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Slide content</label>
              <Textarea
                value={currentSlide.content}
                onChange={(event) => handleSlideChange(currentSlide.id, { content: event.target.value })}
                className="min-h-48"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Presenter notes</label>
              <Textarea
                value={currentSlide.notes}
                onChange={(event) => handleSlideChange(currentSlide.id, { notes: event.target.value })}
                className="min-h-32"
              />
            </div>
          </section>
        ) : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-slate-500">
        <span>{footerMessage}</span>
        {status === "error" ? <span className="text-rose-500">{error}</span> : null}
      </CardFooter>
    </Card>
  );
}
