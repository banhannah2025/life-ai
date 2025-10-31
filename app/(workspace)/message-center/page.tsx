import { auth } from "@clerk/nextjs/server";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { listDirectMessages } from "@/lib/messages/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function MessageCenterPage() {
    const { userId } = await auth();

    if (!userId) {
        return (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                <header className="space-y-2">
                    <h1 className="text-2xl font-semibold text-slate-900">Message center</h1>
                    <p className="text-sm text-slate-500">Sign in to read or send direct messages with your workspace connections.</p>
                </header>
                <div className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                    <p className="text-sm text-slate-600">
                        You need an account to access direct messages.{" "}
                        <Link href="/sign-in" className="font-medium text-slate-700 underline-offset-4 hover:underline">
                            Sign in
                        </Link>{" "}
                        or{" "}
                        <Link href="/sign-up" className="font-medium text-slate-700 underline-offset-4 hover:underline">
                            create an account
                        </Link>{" "}
                        to get started.
                    </p>
                </div>
            </div>
        );
    }

    let messages: Awaited<ReturnType<typeof listDirectMessages>> = [];
    let loadError: string | null = null;

    try {
        messages = await listDirectMessages({ userId, limit: 60 });
    } catch (error) {
        console.error("Failed to load direct messages", error);
        loadError = error instanceof Error ? error.message : "Unable to load messages.";
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900">Message center</h1>
                <p className="text-sm text-slate-500">Review private conversations with your workspace connections. Use the sidebar message center to send a new note anytime.</p>
            </header>

            {loadError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 shadow-sm">
                    <p>We couldn’t load your messages right now. Please try again in a moment.</p>
                </div>
            ) : !messages.length ? (
                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-6 text-center shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Inbox</h2>
                        <p className="mt-2 text-sm text-slate-500">No incoming messages yet.</p>
                    </div>
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-6 text-center shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Outbox</h2>
                        <p className="mt-2 text-sm text-slate-500">You haven’t sent any messages yet.</p>
                    </div>
                </section>
            ) : (
                <ul className="space-y-4">
                    {messages.map((message) => {
                        const isSender = message.sender.id === userId;
                        const counterpart = isSender ? message.recipient : message.sender;
                        const directionLabel = isSender ? `You → ${counterpart.name}` : `${counterpart.name} → You`;

                        return (
                            <li key={message.id} className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            {counterpart.avatarUrl ? <AvatarImage src={counterpart.avatarUrl} alt={counterpart.name} /> : null}
                                            <AvatarFallback className="text-sm font-semibold uppercase">
                                                {counterpart.name
                                                    .split(" ")
                                                    .map((part) => part.charAt(0))
                                                    .join("")
                                                    .slice(0, 2) || "DM"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{counterpart.name}</p>
                                            <p className="text-xs text-slate-400">{directionLabel}</p>
                                        </div>
                                    </div>
                                    <time
                                        dateTime={message.createdAt.toISOString()}
                                        className="text-xs font-medium uppercase tracking-wide text-slate-400"
                                        suppressHydrationWarning
                                    >
                                        {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                                    </time>
                                </div>
                                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{message.content}</p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
