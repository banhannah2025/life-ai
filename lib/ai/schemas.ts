import { z } from "zod";

import type { GroqChatMessage, GroqModelId } from "./groq";
import { AVAILABLE_GROQ_MODELS } from "./groq";

const modelIds = AVAILABLE_GROQ_MODELS.map((model) => model.id);

const groqMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"] as const),
  content: z.string().min(1).max(40000),
});

const webResultSchema = z.object({
  title: z.string().min(1).max(400),
  snippet: z.string().max(6000).optional().default(""),
  url: z.string().url().optional(),
  source: z.string().max(200).optional(),
});

export const codexChatRequestSchema = z.object({
  model: z.enum(modelIds as [GroqModelId, ...GroqModelId[]]).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().max(65536).optional(),
  messages: z.array(groqMessageSchema).min(1),
  webResults: z.array(webResultSchema).max(8).optional(),
  useWebSearch: z.boolean().optional(),
});

export type CodexChatRequest = z.infer<typeof codexChatRequestSchema>;

export const assistantChatRequestSchema = z.object({
  model: z.enum(modelIds as [GroqModelId, ...GroqModelId[]]).optional(),
  messages: z.array(groqMessageSchema).min(1),
  webResults: z.array(webResultSchema).max(8).optional(),
  useWebSearch: z.boolean().optional(),
});

export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>;

export type AssistantWebResult = z.infer<typeof webResultSchema>;

export function sanitizeMessages(messages: GroqChatMessage[]): GroqChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content.replace(/\u0000/g, " "),
  }));
}
