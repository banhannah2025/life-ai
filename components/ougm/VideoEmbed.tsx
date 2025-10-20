"use client";

import Link from "next/link";

type VideoEmbedProps = {
  embedUrl: string;
  title: string;
  watchUrl?: string;
  className?: string;
};

function buildWatchUrl(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/embed/")) {
      const videoId = url.pathname.split("/").pop();
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
    if (url.hostname.includes("player.vimeo.com") && url.pathname.startsWith("/video/")) {
      const videoId = url.pathname.split("/").pop();
      if (videoId) {
        return `https://vimeo.com/${videoId}`;
      }
    }
    return embedUrl;
  } catch {
    return null;
  }
}

export function VideoEmbed({ embedUrl, title, watchUrl, className }: VideoEmbedProps) {
  const fallbackUrl = watchUrl ?? buildWatchUrl(embedUrl);

  return (
    <div className={className}>
      <div className="aspect-video overflow-hidden rounded-lg border border-slate-200">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
      {fallbackUrl ? (
        <p className="pt-2 text-xs text-slate-500">
          Having trouble playing the video?{" "}
          <Link
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
          >
            Open it in a new tab
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
