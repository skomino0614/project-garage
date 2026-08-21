import { describe, expect, it } from "vitest";

import type { ProductRecommendationCandidate } from "./recommend-schemas";
import {
  buildFallbackRecommendations,
  resolveRecommendProductReasons,
  sanitizeAiRecommendations,
} from "./recommend";

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
  stylePreference: "高級感",
  priorities: {
    appearance: "high" as const,
    comfort: "high" as const,
    practicality: "unknown" as const,
    resale: "unknown" as const,
  },
  direction: null,
};

function makeCandidate(
  id: string,
  overrides: Partial<ProductRecommendationCandidate> = {},
): ProductRecommendationCandidate {
  return {
    product: {
      id,
      name: `Wheel ${id.slice(0, 8)}`,
      brand: "Test Brand",
      category: "ホイール",
      priceMinYen: 150_000,
      priceMaxYen: 180_000,
      style: "高級感",
      attributes: {
        appearance: "high",
        comfort: "high",
        practicality: "medium",
        resale: "low",
      },
      tags: ["18インチ", "メッシュ"],
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          fitmentType: "confirmed" as const,
          note: null,
          carMasterId: null,
        },
      ],
    },
    score: 90,
    reasons: ["車種適合", "予算内", "見た目の優先度と一致", "スタイルと一致"],
    vehicleCompatibility: "confirmed",
    ...overrides,
  };
}

