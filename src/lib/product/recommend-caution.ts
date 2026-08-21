import type { ProductRecommendationCandidate } from "./recommend-schemas";
import type { VehicleCompatibilityStatus } from "./match-types";

export const UNKNOWN_COMPATIBILITY_CAUTION =
  "車種適合情報が登録されていないため、購入前に適合確認が必要です。";

export const REFERENCE_COMPATIBILITY_CAUTION =
  "参考適合です。グレード・タイヤサイズ・車高等により適合が異なる場合があります。";

const MISSING_FITMENT_CAUTION_PATTERNS = [
  /適合情報が(登録されていない|ない)/u,
  /購入前に適合確認が必要/u,
];

const CONTRADICTORY_CONFIRMED_CAUTION_PATTERNS = [
  /適合確認が必要/u,
  /適合情報が(登録されていない|ない)/u,
  /適合については確認が必要/u,
];

/** Detects cautions that imply missing fitment data (invalid for reference/confirmed). */
export function isMissingFitmentCaution(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }
  return MISSING_FITMENT_CAUTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Detects cautions that contradict a confirmed fitment status. */
export function isContradictoryConfirmedCaution(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }
  return CONTRADICTORY_CONFIRMED_CAUTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function buildCompatibilityCaution(
  candidate: ProductRecommendationCandidate,
): string | null {
  return resolveRecommendationCaution(candidate, null);
}

export function resolveRecommendationCaution(
  candidate: ProductRecommendationCandidate,
  aiCaution: string | null | undefined,
): string | null {
  const status = candidate.vehicleCompatibility;
  const trimmedAiCaution = aiCaution?.trim() || null;

  return resolveCautionForStatus(status, trimmedAiCaution);
}

function resolveCautionForStatus(
  status: VehicleCompatibilityStatus,
  aiCaution: string | null,
): string | null {
  if (status === "confirmed") {
    if (aiCaution && isContradictoryConfirmedCaution(aiCaution)) {
      return null;
    }
    return null;
  }

  if (status === "reference") {
    if (
      aiCaution &&
      !isMissingFitmentCaution(aiCaution) &&
      !isContradictoryConfirmedCaution(aiCaution)
    ) {
      return aiCaution;
    }
    return REFERENCE_COMPATIBILITY_CAUTION;
  }

  if (status === "unknown") {
    if (aiCaution && !isMissingFitmentCaution(aiCaution)) {
      return aiCaution;
    }
    return UNKNOWN_COMPATIBILITY_CAUTION;
  }

  return null;
}
