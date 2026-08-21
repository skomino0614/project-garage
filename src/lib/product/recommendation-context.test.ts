import { describe, expect, it } from "vitest";

import type { ProductRecommendationDisplayItem } from "./recommend-schemas";
import {
  loadProductRecommendationContext,
  saveProductRecommendationContext,
  type StoredProductRecommendationContext,
} from "./recommendation-context";

const sampleItem: ProductRecommendationDisplayItem = {
  productId: "11111111-1111-4111-8111-111111111111",
  name: "Demo Wheel",
  brand: "Demo Brand",
  priceMinYen: 100_000,
  priceMaxYen: 120_000,
  imageUrl: null,
  productUrl: null,
  purchaseUrl: null,
  style: "高級感",
  score: 88,
  vehicleCompatibility: "confirmed",
  compatibilities: [
    {
      maker: "Toyota",
      model: "Voxy",
      series: "90 Series",
      note: null,
      carMasterId: null,
    },
  ],
  reason: "予算内でスタイルが合う候補です。",
  highlights: ["18インチ", "純正風デザイン"],
  caution: null,
};

describe("recommendation context storage", () => {
  it("stores and loads recommendation context by productId", () => {
    const storage = new Map<string, string>();
    const original = globalThis.sessionStorage;

    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        setItem: (key: string, value: string) => storage.set(key, value),
        getItem: (key: string) => storage.get(key) ?? null,
      },
    });

    saveProductRecommendationContext(sampleItem);
    const loaded = loadProductRecommendationContext(sampleItem.productId);

    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: original,
    });

    expect(loaded).toEqual({
      productId: sampleItem.productId,
      reason: sampleItem.reason,
      highlights: sampleItem.highlights,
      caution: sampleItem.caution,
      score: sampleItem.score,
      vehicleCompatibility: sampleItem.vehicleCompatibility,
      compatibilities: sampleItem.compatibilities,
    } satisfies StoredProductRecommendationContext);
  });
});
