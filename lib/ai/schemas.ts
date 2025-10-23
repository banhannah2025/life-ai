import { z } from "zod";

import type { GroqChatMessage, GroqModelId } from "./groq";
import { AVAILABLE_GROQ_MODELS } from "./groq";

const modelIds = AVAILABLE_GROQ_MODELS.map((model) => model.id);

export const codexChatRequestSchema = z.object({
  model: z.enum(modelIds as [GroqModelId, ...GroqModelId[]]).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().max(65536).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"] as const),
        content: z.string().min(1).max(40000),
      }),
    )
    .min(1),
});

export type CodexChatRequest = z.infer<typeof codexChatRequestSchema>;

export function sanitizeMessages(messages: GroqChatMessage[]): GroqChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content.replace(/\u0000/g, " "),
  }));
}

