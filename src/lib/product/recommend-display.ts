import type { ConsultationSummary } from "@/lib/consult/types";

import type {
  ProductRecommendation,
  ProductRecommendationCandidate,
  ProductRecommendationDisplayItem,
} from "./recommend-schemas";

const RECOMMENDATION_REQUEST_PATTERNS = [
  /おすすめ/u,
  /教えて/u,
  /どれがいい/u,
  /どれが良い/u,
  /提案/u,
  /選んで/u,
  /選びたい/u,
  /お勧め/u,
];

export function isRecommendationRequest(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return RECOMMENDATION_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function formatProductPrice(priceMinYen: number, priceMaxYen: number): string {
  const formatYen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

  if (priceMinYen === priceMaxYen) {
    return formatYen(priceMinYen);
  }

  return `${formatYen(priceMinYen)}〜${formatYen(priceMaxYen)}`;
}

export function formatMatchScore(score: number): string {
  const rounded = Math.round(score);
  return `マッチ度 ${rounded} / 100`;
}

export function consultationToRecommendationInput(
  summary: ConsultationSummary,
): {
  vehicle: ConsultationSummary["vehicle"];
  budget: ConsultationSummary["budget"];
  category: ConsultationSummary["category"];
  usage: ConsultationSummary["usage"];
  stylePreference: ConsultationSummary["stylePreference"];
  priorities: ConsultationSummary["priorities"];
  direction: ConsultationSummary["direction"];
} {
  return {
    vehicle: summary.vehicle,
    budget: summary.budget,
    category: summary.category,
    usage: summary.usage,
    stylePreference: summary.stylePreference,
    priorities: summary.priorities,
    direction: summary.direction,
  };
}

export function buildProductRecommendationDisplayItems(
  candidates: ProductRecommendationCandidate[],
  recommendations: ProductRecommendation[],
): ProductRecommendationDisplayItem[] {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.product.id, candidate]),
  );
  const recommendationMap = new Map<string, ProductRecommendation>();
  const seenProductIds = new Set<string>();

  for (const recommendation of recommendations) {
    if (!candidateMap.has(recommendation.productId)) {
      continue;
    }
    if (seenProductIds.has(recommendation.productId)) {
      continue;
    }

    seenProductIds.add(recommendation.productId);
    recommendationMap.set(recommendation.productId, recommendation);
  }

  return candidates
    .map((candidate) => {
      const recommendation = recommendationMap.get(candidate.product.id);
      if (!recommendation) {
        return null;
      }

      return {
        productId: candidate.product.id,
        name: candidate.product.name,
        brand: candidate.product.brand,
        priceMinYen: candidate.product.priceMinYen,
        priceMaxYen: candidate.product.priceMaxYen,
        imageUrl: null,
        productUrl: null,
        purchaseUrl: null,
        style: candidate.product.style,
        score: candidate.score,
        vehicleCompatibility: candidate.vehicleCompatibility,
        compatibilities: candidate.product.compatibilities,
        reason: recommendation.reason,
        highlights: recommendation.highlights,
        caution: recommendation.caution,
      } satisfies ProductRecommendationDisplayItem;
    })
    .filter((item): item is ProductRecommendationDisplayItem => item !== null);
}

export function buildProductRecommendationDisplayItemsFromMatches(
  candidates: ProductRecommendationCandidate[],
  recommendations: ProductRecommendation[],
  productDetails: Array<{
    id: string;
    imageUrl: string | null;
    productUrl: string | null;
    purchaseUrl: string | null;
  }>,
): ProductRecommendationDisplayItem[] {
  const detailsMap = new Map(productDetails.map((product) => [product.id, product]));

  return buildProductRecommendationDisplayItems(candidates, recommendations).map((item) => {
    const details = detailsMap.get(item.productId);
    return {
      ...item,
      imageUrl: details?.imageUrl ?? null,
      productUrl: details?.productUrl ?? null,
      purchaseUrl: details?.purchaseUrl ?? null,
    };
  });
}

export function formatCompatibilityLabel(
  vehicleCompatibility: ProductRecommendationDisplayItem["vehicleCompatibility"],
  compatibilities: ProductRecommendationCandidate["product"]["compatibilities"],
): string | null {
  if (vehicleCompatibility !== "compatible") {
    return null;
  }

  const first = compatibilities[0];
  if (!first) {
    return null;
  }

  const series = first.series ? ` ${first.series}` : "";
  return `登録適合: ${first.maker} ${first.model}${series}`;
}

/** CSS class names used for responsive recommendation grid (single column on mobile). */
export const RECOMMENDATION_GRID_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";
