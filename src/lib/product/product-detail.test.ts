import { describe, expect, it } from "vitest";

import { getSafeExternalUrl } from "./external-url";

describe("product detail response safety", () => {
  it("sanitizes unsafe product and purchase URLs", () => {
    expect(getSafeExternalUrl("https://shop.example.com/item")).toBe("https://shop.example.com/item");
    expect(getSafeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeExternalUrl(null)).toBeNull();
  });

  it("supports demo products with null URLs", () => {
    expect(getSafeExternalUrl(null)).toBeNull();
    expect(getSafeExternalUrl("")).toBeNull();
  });
});

describe("product detail page scenarios", () => {
  it("hides purchase button when purchaseUrl is missing", () => {
    const purchaseUrl = getSafeExternalUrl(null);
    expect(purchaseUrl).toBeNull();
  });

  it("allows optional productUrl link when present", () => {
    const productUrl = getSafeExternalUrl("https://maker.example.com/product/demo");
    expect(productUrl).toBe("https://maker.example.com/product/demo");
  });

  it("supports imageUrl-less demo products via null imageUrl", () => {
    expect(getSafeExternalUrl(null)).toBeNull();
  });
});
