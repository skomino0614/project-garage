import { describe, expect, it } from "vitest";

import {
  buildProductDetailHref,
  PRODUCT_DETAIL_ROUTE,
} from "@/lib/product/product-detail-link";

const sampleItem = {
  productId: "11111111-1111-4111-8111-111111111111",
  productUrl: null,
  purchaseUrl: null,
};

describe("ProductRecommendationCard detail navigation", () => {
  it("generates an internal detail href even when external URLs are null", () => {
    const href = buildProductDetailHref(sampleItem.productId);

    expect(href).toBe("/products/11111111-1111-4111-8111-111111111111");
    expect(PRODUCT_DETAIL_ROUTE).toBe("/products/$productId");
    expect(href).not.toContain("null");
  });

  it("does not use productUrl or purchaseUrl for card navigation", () => {
    const externalProduct = {
      ...sampleItem,
      productUrl: "https://shop.example.com/product/demo",
      purchaseUrl: "https://shop.example.com/buy/demo",
    };

    const href = buildProductDetailHref(externalProduct.productId);

    expect(href).toBe(`/products/${externalProduct.productId}`);
    expect(href).not.toBe(externalProduct.productUrl);
    expect(href).not.toBe(externalProduct.purchaseUrl);
  });
});
