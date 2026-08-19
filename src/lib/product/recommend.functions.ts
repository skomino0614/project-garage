import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";

import {
  buildRecommendSystemPrompt,
  buildRecommendUserPrompt,
} from "./prompts/recommend";
import {
  buildFallbackRecommendations,
  resolveRecommendProductReasons,
} from "./recommend";
import {
  AiRecommendationOutputSchema,
  RecommendProductReasonsInputSchema,
  type RecommendProductReasonsOutput,
} from "./recommend-schemas";

export const recommendProductReasons = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RecommendProductReasonsInputSchema.parse(data))
  .handler(async ({ data }): Promise<RecommendProductReasonsOutput> => {
    if (data.candidates.length === 0) {
      return { recommendations: [], source: "fallback" };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        recommendations: buildFallbackRecommendations(data.candidates, data.consultation),
        source: "fallback",
      };
    }

    try {
      const { getOpenAI } = await import("../openai.server");
      const openai = getOpenAI();

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: AiRecommendationOutputSchema,
        system: buildRecommendSystemPrompt(),
        prompt: buildRecommendUserPrompt(data.consultation, data.candidates),
      });

      return {
        recommendations: resolveRecommendProductReasons(data, object.recommendations),
        source: "ai",
      };
    } catch (error) {
      console.error("[recommendProductReasons] OpenAI request failed:", error);
      return {
        recommendations: buildFallbackRecommendations(data.candidates, data.consultation),
        source: "fallback",
      };
    }
  });
