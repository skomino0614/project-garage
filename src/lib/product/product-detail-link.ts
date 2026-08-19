export const PRODUCT_DETAIL_ROUTE = "/products/$productId" as const;

export function buildProductDetailHref(productId: string): string {
  return `/products/${productId}`;
}

export function buildProductDetailLinkProps(productId: string): {
  to: typeof PRODUCT_DETAIL_ROUTE;
  params: { productId: string };
  href: string;
} {
  return {
    to: PRODUCT_DETAIL_ROUTE,
    params: { productId },
    href: buildProductDetailHref(productId),
  };
}

/** Internal detail navigation is always available, regardless of external URLs. */
export function shouldShowInternalProductDetailLink(_product: {
  productUrl: string | null;
  purchaseUrl: string | null;
}): boolean {
  return true;
}
