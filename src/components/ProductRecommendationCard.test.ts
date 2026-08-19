import { describe, expect, it } from "vitest";

import { buildProductDetailHref, buildProductDetailLinkProps } from "@/lib/product/product-detail-link";

const sampleItem = {
  productId: "11111111-1111-4111-8111-111111111111",
  productUrl: null,
  purchaseUrl: null,
};

describe("ProductRecommendationCard detail navigation", () => {
  it("generates an internal detail link even when external URLs are null", () => {
    const link = buildProductDetailLinkProps(sampleItem.productId);

    expect(link.to).toBe("/products/$productId");
    expect(link.params.productId).toBe(sampleItem.productId);
    expect(link.href).toBe(buildProductDetailHref(sampleItem.productId));
    expect(link.href).not.toContain("null");
  });

  it("does not use productUrl or purchaseUrl for card navigation", () => {
    const externalProduct = {
      ...sampleItem,
      productUrl: "https://shop.example.com/product/demo",
      purchaseUrl: "https://shop.example.com/buy/demo",
    };

    const link = buildProductDetailLinkProps(externalProduct.productId);

    expect(link.href).toBe(`/products/${externalProduct.productId}`);
    expect(link.href).not.toBe(externalProduct.productUrl);
    expect(link.href).not.toBe(externalProduct.purchaseUrl);
  });
});
