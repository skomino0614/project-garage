import { describe, expect, it } from "vitest";

import {
  extractProductDescription,
  extractProductImageUrl,
  extractSpecTags,
  extractTablePrices,
  isBlockedProductImageUrl,
  isGenericSiteDescription,
  parseYen,
} from "./html-extract-product-page";

describe("html-extract-product-page helpers", () => {
  it("parses yen strings", () => {
    expect(parseYen("¥69,300")).toBe(69300);
    expect(parseYen("69300")).toBe(69300);
    expect(parseYen("invalid")).toBeNull();
  });

  it("extracts spec tags only from page evidence", () => {
    const html = `
      <div class="specList__item">
        <div class="specHead">サイズ</div>
        <div class="specBody"><p class="specText">18inch/19inch</p></div>
      </div>
      <table>
        <thead><tr><th>SIZE</th><th>HOLE</th><th>P.C.D.</th><th>PRICE</th><th>PRICE(税込)</th></tr></thead>
        <tbody><tr><th>18x7J</th><td>5</td><td>114.3</td><td>¥63,000</td><td>¥69,300</td></tr></tbody>
      </table>
    `;

    expect(extractSpecTags(html)).toEqual(
      expect.arrayContaining(["18インチ", "19インチ", "5H", "P.C.D.114.3"]),
    );
  });

  it("extracts product-specific description from page body", () => {
    const html = `
      <h2 class="leadText">商品固有リード</h2>
      <p class="detailText">商品固有の説明文です。</p>
    `;

    expect(extractProductDescription(html)).toBe("商品固有リード\n\n商品固有の説明文です。");
  });

  it("returns null image when only blocked common assets exist", () => {
    const imageUrl = extractProductImageUrl("https://shop.example.com/products/1", {
      jsonLdImageUrl: null,
      ogImage: "https://shop.example.com/assets/images/ogp.jpg",
      html: '<img src="/assets/images/pages/common/logo.svg" />',
    });

    expect(imageUrl).toBeNull();
    expect(isBlockedProductImageUrl("https://shop.example.com/favicon.ico")).toBe(true);
  });

  it("treats missing description as generic", () => {
    expect(isGenericSiteDescription(null)).toBe(true);
    expect(extractTablePrices("<html></html>")).toEqual([]);
  });
});
