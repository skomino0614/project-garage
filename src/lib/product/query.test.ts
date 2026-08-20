import { describe, expect, it } from "vitest";

import { ALL_DEMO_PRODUCT_ID_LIST } from "@/lib/product/demo-product-ids";
import { isProductEligibleForRecommendation } from "@/lib/product/query";

describe("isProductEligibleForRecommendation", () => {
  const activeReal = { isActive: true, isDemo: false };
  const activeDemo = { isActive: true, isDemo: true };
  const inactiveReal = { isActive: false, isDemo: false };

  it("includes active real products by default", () => {
    expect(isProductEligibleForRecommendation(activeReal)).toBe(true);
  });

  it("excludes demo products by default", () => {
    expect(isProductEligibleForRecommendation(activeDemo)).toBe(false);
  });

  it("includes demo products when includeDemo is true", () => {
    expect(isProductEligibleForRecommendation(activeDemo, { includeDemo: true })).toBe(true);
  });

  it("excludes inactive products", () => {
    expect(isProductEligibleForRecommendation(inactiveReal)).toBe(false);
  });
});

describe("demo product ids", () => {
  it("lists all 18 stable demo ids", () => {
    expect(ALL_DEMO_PRODUCT_ID_LIST).toHaveLength(18);
  });
});
