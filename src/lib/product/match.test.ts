import { describe, expect, it } from "vitest";

import type { FitmentType } from "./constants";
import type { ProductMatchInput } from "./match-types";
import { MATCH_SCORE_MAX } from "./match-types";
import {
  compareProductMatchResults,
  getVehicleCompatibilityStatus,
  rankProductMatches,
  scoreProductMatch,
} from "./match";
import type { Product, VehicleCompatibility } from "./types";

const baseVehicle = {
  maker: "Toyota",
  model: "Voxy",
  series: "90 Series",
};

const baseInput: ProductMatchInput = {
  vehicle: baseVehicle,
  budget: { maxYen: 200_000 },
  category: "ホイール",
  usage: null,
  stylePreference: null,
  priorities: {
    appearance: "unknown",
    comfort: "unknown",
    practicality: "unknown",
    resale: "unknown",
  },
};

function makeCompatibility(
  overrides: Partial<VehicleCompatibility> = {},
): VehicleCompatibility {
  return {
    maker: "Toyota",
    model: "Voxy",
    series: "90 Series",
    fitmentType: "confirmed",
    note: null,
    carMasterId: null,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    category: "ホイール",
    brand: "Test Brand",
    description: null,
    priceMinYen: 150_000,
    priceMaxYen: 180_000,
    imageUrl: null,
    productUrl: null,
    purchaseUrl: null,
    attributes: {
      appearance: "medium",
      comfort: "medium",
      practicality: "medium",
      resale: "medium",
    },
    style: "シンプル",
    tags: [],
    isActive: true,
    compatibilities: [makeCompatibility()],
    ...overrides,
  };
}

