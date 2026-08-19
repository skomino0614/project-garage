import { describe, expect, it } from "vitest";

import { ProductSchema, VehicleCompatibilitySchema } from "./schemas";

const validProduct = {
  category: "ホイール" as const,
  name: "Sample Wheel",
  brand: "Sample Brand",
  description: "Test wheel for minivan",
  priceMinYen: 180_000,
  priceMaxYen: 220_000,
  imageUrl: "https://example.com/wheel.jpg",
  productUrl: "https://example.com/products/wheel",
  purchaseUrl: "https://example.com/buy/wheel",
  attributes: {
    appearance: "high" as const,
    comfort: "medium" as const,
    practicality: "medium" as const,
    resale: "low" as const,
  },
  style: "高級感" as const,
  tags: ["18インチ", "メッシュ", "ミニバン向け"],
  isActive: true,
  compatibilities: [
    {
      maker: "Toyota",
      model: "Voxy",
      series: "90 Series",
      note: "90系向け",
      carMasterId: null,
    },
  ],
};

describe("ProductSchema", () => {
  it("accepts valid product data", () => {
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("keeps priceMinYen and priceMaxYen as numbers", () => {
    const result = ProductSchema.parse(validProduct);
    expect(typeof result.priceMinYen).toBe("number");
    expect(typeof result.priceMaxYen).toBe("number");
    expect(result.priceMinYen).toBe(180_000);
    expect(result.priceMaxYen).toBe(220_000);
  });

  it("rejects unknown category", () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      category: "不明カテゴリ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority values", () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      attributes: {
        ...validProduct.attributes,
        appearance: "very-high",
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts vehicle compatibility entries", () => {
    const result = VehicleCompatibilitySchema.safeParse(validProduct.compatibilities[0]);
    expect(result.success).toBe(true);

    const product = ProductSchema.parse(validProduct);
    expect(product.compatibilities).toHaveLength(1);
    expect(product.compatibilities[0]?.maker).toBe("Toyota");
    expect(product.compatibilities[0]?.model).toBe("Voxy");
    expect(product.compatibilities[0]?.series).toBe("90 Series");
  });

  it("rejects priceMaxYen less than priceMinYen", () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      priceMinYen: 250_000,
      priceMaxYen: 200_000,
    });
    expect(result.success).toBe(false);
  });
});
