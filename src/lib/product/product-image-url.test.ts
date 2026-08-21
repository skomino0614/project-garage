import { describe, expect, it } from "vitest";

import { getSafeProductImageUrl, isPlaceholderProductImageUrl } from "./product-image-url";

describe("product-image-url", () => {
  it("accepts a normal external product image URL", () => {
    const url = "https://www.rayswheels.co.jp/lacne/news/upload/wheel/HP_VOUGE_BD2_5H_003.jpg";
    expect(getSafeProductImageUrl(url)).toBe(url);
    expect(isPlaceholderProductImageUrl(url)).toBe(false);
  });

  it("rejects example.com placeholder URLs", () => {
    expect(getSafeProductImageUrl("https://example.com/images/daytona.jpg")).toBeNull();
    expect(isPlaceholderProductImageUrl("https://example.com/images/daytona.jpg")).toBe(true);
  });

  it("rejects blocked common site assets", () => {
    expect(getSafeProductImageUrl("https://shop.example.com/assets/images/ogp.jpg")).toBeNull();
  });

  it("rejects placeholder asset paths", () => {
    expect(
      getSafeProductImageUrl("https://www.rayswheels.co.jp/assets/images/pages/common/placeholder.webp"),
    ).toBeNull();
  });

  it("returns null for empty or invalid URLs", () => {
    expect(getSafeProductImageUrl(null)).toBeNull();
    expect(getSafeProductImageUrl("")).toBeNull();
    expect(getSafeProductImageUrl("not-a-url")).toBeNull();
  });

  it("resolves relative-looking blocked paths after absolute conversion is handled upstream", () => {
    expect(
      getSafeProductImageUrl("https://images.demo.invalid/images/demo-wheel.jpg"),
    ).toBe("https://images.demo.invalid/images/demo-wheel.jpg");
  });
});
