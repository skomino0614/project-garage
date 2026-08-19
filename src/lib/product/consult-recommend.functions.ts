import { createServerFn } from "@tanstack/react-start";

import { consultationSummaryToMatchInput, rankProductMatches } from "./match";
import {
  buildProductRecommendationDisplayItemsFromMatches,
  consultationToRecommendationInput,
} from "./recommend-display";
import { generateProductRecommendationReasons, matchResultToCandidate } from "./recommend";
import {
  RecommendProductsForConsultationInputSchema,
  type RecommendProductsForConsultationOutput,
} from "./recommend-schemas";
import { fetchActiveProductsWithCompatibilities } from "./query";

type RecommendDebugStage = NonNullable<
  RecommendProductsForConsultationOutput["_debug"]
>["stage"];

function emptyRecommendOutput(
  stage: RecommendDebugStage,
  extra?: Omit<NonNullable<RecommendProductsForConsultationOutput["_debug"]>, "stage">,
): RecommendProductsForConsultationOutput {
  return {
    items: [],
    source: null,
    _debug: { stage, ...extra },
  };
}

export const recommendProductsForConsultation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RecommendProductsForConsultationInputSchema.parse(data))
  .handler(async ({ data }): Promise<RecommendProductsForConsultationOutput> => {
    const { consultation } = data;

    if (!consultation.category?.trim()) {
      return emptyRecommendOutput("no_category");
    }

    try {
      const products = await fetchActiveProductsWithCompatibilities();
      console.info(
        "[recommendProductsForConsultation] products:",
        products.length,
      );

      if (products.length === 0) {
        return emptyRecommendOutput("products_zero", { productCount: 0, matchCount: 0 });
      }

      const matchInput = consultationSummaryToMatchInput({
        ...consultation,
        direction: consultation.direction ?? null,
      });
      const matchResults = rankProductMatches(products, matchInput, { limit: 3 });
      console.info(
        "[recommendProductsForConsultation] matches:",
        matchResults.length,
      );

      if (matchResults.length === 0) {
        return emptyRecommendOutput("matches_zero", {
          productCount: products.length,
          matchCount: 0,
        });
      }

      const candidates = matchResults.map(matchResultToCandidate);
      const { recommendations, source } = await generateProductRecommendationReasons({
        consultation,
        candidates,
      });
      console.info(
        "[recommendProductsForConsultation] recommendations:",
        recommendations.length,
        "source:",
        source,
      );

      if (recommendations.length === 0) {
        return emptyRecommendOutput("recommend_zero", {
          productCount: products.length,
          matchCount: matchResults.length,
          recommendCount: 0,
        });
      }

      const items = buildProductRecommendationDisplayItemsFromMatches(
        candidates,
        recommendations,
        matchResults.map((result) => ({
          id: result.product.id,
          imageUrl: result.product.imageUrl,
          productUrl: result.product.productUrl,
          purchaseUrl: result.product.purchaseUrl,
        })),
      );

      return {
        items,
        source,
        _debug: {
          stage: "success",
          productCount: products.length,
          matchCount: matchResults.length,
          recommendCount: recommendations.length,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[recommendProductsForConsultation] Failed:", error);
      return emptyRecommendOutput("db_error", { error: message.slice(0, 300) });
    }
  });
