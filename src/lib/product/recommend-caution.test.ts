import { describe, expect, it } from "vitest";

import {
  isContradictoryConfirmedCaution,
  isMissingFitmentCaution,
  REFERENCE_COMPATIBILITY_CAUTION,
  resolveRecommendationCaution,
  UNKNOWN_COMPATIBILITY_CAUTION,
} from "./recommend-caution";
import type { ProductRecommendationCandidate } from "./recommend-schemas";
import { sanitizeAiRecommendations } from "./recommend";

const consultation = {
  vehicle: {
    maker: "Toyota",
    model: "Voxy",
    series: "90 Series",
  },
  budget: {
    maxYen: 200_000,
    note: null,
  },
  category: "ホイール",
  usage: null,
  stylePreference: null,
  priorities: {
    appearance: "unknown" as const,
    comfort: "unknown" as const,
    practicality: "unknown" as const,
    resale: "unknown" as const,
  },
  direction: null,
};

function makeCandidate(
  vehicleCompatibility: ProductRecommendationCandidate["vehicleCompatibility"],
): ProductRecommendationCandidate {
  return {
    product: {
      id: "6db66b2d-3c44-47c9-881f-2a1d60d07e8c",
      name: "Craft Collection VOUGE LIMITED",
      brand: "RAYS（株式会社レイズ）",
      category: "ホイール",
      priceMinYen: 69_300,
      priceMaxYen: 93_500,
      style: "その他",
      attributes: {
        appearance: "unknown",
        comfort: "unknown",
        practicality: "unknown",
        resale: "unknown",
      },
      tags: [],
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          fitmentType: vehicleCompatibility === "reference" ? "reference" : "confirmed",
          note: "参考適合",
          carMasterId: null,
        },
      ],
    },
    score: 50,
    reasons: ["参考適合", "予算内"],
    vehicleCompatibility,
  };
}

describe("recommend caution (Phase 8-2A)", () => {
  it("E: reference product rejects missing-fitment AI caution", () => {
    const candidate = makeCandidate("reference");

    const caution = resolveRecommendationCaution(candidate, "適合確認が必要です。");
    expect(caution).toBe(REFERENCE_COMPATIBILITY_CAUTION);
    expect(caution).not.toMatch(/適合情報がない/u);
    expect(caution).not.toMatch(/適合情報が登録されていない/u);
  });

  it("confirmed product strips contradictory AI caution", () => {
    const candidate = makeCandidate("confirmed");

    expect(resolveRecommendationCaution(candidate, "適合確認が必要です。")).toBeNull();
    expect(isContradictoryConfirmedCaution("適合確認が必要です。")).toBe(true);
  });

  it("unknown product keeps purchase verification caution", () => {
    const candidate = makeCandidate("unknown");

    expect(resolveRecommendationCaution(candidate, null)).toBe(UNKNOWN_COMPATIBILITY_CAUTION);
    expect(isMissingFitmentCaution(UNKNOWN_COMPATIBILITY_CAUTION)).toBe(true);
  });

  it("sanitizeAiRecommendations replaces contradictory caution for confirmed products", () => {
    const candidate = makeCandidate("confirmed");

    const recommendations = sanitizeAiRecommendations(
      [
        {
          productId: candidate.product.id,
          reason: "車種適合の候補です。",
          highlights: ["予算内", "車種適合"],
          caution: "適合確認が必要です。",
        },
      ],
      [candidate],
      consultation,
    );

    expect(recommendations[0]?.caution).toBeNull();
  });

  it("sanitizeAiRecommendations replaces missing-fitment caution for reference products", () => {
    const candidate = makeCandidate("reference");

    const recommendations = sanitizeAiRecommendations(
      [
        {
          productId: candidate.product.id,
          reason: "参考適合の候補です。",
          highlights: ["参考適合", "予算内"],
          caution: "車種適合情報が登録されていないため、購入前に適合確認が必要です。",
        },
      ],
      [candidate],
      consultation,
    );

    expect(recommendations[0]?.caution).toBe(REFERENCE_COMPATIBILITY_CAUTION);
    expect(recommendations[0]?.caution).not.toMatch(/適合情報が登録されていない/u);
  });
});
