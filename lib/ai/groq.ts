type ChatRole = "system" | "user" | "assistant";

export type GroqChatMessage = {
  role: ChatRole;
  content: string;
};

export type GroqChatCompletionRequest = {
  model?: GroqModelId;
  messages: GroqChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type GroqChatCompletionResponse = {
  content: string;
  raw: unknown;
};

export type GroqModelId =
  | "llama-3.3-70b-versatile"
  | "llama-3.1-8b-instant"
  | "openai/gpt-oss-120b"
  | "openai/gpt-oss-20b";

export const DEFAULT_GROQ_MODEL: GroqModelId = "llama-3.3-70b-versatile";

export type GroqModelDescriptor = {
  id: GroqModelId;
  label: string;
  description: string;
  tokenContext: number;
  tokenLimitPerMinute: number;
};

export const AVAILABLE_GROQ_MODELS: GroqModelDescriptor[] = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B Versatile",
    description: "High-quality general coding reasoning with 131K context and balanced latency.",
    tokenContext: 131072,
    tokenLimitPerMinute: 12000,
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    description: "Fast iterations and follow-ups for quick checks during development.",
    tokenContext: 131072,
    tokenLimitPerMinute: 6000,
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B (Groq)",
    description: "Large-scale reasoning and refactors that benefit from deeper analysis.",
    tokenContext: 131072,
    tokenLimitPerMinute: 8000,
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B (Groq)",
    description: "Balanced quality vs. quota usage for code reviews and summaries.",
    tokenContext: 131072,
    tokenLimitPerMinute: 8000,
  },
];

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqConfigurationError";
  }
}

export class GroqRequestError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.name = "GroqRequestError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function createGroqChatCompletion({
  messages,
  model = DEFAULT_GROQ_MODEL,
  temperature = 0.1,
  maxTokens,
}: GroqChatCompletionRequest): Promise<GroqChatCompletionResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqConfigurationError("Missing GROQ_API_KEY environment variable.");
  }

  const response = await fetch(GROQ_API_URL, {
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

  const payload = await response.json();

  if (!response.ok) {
    throw new GroqRequestError(
      "Groq API request failed.",
      response.status,
      payload ?? { message: "No response body" },
    );
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new GroqRequestError("Groq API returned an unexpected payload.", response.status, payload);
  }

  return {
    content,
    raw: payload,
  };
}
