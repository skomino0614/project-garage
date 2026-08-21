import { describe, expect, it } from "vitest";

import {
  isConsultPath,
  isConsultSessionEndPath,
  isProductDetailPath,
  shouldClearConsultStateOnLeave,
} from "./consult-session-navigation";

describe("consult session navigation", () => {
  it("detects product detail paths", () => {
    expect(isProductDetailPath("/products/abc-123")).toBe(true);
    expect(isProductDetailPath("/products/abc-123/")).toBe(true);
    expect(isProductDetailPath("/consult")).toBe(false);
    expect(isProductDetailPath("/products")).toBe(false);
  });

  it("detects consult paths", () => {
    expect(isConsultPath("/consult")).toBe(true);
    expect(isConsultPath("/products/abc")).toBe(false);
  });

  it("detects session end paths", () => {
    expect(isConsultSessionEndPath("/")).toBe(true);
    expect(isConsultSessionEndPath("/select")).toBe(true);
    expect(isConsultSessionEndPath("/ask")).toBe(true);
    expect(isConsultSessionEndPath("/consult")).toBe(false);
    expect(isConsultSessionEndPath("/products/abc")).toBe(false);
  });

  it("preserves state when leaving to product detail or consult", () => {
    expect(shouldClearConsultStateOnLeave("/products/11111111-1111-4111-8111-111111111111")).toBe(
      false,
    );
    expect(
      shouldClearConsultStateOnLeave("/consult?maker=Toyota&model=Voxy&series=90%20Series"),
    ).toBe(false);
  });

  it("clears state when leaving to TOP, select, or ask", () => {
    expect(shouldClearConsultStateOnLeave("/")).toBe(true);
    expect(shouldClearConsultStateOnLeave("/select")).toBe(true);
    expect(shouldClearConsultStateOnLeave("/ask")).toBe(true);
  });
});
