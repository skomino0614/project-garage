import { describe, expect, it } from "vitest";

import type { ProductRecommendationCandidate } from "./recommend-schemas";
import {
  buildProductRecommendationDisplayItems,
  formatMatchScore,
  formatProductPrice,
  isRecommendationRequest,
  RECOMMENDATION_GRID_CLASS,
} from "./recommend-display";

const candidateBase = (
  id: string,
  overrides: Partial<ProductRecommendationCandidate> = {},
): ProductRecommendationCandidate => ({
  product: {
    id,
    name: "Premium Wheel",
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
    tags: ["18インチ"],
    compatibilities: [
      {
        maker: "Toyota",
        model: "Voxy",
        series: "90 Series",
        note: null,
        carMasterId: null,
      },
    ],
  },
  score: 92,
  reasons: ["予算内", "見た目の優先度と一致", "スタイルと一致"],
  vehicleCompatibility: "compatible",
  ...overrides,
});

describe("recommend display", () => {
  it("Test 1: builds three display items from three recommendations", () => {
    const candidates = [
      candidateBase("11111111-1111-4111-8111-111111111111"),
      candidateBase("22222222-2222-4222-8222-222222222222"),
      candidateBase("33333333-3333-4333-8333-333333333333"),
    ];

    const recommendations = candidates.map((candidate) => ({
      productId: candidate.product.id,
      reason: "条件に合う候補です。",
      highlights: ["予算内", "見た目の優先度と一致"],
      caution: null,
    }));

    const items = buildProductRecommendationDisplayItems(candidates, recommendations);

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.productId)).toEqual(candidates.map((c) => c.product.id));
  });

  it("Test 2: excludes recommendations with unknown productIds", () => {
    const candidates = [candidateBase("11111111-1111-4111-8111-111111111111")];

    const items = buildProductRecommendationDisplayItems(candidates, [
      {
        productId: "99999999-9999-4999-8999-999999999999",
        reason: "候補外",
        highlights: ["候補外", "除外"],
        caution: null,
      },
    ]);

    expect(items).toHaveLength(0);
  });

  it("Test 3: deduplicates repeated productIds in recommendations", () => {
    const candidates = [candidateBase("11111111-1111-4111-8111-111111111111")];

    const items = buildProductRecommendationDisplayItems(candidates, [
      {
        productId: candidates[0]!.product.id,
        reason: "1回目",
        highlights: ["予算内", "見た目の優先度と一致"],
        caution: null,
      },
      {
        productId: candidates[0]!.product.id,
        reason: "2回目",
        highlights: ["重複", "除外"],
        caution: null,
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.reason).toBe("1回目");
  });

  it("Test 4: preserves candidate order regardless of recommendation order", () => {
    const candidates = [
      candidateBase("11111111-1111-4111-8111-111111111111", { score: 94 }),
      candidateBase("22222222-2222-4222-8222-222222222222", { score: 89 }),
    ];

    const items = buildProductRecommendationDisplayItems(candidates, [
      {
        productId: candidates[1]!.product.id,
        reason: "2位",
        highlights: ["予算内", "見た目の優先度と一致"],
        caution: null,
      },
      {
        productId: candidates[0]!.product.id,
        reason: "1位",
        highlights: ["予算内", "スタイルと一致"],
        caution: null,
      },
    ]);

    expect(items.map((item) => item.productId)).toEqual([
      candidates[0]!.product.id,
      candidates[1]!.product.id,
    ]);
  });

  it("Test 5: uses candidate product name even when AI reason mentions another name", () => {
    const candidate = candidateBase("11111111-1111-4111-8111-111111111111");

    const items = buildProductRecommendationDisplayItems([candidate], [
      {
        productId: candidate.product.id,
        reason: "別名ホイール XYZ がおすすめです。",
        highlights: ["予算内", "見た目の優先度と一致"],
        caution: null,
      },
    ]);

    expect(items[0]?.name).toBe("Premium Wheel");
    expect(items[0]?.reason).toContain("別名ホイール XYZ");
  });

  it("Test 3 price: formats equal min and max as single price", () => {
    expect(formatProductPrice(180_000, 180_000)).toBe("¥180,000");
  });

  it("Test 4 price: formats different min and max as range", () => {
    expect(formatProductPrice(150_000, 180_000)).toBe("¥150,000〜¥180,000");
  });

  it("Test 7: keeps highlights aligned with structured reasons from candidate data", () => {
    const candidate = candidateBase("11111111-1111-4111-8111-111111111111", {
      reasons: ["予算内", "見た目の優先度と一致"],
    });

    const items = buildProductRecommendationDisplayItems([candidate], [
      {
        productId: candidate.product.id,
        reason: "20万円以内で見た目を重視する条件に合う候補です。",
        highlights: ["予算内", "見た目の優先度と一致"],
        caution: null,
      },
    ]);

    expect(items[0]?.highlights).toEqual(["予算内", "見た目の優先度と一致"]);
    expect(items[0]?.priceMinYen).toBe(150_000);
  });

  it("Test 8: keeps style-related highlights from recommendation output", () => {
    const candidate = candidateBase("11111111-1111-4111-8111-111111111111", {
      product: {
        ...candidateBase("11111111-1111-4111-8111-111111111111").product,
        style: "高級感",
      },
    });

    const items = buildProductRecommendationDisplayItems([candidate], [
      {
        productId: candidate.product.id,
        reason: "高級感のスタイルが希望と一致しています。",
        highlights: ["スタイルと一致", "予算内"],
        caution: null,
      },
    ]);

    expect(items[0]?.style).toBe("高級感");
    expect(items[0]?.highlights).toContain("スタイルと一致");
  });

  it("Test 6 caution: keeps null caution when recommendation has no caution", () => {
    const candidate = candidateBase("11111111-1111-4111-8111-111111111111");

    const items = buildProductRecommendationDisplayItems([candidate], [
      {
        productId: candidate.product.id,
        reason: "条件に合う候補です。",
        highlights: ["予算内", "見た目の優先度と一致"],
        caution: null,
      },
    ]);

    expect(items[0]?.caution).toBeNull();
  });

  it("Test 8 compatibility: marks unknown compatibility without claiming fitment", () => {
    const candidate = candidateBase("11111111-1111-4111-8111-111111111111", {
      vehicleCompatibility: "unknown",
      product: {
        ...candidateBase("11111111-1111-4111-8111-111111111111").product,
        compatibilities: [],
      },
    });

    const items = buildProductRecommendationDisplayItems([candidate], [
      {
        productId: candidate.product.id,
        reason: "条件に合う候補です。",
        highlights: ["予算内", "見た目の優先度と一致"],
        caution: "車種適合情報が登録されていないため、購入前に適合確認が必要です。",
      },
    ]);

    expect(items[0]?.vehicleCompatibility).toBe("unknown");
    expect(items[0]?.caution).toContain("適合確認");
  });

  it("Test 9 purchaseUrl: leaves purchaseUrl null when not provided in product details merge", () => {
    const candidate = candidateBase("11111111-1111-4111-8111-111111111111");
    const items = buildProductRecommendationDisplayItems([candidate], [
      {
        productId: candidate.product.id,
        reason: "条件に合う候補です。",
        highlights: ["予算内", "見た目の優先度と一致"],
        caution: null,
      },
    ]);

    expect(items[0]?.purchaseUrl).toBeNull();
    expect(items[0]?.productUrl).toBeNull();
  });

  it("Test 11 responsive: uses single-column grid on mobile", () => {
    expect(RECOMMENDATION_GRID_CLASS).toContain("grid-cols-1");
    expect(RECOMMENDATION_GRID_CLASS).not.toContain("overflow-x-auto");
  });

  it("detects explicit recommendation requests", () => {
    expect(isRecommendationRequest("おすすめを教えて")).toBe(true);
    expect(isRecommendationRequest("どれがいいですか")).toBe(true);
    expect(isRecommendationRequest("30万円まで出せる")).toBe(false);
  });

  it("formats match score without absolute recommendation language", () => {
    expect(formatMatchScore(92.4)).toBe("マッチ度 92 / 100");
  });
});
