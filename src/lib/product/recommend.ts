import type { ProductMatchResult } from "./match-types";
import type {
  AiRecommendationItem,
  ConsultationForRecommendation,
  ProductRecommendation,
  ProductRecommendationCandidate,
} from "./recommend-schemas";

const UNKNOWN_COMPATIBILITY_CAUTION =
  "車種適合情報が登録されていないため、購入前に適合確認が必要です。";

export function matchResultToCandidate(
  result: ProductMatchResult,
): ProductRecommendationCandidate {
  return {
    product: {
      id: result.product.id,
      name: result.product.name,
      brand: result.product.brand,
      category: result.product.category,
      priceMinYen: result.product.priceMinYen,
      priceMaxYen: result.product.priceMaxYen,
      style: result.product.style,
      attributes: result.product.attributes,
      tags: result.product.tags,
      compatibilities: result.product.compatibilities,
    },
    score: result.score,
    reasons: result.reasons,
    vehicleCompatibility: result.vehicleCompatibility,
  };
}

function buildCompatibilityCaution(
  candidate: ProductRecommendationCandidate,
): string | null {
  if (candidate.vehicleCompatibility === "unknown") {
    return UNKNOWN_COMPATIBILITY_CAUTION;
  }
  return null;
}

function buildReasonFromStructuredReasons(
  candidate: ProductRecommendationCandidate,
  consultation: ConsultationForRecommendation,
): string {
  const reasonLabels = candidate.reasons.slice(0, 3);

  if (reasonLabels.length === 0) {
    return "スコアリング結果に基づき、今回の条件に対して候補として選定されています。";
  }

  const budgetLabel =
    consultation.budget.maxYen !== null && consultation.budget.maxYen > 0
      ? `${consultation.budget.maxYen.toLocaleString("ja-JP")}円以内`
      : "今回";

  return `${budgetLabel}の条件に対して、${reasonLabels.join("、")}の観点で相性が良い候補です。`;
}

function buildHighlightsFromStructuredReasons(
  candidate: ProductRecommendationCandidate,
): string[] {
  if (candidate.reasons.length > 0) {
    return candidate.reasons.slice(0, 4);
  }
  return ["条件に基づく候補"];
}

export function buildFallbackRecommendation(
  candidate: ProductRecommendationCandidate,
  consultation: ConsultationForRecommendation,
): ProductRecommendation {
  return {
    productId: candidate.product.id,
    reason: buildReasonFromStructuredReasons(candidate, consultation),
    highlights: buildHighlightsFromStructuredReasons(candidate),
    caution: buildCompatibilityCaution(candidate),
  };
}

export function buildFallbackRecommendations(
  candidates: ProductRecommendationCandidate[],
  consultation: ConsultationForRecommendation,
): ProductRecommendation[] {
  return candidates.map((candidate) => buildFallbackRecommendation(candidate, consultation));
}

export function sanitizeAiRecommendations(
  aiItems: AiRecommendationItem[],
  candidates: ProductRecommendationCandidate[],
  consultation: ConsultationForRecommendation,
): ProductRecommendation[] {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.product.id, candidate]),
  );
  const seenProductIds = new Set<string>();
  const aiByProductId = new Map<string, AiRecommendationItem>();

  for (const item of aiItems) {
    if (!candidateMap.has(item.productId)) {
      continue;
    }
    if (seenProductIds.has(item.productId)) {
      continue;
    }

    seenProductIds.add(item.productId);
    aiByProductId.set(item.productId, item);
  }

  return candidates.map((candidate) => {
    const aiItem = aiByProductId.get(candidate.product.id);
    if (!aiItem) {
      return buildFallbackRecommendation(candidate, consultation);
    }

    const caution =
      aiItem.caution?.trim() ||
      buildCompatibilityCaution(candidate);

    return {
      productId: candidate.product.id,
      reason: aiItem.reason.trim(),
      highlights: aiItem.highlights.slice(0, 4),
      caution,
    };
  });
}

export function resolveRecommendProductReasons(
  input: {
    consultation: ConsultationForRecommendation;
    candidates: ProductRecommendationCandidate[];
  },
  aiItems: AiRecommendationItem[] | null,
): ProductRecommendation[] {
  if (input.candidates.length === 0) {
    return [];
  }

  if (!aiItems || aiItems.length === 0) {
    return buildFallbackRecommendations(input.candidates, input.consultation);
  }

  return sanitizeAiRecommendations(aiItems, input.candidates, input.consultation);
}
