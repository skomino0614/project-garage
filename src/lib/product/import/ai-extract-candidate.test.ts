import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { mergeAiExtractWithRaw, AiProductExtractSchema } from "./ai-extract-candidate";
import { extractRawWebData } from "./html-extract";
import { createProductImportCandidateFromUrl } from "./register-candidate";
import { fetchProductPageHtml } from "./fetch-page";

const sampleHtml = readFileSync(
  resolve(process.cwd(), "test-data/sample-product-page.html"),
  "utf8",
);

describe("AI extract validation", () => {
  it("validates structured output schema", () => {
    const parsed = AiProductExtractSchema.safeParse({
      name: "Demo Wheel 18インチ",
      brand: "RAYS",
      description: "90系Voxy向け",
      priceMinYen: 168000,
      priceMaxYen: 168000,
      imageUrl: "https://cdn.example.com/images/demo-wheel.jpg",
      purchaseUrl: null,
      category: null,
      appearance: null,
      comfort: null,
      practicality: null,
      resale: null,
      style: null,
      tags: null,
    });

    expect(parsed.success).toBe(true);
  });

  it("does not accept guessed values that are absent from raw evidence", () => {
    const raw = extractRawWebData(sampleHtml, "https://shop.example.com/products/demo-wheel-18");
    const merged = mergeAiExtractWithRaw(raw, {
      name: "Demo Wheel 18インチ",
      brand: "FAKE BRAND",
      description: "存在しない説明",
      priceMinYen: 999999,
      priceMaxYen: 999999,
      imageUrl: "https://evil.example.com/x.jpg",
      purchaseUrl: "https://evil.example.com/buy",
      category: "タイヤ",
      appearance: "high",
      comfort: "high",
      practicality: "high",
      resale: "high",
      style: "スポーティ",
      tags: ["存在しない"],
    });

    expect(merged.brand).toBe("RAYS");
    expect(merged.priceMinYen).toBe(168000);
    expect(merged.category).toBeNull();
    expect(merged.appearance).toBe("unknown");
    expect(merged.purchaseUrl).toBe("https://shop.example.com/cart/demo-wheel-18");
  });

  it("falls back safely when fetch fails", async () => {
    await expect(
      fetchProductPageHtml("https://shop.example.com/products/demo-wheel-18", {
        fetchImpl: vi.fn().mockRejectedValue(new Error("network down")),
      }),
    ).rejects.toThrow("network down");
  });

  it("creates candidate from mocked fetch without DB insert", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(sampleHtml, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const candidate = await createProductImportCandidateFromUrl(
      "https://shop.example.com/products/demo-wheel-18",
      { fetchImpl, useAi: false },
    );

    expect(candidate.name).toBe("Demo Wheel 18インチ");
    expect(candidate.brand).toBe("RAYS");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
