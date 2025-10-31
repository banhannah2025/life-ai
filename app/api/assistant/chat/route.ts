import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { assistantChatRequestSchema, sanitizeMessages, type AssistantWebResult } from "@/lib/ai/schemas";
import { createGroqChatCompletion, DEFAULT_GROQ_MODEL, type GroqChatMessage } from "@/lib/ai/groq";
import { searchDuckDuckGo } from "@/lib/websearch/duckduckgo";

const SYSTEM_PROMPT = [
  "You are Life-AI Copilot, a multidisciplinary assistant for legal, community, and operational work.",
  "Respond with clear, structured answers that cite web sources using square brackets like [1] where applicable.",
  "When appropriate, outline actionable next steps and reference the shared canvas for brainstorming ideas.",
  "If information is unavailable, be honest and suggest alternative approaches.",
].join(" ");

type ParsedBody = {
  model?: Parameters<typeof createGroqChatCompletion>[0]["model"];
  messages: GroqChatMessage[];
  webResults?: AssistantWebResult[];
  useWebSearch?: boolean;
};

type LiveTimeResult = {
  label: string;
  timeZone: string;
};

const CITY_TIMEZONE_MAP: LiveTimeResult[] = [
  { label: "Olympia, Washington", timeZone: "America/Los_Angeles" },
  { label: "Seattle, Washington", timeZone: "America/Los_Angeles" },
  { label: "Portland, Oregon", timeZone: "America/Los_Angeles" },
  { label: "San Francisco, California", timeZone: "America/Los_Angeles" },
  { label: "Los Angeles, California", timeZone: "America/Los_Angeles" },
  { label: "San Diego, California", timeZone: "America/Los_Angeles" },
  { label: "Phoenix, Arizona", timeZone: "America/Phoenix" },
  { label: "Denver, Colorado", timeZone: "America/Denver" },
  { label: "Salt Lake City, Utah", timeZone: "America/Denver" },
  { label: "Las Vegas, Nevada", timeZone: "America/Los_Angeles" },
  { label: "Dallas, Texas", timeZone: "America/Chicago" },
  { label: "Houston, Texas", timeZone: "America/Chicago" },
  { label: "Chicago, Illinois", timeZone: "America/Chicago" },
  { label: "Minneapolis, Minnesota", timeZone: "America/Chicago" },
  { label: "Atlanta, Georgia", timeZone: "America/New_York" },
  { label: "Miami, Florida", timeZone: "America/New_York" },
  { label: "New York City, New York", timeZone: "America/New_York" },
  { label: "Boston, Massachusetts", timeZone: "America/New_York" },
  { label: "Philadelphia, Pennsylvania", timeZone: "America/New_York" },
  { label: "Washington, D.C.", timeZone: "America/New_York" },
  { label: "London, United Kingdom", timeZone: "Europe/London" },
  { label: "Paris, France", timeZone: "Europe/Paris" },
  { label: "Berlin, Germany", timeZone: "Europe/Berlin" },
  { label: "Rome, Italy", timeZone: "Europe/Rome" },
  { label: "Madrid, Spain", timeZone: "Europe/Madrid" },
  { label: "Toronto, Canada", timeZone: "America/Toronto" },
  { label: "Vancouver, Canada", timeZone: "America/Vancouver" },
  { label: "Sydney, Australia", timeZone: "Australia/Sydney" },
  { label: "Melbourne, Australia", timeZone: "Australia/Melbourne" },
  { label: "Tokyo, Japan", timeZone: "Asia/Tokyo" },
  { label: "Singapore", timeZone: "Asia/Singapore" },
  { label: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  { label: "Beijing, China", timeZone: "Asia/Shanghai" },
  { label: "Seoul, South Korea", timeZone: "Asia/Seoul" },
  { label: "New Delhi, India", timeZone: "Asia/Kolkata" },
  { label: "Dubai, United Arab Emirates", timeZone: "Asia/Dubai" },
  { label: "Auckland, New Zealand", timeZone: "Pacific/Auckland" },
];

const STATE_TIMEZONE_MAP: Record<string, string> = {
  alaska: "America/Anchorage",
  alabama: "America/Chicago",
  arizona: "America/Phoenix",
  arkansas: "America/Chicago",
  california: "America/Los_Angeles",
  colorado: "America/Denver",
  connecticut: "America/New_York",
  delaware: "America/New_York",
  florida: "America/New_York",
  georgia: "America/New_York",
  hawaii: "Pacific/Honolulu",
  idaho: "America/Boise",
  illinois: "America/Chicago",
  indiana: "America/Indiana/Indianapolis",
  iowa: "America/Chicago",
  kansas: "America/Chicago",
  kentucky: "America/New_York",
  louisiana: "America/Chicago",
  maine: "America/New_York",
  maryland: "America/New_York",
  massachusetts: "America/New_York",
  michigan: "America/Detroit",
  minnesota: "America/Chicago",
  mississippi: "America/Chicago",
  missouri: "America/Chicago",
  montana: "America/Denver",
  nebraska: "America/Chicago",
  nevada: "America/Los_Angeles",
  "new hampshire": "America/New_York",
  "new jersey": "America/New_York",
  "new mexico": "America/Denver",
  "new york": "America/New_York",
  "north carolina": "America/New_York",
  "north dakota": "America/Chicago",
  ohio: "America/New_York",
  oklahoma: "America/Chicago",
  oregon: "America/Los_Angeles",
  pennsylvania: "America/New_York",
  "rhode island": "America/New_York",
  "south carolina": "America/New_York",
  "south dakota": "America/Chicago",
  tennessee: "America/Chicago",
  texas: "America/Chicago",
  utah: "America/Denver",
  vermont: "America/New_York",
  virginia: "America/New_York",
  washington: "America/Los_Angeles",
  "west virginia": "America/New_York",
  wisconsin: "America/Chicago",
  wyoming: "America/Denver",
};

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function detectLocationsForTime(text: string): LiveTimeResult[] {
  const normalized = normalizeWhitespace(text).toLowerCase();
  const matches = new Map<string, LiveTimeResult>();

  for (const entry of CITY_TIMEZONE_MAP) {
    const keyword = entry.label.toLowerCase();
    if (normalized.includes(keyword)) {
      matches.set(entry.timeZone, entry);
    }
  }

  for (const [state, timeZone] of Object.entries(STATE_TIMEZONE_MAP)) {
    const titleCase = `${state[0].toUpperCase()}${state.slice(1)}`;
    const pattern = new RegExp(`(?:\\b|,)${state.replace(/ /g, "\\s+")}\\b`);
    if (pattern.test(normalized) && !matches.has(timeZone)) {
      matches.set(timeZone, { label: titleCase, timeZone });
    }
  }

  if (!matches.size) {
    matches.set("UTC", { label: "Coordinated Universal Time", timeZone: "UTC" });
  }

  return Array.from(matches.values());
}

function shouldProvideLiveTime(text: string): boolean {
  const lowered = text.toLowerCase();
  const timeKeywords = ["current time", "time in", "time at", "what time", "date and time", "time right now", "current date"];
  const matchedKeyword = timeKeywords.some((keyword) => lowered.includes(keyword));
  if (matchedKeyword) {
    return true;
  }
  return /\bcurrent\b/.test(lowered) && /\btime|date\b/.test(lowered);
}

function formatTimeForZone(zone: LiveTimeResult): { title: string; snippet: string } {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone.timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone.timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const dateString = dateFormatter.format(now);
  const timeString = timeFormatter.format(now);
  const abbrParts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone.timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
    .formatToParts(now)
    .filter((part) => part.type === "timeZoneName")
    .map((part) => part.value);
  const tzAbbr = abbrParts[0] ?? "";

  const zonedAsLocal = new Date(now.toLocaleString("en-US", { timeZone: zone.timeZone }));
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMinutes = Math.round((zonedAsLocal.getTime() - utcDate.getTime()) / 60000);
  const offsetPrefix = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
    .toString()
    .padStart(2, "0");
  const offsetMins = Math.abs(offsetMinutes % 60)
    .toString()
    .padStart(2, "0");

  const title = `${zone.label} – ${timeString} ${tzAbbr}`;
  const snippet = `${dateString}, ${timeString} (${tzAbbr}, UTC${offsetPrefix}${offsetHours}:${offsetMins})`;

  return { title, snippet };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = assistantChatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const body: ParsedBody = parsed.data;
  const sanitizedMessages = sanitizeMessages(body.messages);
  const lastUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === "user");

  let webResults: AssistantWebResult[] = body.webResults ?? [];
  if ((body.useWebSearch ?? true) && webResults.length === 0 && lastUserMessage) {
    try {
      webResults = await searchDuckDuckGo(lastUserMessage.content, 5);
    } catch (error) {
      console.error("Live web search failed", error);
    }
  }

  if ((body.useWebSearch ?? true) && lastUserMessage && shouldProvideLiveTime(lastUserMessage.content)) {
    const timeMatches = detectLocationsForTime(lastUserMessage.content);
    const timeResults = timeMatches.map((match) => {
      const formatted = formatTimeForZone(match);
      return {
        title: formatted.title,
        snippet: formatted.snippet,
        url: `https://time.is/${encodeURIComponent(match.label.replace(/,/g, ""))}`,
        source: "Life-AI Time Service",
      } satisfies AssistantWebResult;
    });
    webResults = [...timeResults, ...webResults];
  }

  const searchSummary = webResults.length
    ? [
        {
          role: "system" as const,
          content: [
            "Live web search results:",
            webResults
              .map((result, index) => {
                const parts = [`[${index + 1}] ${result.title}`];
                if (result.url) {
                  parts.push(result.url);
                }
                if (result.snippet) {
                  parts.push(result.snippet);
                }
                return parts.join(" — ");
              })
              .join("\n"),
            "Cite sources inline using [number].",
          ].join("\n"),
        },
      ]
    : [];

  const conversation: GroqChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...sanitizedMessages,
    ...searchSummary,
  ];

  try {
    const completion = await createGroqChatCompletion({
      model: body.model ?? DEFAULT_GROQ_MODEL,
      messages: conversation,
      temperature: 0.3,
    });

    return NextResponse.json({
      content: completion.content,
      webResults,
      model: body.model ?? DEFAULT_GROQ_MODEL,
    });
  } catch (error) {
    console.error("Assistant chat error", error);
    const message = error instanceof Error ? error.message : "Assistant request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
