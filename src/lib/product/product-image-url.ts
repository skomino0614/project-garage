import { getSafeExternalUrl } from "./external-url";
import { isBlockedProductImageUrl } from "./import/html-extract-product-page";

/** Host/path patterns that are not valid product hero images for production catalog. */
const PLACEHOLDER_IMAGE_URL_PATTERNS = [
  /(?:^|\/)example\.com(?:\/|$)/i,
  /example\.(jpg|jpeg|png|webp|gif|svg)/i,
  /\/placeholder(?:\/|\.)/i,
  /placeholder\.(?:jpg|jpeg|png|webp|gif|svg)/i,
  /dummy/i,
  /no[-_]?image/i,
];

export function isPlaceholderProductImageUrl(url: string): boolean {
  const normalized = url.trim();
  if (!normalized) {
    return true;
  }

  return PLACEHOLDER_IMAGE_URL_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Returns a safe product image URL or null when unusable for display/storage. */
export function getSafeProductImageUrl(url: string | null | undefined): string | null {
  const safe = getSafeExternalUrl(url);
  if (!safe) {
    return null;
  }

  if (isPlaceholderProductImageUrl(safe) || isBlockedProductImageUrl(safe)) {
    return null;
  }

  return safe;
}
