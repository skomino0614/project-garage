import type { ProductRecommendationDisplayItem } from "./recommend-schemas";

const STORAGE_PREFIX = "garage:product-recommendation:";

export type StoredProductRecommendationContext = Pick<
  ProductRecommendationDisplayItem,
  "productId" | "reason" | "highlights" | "caution" | "score" | "vehicleCompatibility" | "compatibilities"
>;

export function saveProductRecommendationContext(item: ProductRecommendationDisplayItem): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  const payload: StoredProductRecommendationContext = {
    productId: item.productId,
    reason: item.reason,
    highlights: item.highlights,
    caution: item.caution,
    score: item.score,
    vehicleCompatibility: item.vehicleCompatibility,
    compatibilities: item.compatibilities,
  };

  sessionStorage.setItem(`${STORAGE_PREFIX}${item.productId}`, JSON.stringify(payload));
}

export function loadProductRecommendationContext(
  productId: string,
): StoredProductRecommendationContext | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${productId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredProductRecommendationContext;
    if (parsed.productId !== productId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
