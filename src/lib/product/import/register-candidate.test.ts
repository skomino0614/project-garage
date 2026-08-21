import { describe, expect, it, vi } from "vitest";

import {
  registerProductCandidate,
  RegisterProductCandidateError,
  toRegisterInputFromCandidate,
} from "./register-candidate";
import { buildCandidateFromRawExtract } from "./build-candidate";
import { extractRawWebData } from "./html-extract";

describe("registerProductCandidate", () => {
  it("does not insert when required fields are missing", async () => {
    const insert = vi.fn();
    const db = {
      transaction: async (fn: (tx: { insertProduct: typeof insert }) => Promise<void>) =>
        fn({ insertProduct: insert }),
    };

    await expect(
      registerProductCandidate(db, {
        sourceUrl: "https://shop.example.com/products/demo-wheel-18",
        fetchedAt: new Date().toISOString(),
        name: "Demo Wheel",
        brand: "RAYS",
        description: null,
        priceMinYen: 100000,
        priceMaxYen: 90000,
        imageUrl: null,
        productUrl: "https://shop.example.com/products/demo-wheel-18",
        purchaseUrl: null,
        category: "ホイール",
        appearance: "unknown",
        comfort: "unknown",
        practicality: "unknown",
        resale: "unknown",
        style: "その他",
        tags: [],
      }),
    ).rejects.toThrow();

    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts with is_demo=false semantics via explicit register path", async () => {
    const insert = vi.fn().mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
    const db = {
      transaction: async (fn: (tx: { insertProduct: typeof insert }) => Promise<void>) =>
        fn({ insertProduct: insert }),
    };

    const result = await registerProductCandidate(db, {
      sourceUrl: "https://shop.example.com/products/demo-wheel-18",
      fetchedAt: new Date().toISOString(),
      name: "Demo Wheel",
      brand: "RAYS",
      description: "desc",
      priceMinYen: 100000,
      priceMaxYen: 120000,
      imageUrl: "https://cdn.example.com/images/demo-wheel.jpg",
      productUrl: "https://shop.example.com/products/demo-wheel-18",
      purchaseUrl: null,
      category: "ホイール",
      appearance: "unknown",
      comfort: "unknown",
      practicality: "unknown",
      resale: "unknown",
      style: "その他",
      tags: ["18インチ"],
    });

    expect(result.productId).toBe("11111111-1111-4111-8111-111111111111");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        isDemo: false,
        name: "Demo Wheel",
        category: "ホイール",
      }),
    );
  });

  it("requires category before converting candidate to register input", () => {
    const raw = extractRawWebData(
      "<html><title>Demo Wheel</title></html>",
      "https://shop.example.com/products/demo-wheel-18",
    );
    const candidate = buildCandidateFromRawExtract(raw);

    expect(() => toRegisterInputFromCandidate(candidate, {})).toThrow(RegisterProductCandidateError);
  });
});
