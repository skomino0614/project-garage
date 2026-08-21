import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildCandidateFromRawExtract } from "./build-candidate";
import { extractRawWebData } from "./html-extract";

const sampleHtml = readFileSync(
  resolve(process.cwd(), "test-data/sample-product-page.html"),
  "utf8",
);

describe("html extract", () => {
  it("extracts JSON-LD Product fields", () => {
    const raw = extractRawWebData(sampleHtml, "https://shop.example.com/products/demo-wheel-18");
    expect(raw.jsonLdProducts[0]).toMatchObject({
      name: "Demo Wheel 18インチ",
      brand: "RAYS",
      prices: [168000],
    });
  });

  it("falls back to OG/meta fields", () => {
    const raw = extractRawWebData(sampleHtml, "https://shop.example.com/products/demo-wheel-18");
    expect(raw.ogTitle).toBe("Demo Wheel 18インチ");
    expect(raw.metaDescription).toContain("90系Voxy");
  });

  it("builds candidate without guessing category or compatibility", () => {
    const raw = extractRawWebData(sampleHtml, "https://shop.example.com/products/demo-wheel-18");
    const candidate = buildCandidateFromRawExtract(raw);

    expect(candidate.name).toBe("Demo Wheel 18インチ");
    expect(candidate.brand).toBe("RAYS");
    expect(candidate.priceMinYen).toBe(168000);
    expect(candidate.priceMaxYen).toBe(168000);
    expect(candidate.imageUrl).toBe("https://cdn.example.com/images/demo-wheel.jpg");
    expect(candidate.productUrl).toBe("https://shop.example.com/products/demo-wheel-18");
    expect(candidate.purchaseUrl).toBe("https://shop.example.com/cart/demo-wheel-18");
    expect(candidate.category).toBeNull();
    expect(candidate.appearance).toBe("unknown");
    expect(candidate.tags).toEqual([]);
    expect(candidate.warnings.some((warning) => warning.includes("カテゴリ"))).toBe(true);
  });
});
