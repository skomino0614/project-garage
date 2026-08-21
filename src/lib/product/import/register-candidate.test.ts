import { describe, expect, it, vi } from "vitest";

import {
  registerProductCandidate,
  RegisterProductCandidateError,
  toRegisterInputFromCandidate,
} from "./register-candidate";
import { buildCandidateFromRawExtract } from "./build-candidate";
import { extractRawWebData } from "./html-extract";
import type { ProductImportTx } from "./product-import";

const PRODUCT_URL = "https://shop.example.com/products/demo-wheel-18";
const EXISTING_ID = "22222222-2222-4222-8222-222222222222";

function createRegisterDb(handlers: Partial<ProductImportTx> = {}) {
  return {
    transaction: async (fn: (tx: ProductImportTx) => Promise<void>) =>
      fn({
        insertProduct:
          handlers.insertProduct ??
          (async () => ({ id: "11111111-1111-4111-8111-111111111111" })),
        findProductIdByProductUrl:
          handlers.findProductIdByProductUrl ?? (async () => null),
        updateProductById: handlers.updateProductById ?? (async () => undefined),
      }),
  };
}

const validRegisterInput = {
  sourceUrl: PRODUCT_URL,
  fetchedAt: new Date().toISOString(),
  name: "Demo Wheel",
  brand: "RAYS",
  description: "desc",
  priceMinYen: 100000,
  priceMaxYen: 120000,
  imageUrl: "https://cdn.example.com/images/demo-wheel.jpg",
  productUrl: PRODUCT_URL,
  purchaseUrl: null,
  category: "ホイール" as const,
  appearance: "unknown" as const,
  comfort: "unknown" as const,
  practicality: "unknown" as const,
  resale: "unknown" as const,
  style: "その他" as const,
  tags: ["18インチ"],
};

describe("registerProductCandidate", () => {
  it("does not insert when required fields are missing", async () => {
    const insert = vi.fn();
    const db = createRegisterDb({ insertProduct: insert });

    await expect(
      registerProductCandidate(db, {
        ...validRegisterInput,
        priceMaxYen: 90000,
      }),
    ).rejects.toThrow();

    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts with is_demo=false semantics via explicit register path", async () => {
    const insert = vi.fn().mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
    const db = createRegisterDb({ insertProduct: insert });

    const result = await registerProductCandidate(db, validRegisterInput);

    expect(result.productId).toBe("11111111-1111-4111-8111-111111111111");
    expect(result.updated).toBe(false);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        isDemo: false,
        name: "Demo Wheel",
        category: "ホイール",
      }),
    );
  });

  it("updates existing product when product_url matches", async () => {
    const insert = vi.fn();
    const update = vi.fn();
    const db = createRegisterDb({
      findProductIdByProductUrl: async (url) => (url === PRODUCT_URL ? EXISTING_ID : null),
      insertProduct: insert,
      updateProductById: update,
    });

    const result = await registerProductCandidate(db, {
      ...validRegisterInput,
      name: "Updated Wheel",
    });

    expect(result.productId).toBe(EXISTING_ID);
    expect(result.updated).toBe(true);
    expect(insert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      EXISTING_ID,
      expect.objectContaining({
        name: "Updated Wheel",
      }),
    );
    expect(update).toHaveBeenCalledWith(
      EXISTING_ID,
      expect.not.objectContaining({
        isDemo: expect.anything(),
        isActive: expect.anything(),
      }),
    );
  });

  it("requires category before converting candidate to register input", () => {
    const raw = extractRawWebData(
      "<html><title>Demo Wheel</title></html>",
      PRODUCT_URL,
    );
    const candidate = buildCandidateFromRawExtract(raw);

    expect(() => toRegisterInputFromCandidate(candidate, {})).toThrow(RegisterProductCandidateError);
  });
});