describe("recommend product reasons", () => {
  it("Test 1: returns one recommendation per candidate when three candidates are provided", () => {
    const candidates = [
      makeCandidate("11111111-1111-4111-8111-111111111111", { score: 94 }),
      makeCandidate("22222222-2222-4222-8222-222222222222", { score: 89 }),
      makeCandidate("33333333-3333-4333-8333-333333333333", { score: 84 }),
    ];

    const aiItems = candidates.map((candidate) => ({
      productId: candidate.product.id,
      reason: `${candidate.product.name} は今回の条件に合う候補です。`,
      highlights: ["予算内", "見た目の優先度と一致"],
      caution: null,
    }));

    const recommendations = resolveRecommendProductReasons(
      { consultation, candidates },
      aiItems,
    );

    expect(recommendations).toHaveLength(3);
    expect(recommendations.map((item) => item.productId)).toEqual(
      candidates.map((candidate) => candidate.product.id),
    );
  });

  it("Test 2: excludes recommendations for productIds not in candidates", () => {
    const candidates = [
      makeCandidate("11111111-1111-4111-8111-111111111111"),
      makeCandidate("22222222-2222-4222-8222-222222222222"),
    ];

    const recommendations = sanitizeAiRecommendations(
      [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          reason: "候補1の説明",
          highlights: ["予算内", "見た目の優先度と一致"],
          caution: null,
        },
        {
          productId: "99999999-9999-4999-8999-999999999999",
          reason: "候補外商品の説明",
          highlights: ["架空", "候補外"],
          caution: null,
        },
      ],
      candidates,
      consultation,
    );

    expect(recommendations).toHaveLength(2);
    expect(recommendations.some((item) => item.productId === "99999999-9999-4999-8999-999999999999")).toBe(
      false,
    );
    expect(recommendations[0]?.productId).toBe(candidates[0]?.product.id);
  });

  it("Test 3: deduplicates repeated productIds from AI output", () => {
    const candidates = [
      makeCandidate("11111111-1111-4111-8111-111111111111"),
      makeCandidate("22222222-2222-4222-8222-222222222222"),
    ];

    const recommendations = sanitizeAiRecommendations(
      [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          reason: "1回目",
          highlights: ["予算内", "見た目の優先度と一致"],
          caution: null,
        },
        {
          productId: "11111111-1111-4111-8111-111111111111",
          reason: "2回目（重複）",
          highlights: ["重複", "除外"],
          caution: null,
        },
        {
          productId: "22222222-2222-4222-8222-222222222222",
          reason: "候補2",
          highlights: ["スタイルと一致", "予算内"],
          caution: null,
        },
      ],
      candidates,
      consultation,
    );

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0]?.reason).toBe("1回目");
    expect(recommendations.filter((item) => item.productId === candidates[0]?.product.id)).toHaveLength(1);
  });

  it("Test 4: restores Phase 6-2 score order when AI returns reversed order", () => {
    const candidates = [
      makeCandidate("11111111-1111-4111-8111-111111111111", { score: 94 }),
      makeCandidate("22222222-2222-4222-8222-222222222222", { score: 89 }),
      makeCandidate("33333333-3333-4333-8333-333333333333", { score: 84 }),
    ];

    const recommendations = sanitizeAiRecommendations(
      [
        {
          productId: "33333333-3333-4333-8333-333333333333",
          reason: "3位の説明",
          highlights: ["予算内", "見た目の優先度と一致"],
          caution: null,
        },
        {
          productId: "11111111-1111-4111-8111-111111111111",
          reason: "1位の説明",
          highlights: ["予算内", "スタイルと一致"],
          caution: null,
        },
        {
          productId: "22222222-2222-4222-8222-222222222222",
          reason: "2位の説明",
          highlights: ["予算内", "乗り心地の条件と一致"],
          caution: null,
        },
      ],
      candidates,
      consultation,
    );

    expect(recommendations.map((item) => item.productId)).toEqual(
      candidates.map((candidate) => candidate.product.id),
    );
  });

  it("Test 5: keeps candidate productId as source of truth regardless of AI text", () => {
    const candidate = makeCandidate("11111111-1111-4111-8111-111111111111");

    const recommendations = sanitizeAiRecommendations(
      [
        {
          productId: candidate.product.id,
          reason: "別名ホイール XYZ を ¥999,999 でおすすめします。",
          highlights: ["別ブランド", "別価格"],
          caution: null,
        },
      ],
      [candidate],
      consultation,
    );

    expect(recommendations[0]?.productId).toBe(candidate.product.id);
    expect(recommendations[0]?.reason).toContain("別名ホイール");
    expect(recommendations[0]?.reason).not.toContain(candidate.product.name);
  });

  it("Test 6: does not claim compatibility when vehicleCompatibility is unknown", () => {
    const candidate = makeCandidate("11111111-1111-4111-8111-111111111111", {
      vehicleCompatibility: "unknown",
      product: {
        ...makeCandidate("11111111-1111-4111-8111-111111111111").product,
        compatibilities: [],
      },
      reasons: ["予算内"],
    });

    const recommendations = buildFallbackRecommendations([candidate], consultation);

    expect(recommendations[0]?.caution).toContain("適合確認");
    expect(recommendations[0]?.reason).not.toMatch(/適合します/);
    expect(recommendations[0]?.highlights).not.toContain("車種適合");
  });

  it("Test 7: fallback reasons stay consistent with structured reasons", () => {
    const candidate = makeCandidate("11111111-1111-4111-8111-111111111111", {
      reasons: ["予算内", "見た目の優先度と一致"],
    });

    const recommendations = buildFallbackRecommendations([candidate], consultation);

    expect(recommendations[0]?.highlights).toEqual(["予算内", "見た目の優先度と一致"]);
    expect(recommendations[0]?.reason).toContain("予算内");
    expect(recommendations[0]?.reason).toContain("見た目の優先度と一致");
    expect(recommendations[0]?.reason).not.toContain("人気");
  });

  it("Test 8: uses style match in fallback highlights when stylePreference matches", () => {
    const candidate = makeCandidate("11111111-1111-4111-8111-111111111111", {
      reasons: ["予算内", "スタイルと一致"],
      product: {
        ...makeCandidate("11111111-1111-4111-8111-111111111111").product,
        style: "高級感",
      },
    });

    const recommendations = buildFallbackRecommendations([candidate], {
      ...consultation,
      stylePreference: "高級感",
    });

    expect(recommendations[0]?.highlights).toContain("スタイルと一致");
    expect(recommendations[0]?.reason).toContain("スタイルと一致");
  });

  it("Test 9: falls back without inventing products when AI output is unavailable", () => {
    const candidates = [
      makeCandidate("11111111-1111-4111-8111-111111111111"),
      makeCandidate("22222222-2222-4222-8222-222222222222"),
    ];

    const recommendations = resolveRecommendProductReasons({ consultation, candidates }, null);

    expect(recommendations).toHaveLength(2);
    expect(recommendations.every((item) => candidates.some((c) => c.product.id === item.productId))).toBe(
      true,
    );
    expect(recommendations[0]?.highlights.length).toBeGreaterThan(0);
  });

  it("Test 10: returns an empty array for zero candidates without throwing", () => {
    const recommendations = resolveRecommendProductReasons({ consultation, candidates: [] }, null);
    expect(recommendations).toEqual([]);
  });
});
