import type { SubscriptionPlan } from "@/lib/subscription/plans";
import type { GroqModelId } from "@/lib/ai/groq";
import { AVAILABLE_GROQ_MODELS, DEFAULT_GROQ_MODEL } from "@/lib/ai/groq";
import { isOpenAiModelId, type OpenAiModelId } from "@/lib/ai/openai";

export type ResearchType = "legal" | "academic" | "ai";

const DEFAULT_MODEL_MAP: Record<ResearchType, GroqModelId> = {
  legal: "llama-3.3-70b-versatile",
  academic: "openai/gpt-oss-20b",
  ai: "openai/gpt-oss-120b",
};

export type AiModelConfig =
  | { provider: "groq"; model: GroqModelId }
  | { provider: "openai"; model: OpenAiModelId };

const GROQ_MODEL_ID_SET = new Set<GroqModelId>(AVAILABLE_GROQ_MODELS.map((model) => model.id));

function isGroqModelId(candidate: string | null | undefined): candidate is GroqModelId {
  if (!candidate) {
    return false;
  }
  return GROQ_MODEL_ID_SET.has(candidate as GroqModelId);
}

export function resolveResearchModel(plan: SubscriptionPlan, researchType: ResearchType): AiModelConfig {
  if (plan.aiProvider === "openai" && isOpenAiModelId(plan.aiModelId)) {
    return { provider: "openai", model: plan.aiModelId };
  }
  const model = DEFAULT_MODEL_MAP[researchType] ?? DEFAULT_GROQ_MODEL;
  return { provider: "groq", model };
}

export function resolveChatModel(plan: SubscriptionPlan, requestedModel?: GroqModelId | null): AiModelConfig {
  if (plan.aiProvider === "openai" && isOpenAiModelId(plan.aiModelId)) {
    return { provider: "openai", model: plan.aiModelId };
  }

  if (requestedModel && isGroqModelId(requestedModel)) {
    return { provider: "groq", model: requestedModel };
  }

  if (isGroqModelId(plan.aiModelId)) {
    return { provider: "groq", model: plan.aiModelId };
  }

  return { provider: "groq", model: DEFAULT_GROQ_MODEL };
}

export { DEFAULT_MODEL_MAP as DEFAULT_RESEARCH_MODEL_MAP };
