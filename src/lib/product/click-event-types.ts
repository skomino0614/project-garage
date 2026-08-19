export const PRODUCT_CLICK_EVENT_TYPES = ["product_detail", "purchase_click"] as const;

export type ProductClickEventType = (typeof PRODUCT_CLICK_EVENT_TYPES)[number];

export function isProductClickEventType(value: string): value is ProductClickEventType {
  return PRODUCT_CLICK_EVENT_TYPES.includes(value as ProductClickEventType);
}

export type ProductClickCount = {
  productId: string;
  productDetailCount: number;
  purchaseClickCount: number;
};

export function createEmptyProductClickCount(productId: string): ProductClickCount {
  return {
    productId,
    productDetailCount: 0,
    purchaseClickCount: 0,
  };
}

export function incrementProductClickCount(
  counts: ProductClickCount,
  eventType: ProductClickEventType,
): ProductClickCount {
  if (eventType === "product_detail") {
    return {
      ...counts,
      productDetailCount: counts.productDetailCount + 1,
    };
  }

  return {
    ...counts,
    purchaseClickCount: counts.purchaseClickCount + 1,
  };
}
