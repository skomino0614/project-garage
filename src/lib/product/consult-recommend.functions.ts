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
import { getSafeProductImageUrl } from "./product-image-url";

export const recommendProductsForConsultation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RecommendProductsForConsultationInputSchema.parse(data))
  .handler(async ({ data }): Promise<RecommendProductsForConsultationOutput> => {
    const { consultation } = data;

    if (!consultation.category?.trim()) {
      return { items: [], source: null };
    }

    try {
      const products = await fetchActiveProductsWithCompatibilities();
      const matchInput = consultationSummaryToMatchInput({
        ...consultation,
        direction: consultation.direction ?? null,
      });
      const matchResults = rankProductMatches(products, matchInput, { limit: 3 });

      if (matchResults.length === 0) {
        return { items: [], source: null };
      }

      const candidates = matchResults.map(matchResultToCandidate);
      const { recommendations, source } = await generateProductRecommendationReasons({
        consultation,
        candidates,
      });

      if (recommendations.length === 0) {
        return { items: [], source: null };
      }

      const items = buildProductRecommendationDisplayItemsFromMatches(
        candidates,
        recommendations,
        matchResults.map((result) => ({
          id: result.product.id,
          imageUrl: getSafeProductImageUrl(result.product.imageUrl),
          productUrl: result.product.productUrl,
          purchaseUrl: result.product.purchaseUrl,
        })),
      );

      return { items, source };
    } catch (error) {
      console.error("[recommendProductsForConsultation] Failed:", error);
      throw error;
    }
  });
