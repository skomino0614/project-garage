import { describe, expect, it } from "vitest";

import {
  createEmptyProductClickCount,
  incrementProductClickCount,
  isProductClickEventType,
} from "./click-event-types";
import { canRecordProductClick } from "./click-events";

describe("product click event types", () => {
  it("recognizes supported event types", () => {
    expect(isProductClickEventType("product_detail")).toBe(true);
    expect(isProductClickEventType("purchase_click")).toBe(true);
    expect(isProductClickEventType("affiliate_click")).toBe(false);
  });

  it("increments click counts by event type", () => {
    const initial = createEmptyProductClickCount("11111111-1111-4111-8111-111111111111");

    const afterDetail = incrementProductClickCount(initial, "product_detail");
    const afterPurchase = incrementProductClickCount(afterDetail, "purchase_click");

    expect(afterDetail.productDetailCount).toBe(1);
    expect(afterDetail.purchaseClickCount).toBe(0);
    expect(afterPurchase.purchaseClickCount).toBe(1);
  });
});

describe("canRecordProductClick", () => {
  const activeProduct = {
    id: "11111111-1111-4111-8111-111111111111",
    isActive: true,
    purchaseUrl: "https://example.com/buy",
  };

  it("records product_detail for active products", () => {
    expect(canRecordProductClick(activeProduct, "product_detail")).toBe(true);
  });

  it("records purchase_click only when purchaseUrl exists", () => {
    expect(canRecordProductClick(activeProduct, "purchase_click")).toBe(true);
    expect(
      canRecordProductClick({ ...activeProduct, purchaseUrl: null }, "purchase_click"),
    ).toBe(false);
    expect(
      canRecordProductClick({ ...activeProduct, purchaseUrl: "   " }, "purchase_click"),
    ).toBe(false);
  });

  it("does not record clicks for missing or inactive products", () => {
    expect(canRecordProductClick(null, "product_detail")).toBe(false);
    expect(canRecordProductClick({ ...activeProduct, isActive: false }, "product_detail")).toBe(
      false,
    );
    expect(canRecordProductClick({ ...activeProduct, isActive: false }, "purchase_click")).toBe(
      false,
    );
  });
});
