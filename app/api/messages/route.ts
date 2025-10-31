import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { serializeDirectMessage, listDirectMessages, sendDirectMessage } from "@/lib/messages/server";
import { sendDirectMessageSchema } from "@/lib/messages/validators";
import { resolveUserSummary } from "@/lib/social/server/user-summary";

function handleError(error: unknown) {
    if (error && typeof error === "object" && "flatten" in error) {
        return NextResponse.json(
            {
                error: "Invalid request.",
                details: (error as { flatten: () => unknown }).flatten(),
            },
            { status: 422 }
        );
    }

    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = error instanceof Error && /cannot send a message to yourself/i.test(error.message) ? 400 : 500;

    return NextResponse.json(
        {
            error: message,
        },
        { status }
    );
}

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const url = new URL(request.url);
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? Number.parseInt(limitParam, 10) || undefined : undefined;

        const messages = await listDirectMessages({
            userId,
            limit,
        });

        return NextResponse.json({
            messages: messages.map(serializeDirectMessage),
        });
    } catch (error) {
        return handleError(error);
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await request.json();
        const parsed = sendDirectMessageSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid request.",
                    details: parsed.error.flatten(),
                },
                { status: 422 }
            );
        }

        const sender = await resolveUserSummary(userId);
        const message = await sendDirectMessage({
            sender,
            recipientId: parsed.data.recipientId,
            content: parsed.data.content,
        });

        return NextResponse.json(
            {
                message: serializeDirectMessage(message),
            },
            { status: 201 }
        );
    } catch (error) {
        return handleError(error);
    }
}
