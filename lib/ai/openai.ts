import type { GroqChatMessage } from "@/lib/ai/groq";

export type OpenAiModelId = "gpt-5";

export type OpenAiChatCompletionRequest = {
  model: OpenAiModelId;
  messages: GroqChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type OpenAiChatCompletionResponse = {
  content: string;
  raw: unknown;
};

export class OpenAiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAiConfigurationError";
  }
}

export class OpenAiRequestError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.name = "OpenAiRequestError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export function isOpenAiModelId(value: string | null | undefined): value is OpenAiModelId {
  return value === "gpt-5";
}

export async function createOpenAiChatCompletion({
  model,
  messages,
  temperature = 0.2,
  maxTokens,
}: OpenAiChatCompletionRequest): Promise<OpenAiChatCompletionResponse> {
  const apiKey = process.env.OPEN_AI_API_SECRET_KEY;
  if (!apiKey) {
    throw new OpenAiConfigurationError("Missing OPEN_AI_API_SECRET_KEY environment variable.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new OpenAiRequestError("OpenAI API request failed.", response.status, payload ?? { message: "No response body" });
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new OpenAiRequestError("OpenAI API returned an unexpected payload.", response.status, payload);
  }

  return {
    content,
    raw: payload,
  };
}