describe("rankProductMatches", () => {
  it("Test 1: prioritizes products matching budget, wheel category, appearance high, comfort high", () => {
    const input: ProductMatchInput = {
      ...baseInput,
      priorities: {
        appearance: "high",
        comfort: "high",
        practicality: "unknown",
        resale: "unknown",
      },
    };

    const good = makeProduct({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Good Wheel",
      attributes: {
        appearance: "high",
        comfort: "high",
        practicality: "medium",
        resale: "low",
      },
      priceMinYen: 180_000,
      priceMaxYen: 200_000,
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const weak = makeProduct({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Weak Wheel",
      attributes: {
        appearance: "low",
        comfort: "low",
        practicality: "high",
        resale: "high",
      },
      priceMinYen: 190_000,
      priceMaxYen: 200_000,
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const results = rankProductMatches([weak, good], input);

    expect(results).toHaveLength(2);
    expect(results[0]?.product.id).toBe(good.id);
    expect(results[0]?.score).toBeLessThanOrEqual(MATCH_SCORE_MAX);
    expect(results[0]?.reasons).toEqual(
      expect.arrayContaining(["車種適合", "予算内", "見た目の優先度と一致", "乗り心地の条件と一致"]),
    );
  });

  it("Test 2: ranks luxury style above sporty when user prefers luxury", () => {
    const input: ProductMatchInput = {
      ...baseInput,
      stylePreference: "高級感",
    };

    const luxury = makeProduct({
      id: "33333333-3333-4333-8333-333333333333",
      name: "Luxury Wheel",
      style: "高級感",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const sporty = makeProduct({
      id: "44444444-4444-4444-8444-444444444444",
      name: "Sporty Wheel",
      style: "スポーティ",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const results = rankProductMatches([sporty, luxury], input);

    expect(results[0]?.product.id).toBe(luxury.id);
    expect(results[0]?.reasons).toContain("スタイルと一致");
    expect(results[1]?.product.id).toBe(sporty.id);
  });

  it("Test 3: ranks 150k product above 300k product for 200k budget", () => {
    const affordable = makeProduct({
      id: "55555555-5555-4555-8555-555555555555",
      name: "Affordable Wheel",
      priceMinYen: 140_000,
      priceMaxYen: 150_000,
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const expensive = makeProduct({
      id: "66666666-6666-4666-8666-666666666666",
      name: "Expensive Wheel",
      priceMinYen: 280_000,
      priceMaxYen: 300_000,
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const results = rankProductMatches([expensive, affordable], baseInput);

    expect(results).toHaveLength(1);
    expect(results[0]?.product.id).toBe(affordable.id);
  });

  it("Test 4: ranks confirmed Voxy 90 Series fitment above unknown compatibility", () => {
    const confirmedProduct = makeProduct({
      id: "77777777-7777-4777-8777-777777777777",
      name: "Voxy Fit Wheel",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const unknown = makeProduct({
      id: "88888888-8888-4888-8888-888888888888",
      name: "Unknown Fit Wheel",
      compatibilities: [],
    });

    const results = rankProductMatches([unknown, confirmedProduct], baseInput);

    expect(results[0]?.product.id).toBe(confirmedProduct.id);
    expect(results[0]?.vehicleCompatibility).toBe("confirmed");
    expect(results[1]?.vehicleCompatibility).toBe("unknown");
  });

  it("Test 5: excludes products from a different category", () => {
    const wheel = makeProduct({
      id: "99999999-9999-4999-8999-999999999999",
      name: "Wheel Product",
      category: "ホイール",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const dashcam = makeProduct({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Dashcam Product",
      category: "ドラレコ",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const results = rankProductMatches([wheel, dashcam], baseInput);

    expect(results).toHaveLength(1);
    expect(results[0]?.product.category).toBe("ホイール");
  });

  it("Test 6: does not penalize when user priority is unknown", () => {
    const inputUnknown: ProductMatchInput = {
      ...baseInput,
      priorities: {
        appearance: "unknown",
        comfort: "unknown",
        practicality: "unknown",
        resale: "unknown",
      },
    };

    const inputHighAppearance: ProductMatchInput = {
      ...baseInput,
      priorities: {
        appearance: "high",
        comfort: "unknown",
        practicality: "unknown",
        resale: "unknown",
      },
    };

    const highAppearance = makeProduct({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "High Appearance Wheel",
      attributes: {
        appearance: "high",
        comfort: "medium",
        practicality: "medium",
        resale: "medium",
      },
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const lowAppearance = makeProduct({
      id: "bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc",
      name: "Low Appearance Wheel",
      attributes: {
        appearance: "low",
        comfort: "medium",
        practicality: "medium",
        resale: "medium",
      },
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const unknownResults = rankProductMatches(
      [highAppearance, lowAppearance],
      inputUnknown,
    );
    expect(unknownResults[0]?.score).toBe(unknownResults[1]?.score);
    expect(unknownResults[0]?.reasons).not.toContain("見た目の優先度と一致");

    const highResults = rankProductMatches(
      [lowAppearance, highAppearance],
      inputHighAppearance,
    );
    expect(highResults[0]?.product.id).toBe(highAppearance.id);
    expect(highResults[0]?.reasons).toContain("見た目の優先度と一致");
  });

  it("Test 7: does not penalize when stylePreference is null", () => {
    const luxury = makeProduct({
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      name: "Luxury Wheel",
      style: "高級感",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const sporty = makeProduct({
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      name: "Sporty Wheel",
      style: "スポーティ",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const withStyle = rankProductMatches([sporty, luxury], {
      ...baseInput,
      stylePreference: "高級感",
    });
    const withoutStyle = rankProductMatches([sporty, luxury], {
      ...baseInput,
      stylePreference: null,
    });

    expect(withStyle[0]?.product.id).toBe(luxury.id);
    expect(withoutStyle[0]?.score).toBe(withoutStyle[1]?.score);
  });

  it("Test 8: produces stable ordering for tied scores", () => {
    const productA = makeProduct({
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      name: "Wheel A",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const productB = makeProduct({
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      name: "Wheel B",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const firstRun = rankProductMatches([productB, productA], baseInput);
    const secondRun = rankProductMatches([productA, productB], baseInput);

    expect(firstRun.map((item) => item.product.id)).toEqual(
      secondRun.map((item) => item.product.id),
    );
    expect(compareProductMatchResults(firstRun[0]!, firstRun[1]!, baseInput)).toBeLessThan(0);
  });

  it("Test 9: returns an empty array when no products exist", () => {
    const results = rankProductMatches([], baseInput);
    expect(results).toEqual([]);
  });

  it("Test 10: excludes products far above budget", () => {
    const overBudget = makeProduct({
      id: "10101010-1010-4101-8101-101010101010",
      name: "Far Over Budget Wheel",
      priceMinYen: 350_000,
      priceMaxYen: 400_000,
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const result = scoreProductMatch(overBudget, baseInput);
    expect(result).toBeNull();
  });
});

describe("getVehicleCompatibilityStatus", () => {
  it("returns incompatible when registered fitment does not match", () => {
    const product = makeProduct({
      id: "12121212-1212-4121-8121-121212121212",
      name: "Other Vehicle Wheel",
      compatibilities: [
        makeCompatibility({
          maker: "Honda",
          model: "Stepwgn",
          series: "6th Gen",
          fitmentType: "confirmed",
        }),
      ],
    });

    expect(getVehicleCompatibilityStatus(product, baseVehicle)).toBe("incompatible");
  });

  it("returns unknown when no fitment is registered", () => {
    const product = makeProduct({
      id: "13131313-1313-4131-8131-131313131313",
      name: "No Fitment Wheel",
      compatibilities: [],
    });

    expect(getVehicleCompatibilityStatus(product, baseVehicle)).toBe("unknown");
  });

  it("returns confirmed when matching row has fitmentType confirmed", () => {
    const product = makeProduct({
      id: "14141414-1414-4141-8141-141414141414",
      name: "Confirmed Wheel",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    expect(getVehicleCompatibilityStatus(product, baseVehicle)).toBe("confirmed");
  });

  it("returns reference when matching row has fitmentType reference", () => {
    const product = makeProduct({
      id: "15151515-1515-4151-8151-151515151515",
      name: "Reference Wheel",
      compatibilities: [makeCompatibility({ fitmentType: "reference" })],
    });

    expect(getVehicleCompatibilityStatus(product, baseVehicle)).toBe("reference");
  });

  it("returns unknown when matching row has null fitmentType", () => {
    const product = makeProduct({
      id: "16161616-1616-4161-8161-161616161616",
      name: "Unclassified Wheel",
      compatibilities: [makeCompatibility({ fitmentType: null })],
    });

    expect(getVehicleCompatibilityStatus(product, baseVehicle)).toBe("unknown");
  });

  it("prefers confirmed over reference when both exist", () => {
    const product = makeProduct({
      id: "17171717-1717-4171-8171-171717171717",
      name: "Mixed Wheel",
      compatibilities: [
        makeCompatibility({ fitmentType: "reference" }),
        makeCompatibility({ fitmentType: "confirmed", series: "80 Series" }),
        makeCompatibility({ fitmentType: "confirmed" }),
      ],
    });

    expect(getVehicleCompatibilityStatus(product, baseVehicle)).toBe("confirmed");
  });
});

describe("Phase 8-2A match scoring", () => {
  it("A: reference compatibility adds fitment score and stays within 100", () => {
    const product = makeProduct({
      id: "6db66b2d-3c44-47c9-881f-2a1d60d07e8c",
      name: "Craft Collection VOUGE LIMITED",
      priceMinYen: 69_300,
      priceMaxYen: 93_500,
      compatibilities: [makeCompatibility({ fitmentType: "reference" })],
    });

    const result = scoreProductMatch(product, baseInput);

    expect(result).not.toBeNull();
    expect(result?.vehicleCompatibility).toBe("reference");
    expect(result?.reasons).toContain("参考適合");
    expect(result?.reasons).toContain("予算内");
    expect(result?.score).toBe(50);
    expect(result?.score).toBeLessThanOrEqual(MATCH_SCORE_MAX);
  });

  it("B: confirmed scores higher than reference for the same product terms", () => {
    const referenceProduct = makeProduct({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Reference Wheel",
      compatibilities: [makeCompatibility({ fitmentType: "reference" })],
    });

    const confirmedProduct = makeProduct({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Confirmed Wheel",
      compatibilities: [makeCompatibility({ fitmentType: "confirmed" })],
    });

    const referenceResult = scoreProductMatch(referenceProduct, baseInput);
    const confirmedResult = scoreProductMatch(confirmedProduct, baseInput);

    expect(referenceResult?.score).toBe(50);
    expect(confirmedResult?.score).toBe(60);
    expect(confirmedResult!.score).toBeGreaterThan(referenceResult!.score);
  });

  it("C: unknown compatibility remains a candidate with zero fitment score and no fitment reason", () => {
    const product = makeProduct({
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      name: "Unknown Wheel",
      compatibilities: [],
    });

    const result = scoreProductMatch(product, baseInput);

    expect(result).not.toBeNull();
    expect(result?.vehicleCompatibility).toBe("unknown");
    expect(result?.score).toBe(25);
    expect(result?.reasons).toEqual(["予算内"]);
    expect(result?.reasons).not.toContain("車種適合");
    expect(result?.reasons).not.toContain("参考適合");
  });

  it("D: incompatible Honda fitment is excluded for Voxy consultation", () => {
    const product = makeProduct({
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      name: "Honda Wheel",
      compatibilities: [
        makeCompatibility({
          maker: "Honda",
          model: "Stepwgn",
          series: "6th Gen",
          fitmentType: "confirmed" as FitmentType,
        }),
      ],
    });

    expect(scoreProductMatch(product, baseInput)).toBeNull();
    expect(rankProductMatches([product], baseInput)).toEqual([]);
  });
});
