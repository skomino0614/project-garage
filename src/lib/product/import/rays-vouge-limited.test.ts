import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildCandidateFromRawExtract } from "./build-candidate";
import { extractRawWebData } from "./html-extract";
import {
  extractProductImageUrl,
  extractTablePrices,
  isBlockedProductImageUrl,
  isGenericSiteDescription,
  parseHtmlTables,
} from "./html-extract-product-page";

const raysHtml = readFileSync(
  resolve(process.cwd(), "test-data/rays-vouge-limited-182.html"),
  "utf8",
);

const raysUrl = "https://www.rayswheels.co.jp/products/brand/detail/182";

describe("html-extract-product-page", () => {
  it("extracts tax-included prices from product spec tables", () => {
    expect(extractTablePrices(raysHtml)).toEqual([69300, 79200, 93500]);
  });

  it("prefers tax-included column over tax-excluded column", () => {
    const html = `
      <table>
        <thead>
          <tr>
            <th>SIZE</th><th>P.C.D.</th><th>PRICE</th><th>PRICE(税込)</th>
          </tr>
        </thead>
        <tbody>
          <tr><th>18x7J</th><td>114.3</td><td>¥63,000</td><td>¥69,300</td></tr>
          <tr><th>20x8.5J</th><td>114.3</td><td>¥85,000</td><td>¥93,500</td></tr>
        </tbody>
      </table>
    `;

    expect(extractTablePrices(html)).toEqual([69300, 93500]);
  });

  it("ignores unrelated price tables without product spec headers", () => {
    const html = `
      <table>
        <thead><tr><th>Shipping</th><th>PRICE(税込)</th></tr></thead>
        <tbody><tr><td>Standard</td><td>¥1,500</td></tr></tbody>
      </table>
      <table>
        <thead><tr><th>SIZE</th><th>P.C.D.</th><th>PRICE</th><th>PRICE(税込)</th></tr></thead>
        <tbody><tr><th>18x7J</th><td>114.3</td><td>¥63,000</td><td>¥69,300</td></tr></tbody>
      </table>
    `;

    expect(extractTablePrices(html)).toEqual([69300]);
  });

  it("blocks common site-wide OGP images", () => {
    expect(isBlockedProductImageUrl("https://rays-wheels.net/assets/images/ogp.jpg")).toBe(true);
    expect(isBlockedProductImageUrl("/assets/images/pages/common/logo_rays.svg")).toBe(true);
  });

  it("selects product page image over blocked OGP image", () => {
    const imageUrl = extractProductImageUrl(raysUrl, {
      jsonLdImageUrl: null,
      ogImage: "https://rays-wheels.net/assets/images/ogp.jpg",
      html: raysHtml,
    });

    expect(imageUrl).toBe(
      "https://www.rayswheels.co.jp/lacne/news/upload/wheel/HP_VOUGE_BD2_5H_003.jpg",
    );
    expect(imageUrl).not.toContain("ogp.jpg");
  });

  it("detects generic site meta descriptions", () => {
    expect(
      isGenericSiteDescription(
        "RAYSの「Craft Collection VOUGE LIMITED」のページです。全車種対応の軽量・強靭なデザインを提供しています。",
      ),
    ).toBe(true);
    expect(isGenericSiteDescription("90系Voxy向けの18インチホイール")).toBe(false);
  });

  it("parses table headers and rows from HTML", () => {
    const tables = parseHtmlTables(`
      <table>
        <thead><tr><th>SIZE</th><th>P.C.D.</th><th>PRICE(税込)</th></tr></thead>
        <tbody><tr><th>18x7J</th><td>114.3</td><td>¥69,300</td></tr></tbody>
      </table>
    `);

    expect(tables[0]?.headers).toEqual(["SIZE", "P.C.D.", "PRICE(税込)"]);
    expect(tables[0]?.rows[0]).toEqual(["18x7J", "114.3", "¥69,300"]);
  });
});

describe("RAYS Craft Collection VOUGE LIMITED fixture", () => {
  it("builds import candidate with expected fields", () => {
    const raw = extractRawWebData(raysHtml, raysUrl);
    const candidate = buildCandidateFromRawExtract(raw);

    expect(candidate.name).toBe("Craft Collection VOUGE LIMITED");
    expect(candidate.brand).toBe("RAYS（株式会社レイズ）");
    expect(candidate.priceMinYen).toBe(69300);
    expect(candidate.priceMaxYen).toBe(93500);
    expect(candidate.imageUrl).toBe(
      "https://www.rayswheels.co.jp/lacne/news/upload/wheel/HP_VOUGE_BD2_5H_003.jpg",
    );
    expect(candidate.imageUrl).not.toContain("ogp.jpg");
    expect(candidate.productUrl).toBe(raysUrl);
    expect(candidate.purchaseUrl).toBeNull();
    expect(candidate.category).toBeNull();
    expect(candidate.description).toContain("デザインによるコントラスト");
    expect(candidate.description).not.toContain("全車種対応");
    expect(candidate.tags).toEqual(
      expect.arrayContaining(["18インチ", "19インチ", "20インチ", "5H", "P.C.D.114.3"]),
    );
    expect(candidate.warnings.some((warning) => warning.includes("適合車種"))).toBe(true);
  });

  it("does not infer 90系 Voxy compatibility", () => {
    const raw = extractRawWebData(raysHtml, raysUrl);
    const haystack = JSON.stringify({
      text: raw.visibleTextSample,
      tags: raw.specTags,
      description: raw.productDescription,
    });

    expect(haystack).not.toMatch(/voxy|ヴォクシー|90系/i);
  });

  it("falls back to null when product-specific data is missing", () => {
    const candidate = buildCandidateFromRawExtract(
      extractRawWebData("<html><head><title>Empty</title></head><body></body></html>", raysUrl),
    );

    expect(candidate.priceMinYen).toBeNull();
    expect(candidate.priceMaxYen).toBeNull();
    expect(candidate.imageUrl).toBeNull();
    expect(candidate.description).toBeNull();
    expect(candidate.tags).toEqual([]);
  });
});
