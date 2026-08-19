import { describe, expect, it } from "vitest";

import {
  buildProductDetailHref,
  buildProductDetailLinkProps,
  shouldShowInternalProductDetailLink,
} from "./product-detail-link";

describe("product detail link", () => {
  const productId = "11111111-1111-4111-8111-111111111111";

  it("builds an internal href from productId", () => {
    expect(buildProductDetailHref(productId)).toBe("/products/11111111-1111-4111-8111-111111111111");
  });

  it("builds router link props for ProductRecommendationCard", () => {
    expect(buildProductDetailLinkProps(productId)).toEqual({
      to: "/products/$productId",
      params: { productId },
      href: "/products/11111111-1111-4111-8111-111111111111",
    });
  });

  it("always allows internal navigation when external URLs are null", () => {
    expect(
      shouldShowInternalProductDetailLink({
        productUrl: null,
        purchaseUrl: null,
      }),
    ).toBe(true);
  });

  it("still allows internal navigation when external URLs exist", () => {
    expect(
      shouldShowInternalProductDetailLink({
        productUrl: "https://example.com/product",
        purchaseUrl: "https://example.com/buy",
      }),
    ).toBe(true);
  });
});
