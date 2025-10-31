"use client";

import { useEffect, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type SlidePoint = {
  text: string;
  helper?: string;
};

export type SlideHighlight = {
  title: string;
  description: string;
};

export type SlideContent = {
  title: string;
  subtitle?: string;
  description?: string;
  points?: SlidePoint[];
  highlights?: SlideHighlight[];
  scripture?: {
    reference: string;
    text: string;
  };
  footerNote?: string;
};

type SlideDeckProps = {
  slides: SlideContent[];
  accentLabel?: string;
  className?: string;
};

export function SlideDeck({ slides, accentLabel = "OUGM Training", className }: SlideDeckProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const totalSlides = slides.length;
  const currentSlideNumber = current + 1;
  const progress = Math.round((currentSlideNumber / totalSlides) * 100);

  if (!totalSlides) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
          {accentLabel}
        </Badge>
        <span className="text-xs text-slate-500">
          Slide {currentSlideNumber} of {totalSlides}
        </span>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        setApi={setApi}
        className="relative"
      >
        <CarouselContent className="-ml-2">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.title} className="pl-2 md:basis-full">
              <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex h-full flex-col gap-6">
                  <header className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Slide {index + 1}
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{slide.title}</h3>
                    {slide.subtitle ? (
                      <p className="text-sm font-medium text-emerald-700">{slide.subtitle}</p>
                    ) : null}
                    {slide.description ? (
                      <p className="text-sm text-slate-600 sm:text-base">{slide.description}</p>
                    ) : null}
                  </header>

                  {slide.points?.length ? (
                    <ul className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700 sm:text-base">
                      {slide.points.map((point) => (
                        <li key={point.text}>
                          <span className="font-medium text-slate-900">{point.text}</span>
                          {point.helper ? (
                            <p className="text-xs font-normal text-slate-500">{point.helper}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {slide.highlights?.length ? (
                    <div className="grid gap-3 lg:grid-cols-3">
                      {slide.highlights.map((highlight) => (
                        <div
                          key={highlight.title}
                          className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900"
                        >
                          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                            {highlight.title}
                          </p>
                          <p className="text-sm">{highlight.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {slide.scripture ? (
                    <blockquote className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm italic text-amber-900">
                      <p className="text-base leading-relaxed">&ldquo;{slide.scripture.text}&rdquo;</p>
                      <footer className="mt-2 text-xs font-semibold not-italic text-amber-600">
                        {slide.scripture.reference}
                      </footer>
                    </blockquote>
                  ) : null}

                  {slide.footerNote ? (
                    <>
                      <Separator className="border-dashed" />
                      <p className="text-xs text-slate-500">{slide.footerNote}</p>
                    </>
                  ) : null}
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 border-slate-300 bg-white/90 text-slate-700 hover:bg-white" />
        <CarouselNext className="right-2 border-slate-300 bg-white/90 text-slate-700 hover:bg-white" />
      </Carousel>

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500">{progress}%</span>
      </div>
    </div>
  );
}
