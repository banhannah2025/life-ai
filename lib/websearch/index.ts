import type { SubscriptionPlan } from "@/lib/subscription/plans";
import type { AssistantWebResult } from "@/lib/ai/schemas";
import { searchDuckDuckGo } from "@/lib/websearch/duckduckgo";
import { searchGoogle, GoogleSearchConfigurationError } from "@/lib/websearch/google";

export async function runPlanAwareSearch(
  plan: SubscriptionPlan,
  query: string,
  limit = 5,
): Promise<AssistantWebResult[]> {
  if (plan.webSearchProvider === "google") {
    try {
      return await searchGoogle(query, limit);
    } catch (error) {
      if (error instanceof GoogleSearchConfigurationError) {
        console.warn("Google Search misconfigured, falling back to DuckDuckGo:", error.message);
      } else {
        console.error("Google Search API error, falling back to DuckDuckGo:", error);
      }
      // fall through to DuckDuckGo
    }
  }

  return await searchDuckDuckGo(query, limit);
}
