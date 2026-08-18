import { describe, expect, it } from "vitest";

import type { ProductMatchInput } from "./match-types";
import {
  compareProductMatchResults,
  getVehicleCompatibilityStatus,
  rankProductMatches,
  scoreProductMatch,
} from "./match";
import type { Product } from "./types";

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
    compatibilities: [],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const results = rankProductMatches([weak, good], input);

    expect(results).toHaveLength(2);
    expect(results[0]?.product.id).toBe(good.id);
    expect(results[0]?.reasons).toEqual(
      expect.arrayContaining(["予算内", "見た目の優先度と一致", "乗り心地の条件と一致"]),
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const sporty = makeProduct({
      id: "44444444-4444-4444-8444-444444444444",
      name: "Sporty Wheel",
      style: "スポーティ",
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const expensive = makeProduct({
      id: "66666666-6666-4666-8666-666666666666",
      name: "Expensive Wheel",
      priceMinYen: 280_000,
      priceMaxYen: 300_000,
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const results = rankProductMatches([expensive, affordable], baseInput);

    expect(results).toHaveLength(1);
    expect(results[0]?.product.id).toBe(affordable.id);
  });

  it("Test 4: ranks explicit Voxy 90 Series fitment above unknown compatibility", () => {
    const compatible = makeProduct({
      id: "77777777-7777-4777-8777-777777777777",
      name: "Voxy Fit Wheel",
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const unknown = makeProduct({
      id: "88888888-8888-4888-8888-888888888888",
      name: "Unknown Fit Wheel",
      compatibilities: [],
    });

    const results = rankProductMatches([unknown, compatible], baseInput);

    expect(results[0]?.product.id).toBe(compatible.id);
    expect(results[0]?.vehicleCompatibility).toBe("compatible");
    expect(results[1]?.vehicleCompatibility).toBe("unknown");
  });

  it("Test 5: excludes products from a different category", () => {
    const wheel = makeProduct({
      id: "99999999-9999-4999-8999-999999999999",
      name: "Wheel Product",
      category: "ホイール",
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const dashcam = makeProduct({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Dashcam Product",
      category: "ドラレコ",
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const sporty = makeProduct({
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      name: "Sporty Wheel",
      style: "スポーティ",
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
    });

    const productB = makeProduct({
      id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      name: "Wheel B",
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
      compatibilities: [
        {
          maker: "Toyota",
          model: "Voxy",
          series: "90 Series",
          note: null,
          carMasterId: null,
        },
      ],
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
        {
          maker: "Honda",
          model: "Stepwgn",
          series: "6th Gen",
          note: null,
          carMasterId: null,
        },
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
});
