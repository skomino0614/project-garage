import type { PriorityLevel, ProductCategory, ProductStyle } from "@/lib/product/constants";
import { getSafeExternalUrl } from "@/lib/product/external-url";

import type { RawWebExtract } from "./html-extract";

export type ProductImportCandidate = {
  sourceUrl: string;
  fetchedAt: string;
  name: string | null;
  brand: string | null;
  description: string | null;
  priceMinYen: number | null;
  priceMaxYen: number | null;
  imageUrl: string | null;
  productUrl: string | null;
  purchaseUrl: string | null;
  category: ProductCategory | null;
  appearance: PriorityLevel;
  comfort: PriorityLevel;
  practicality: PriorityLevel;
  resale: PriorityLevel;
  style: ProductStyle | null;
  tags: string[];
  warnings: string[];
  extractionSource: "json-ld" | "meta" | "mixed" | "ai" | "none";
};

function pickPriceRange(prices: number[]): { min: number | null; max: number | null } {
  if (prices.length === 0) {
    return { min: null, max: null };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max };
}

export function buildCandidateFromRawExtract(raw: RawWebExtract): ProductImportCandidate {
  const warnings: string[] = [];
  const jsonLd = raw.jsonLdProducts[0] ?? null;

  const name = jsonLd?.name ?? raw.ogTitle ?? raw.title;
  const brand = jsonLd?.brand ?? null;
  const description = jsonLd?.description ?? raw.ogDescription ?? raw.metaDescription;
  const imageUrl = getSafeExternalUrl(jsonLd?.imageUrl ?? raw.ogImage);
  const productUrl = getSafeExternalUrl(raw.canonicalUrl ?? raw.sourceUrl);

  const prices = jsonLd?.prices ?? [];
  const { min: priceMinYen, max: priceMaxYen } = pickPriceRange(prices);

  let purchaseUrl: string | null = null;
  if (jsonLd?.purchaseUrl) {
    purchaseUrl = getSafeExternalUrl(jsonLd.purchaseUrl);
  } else if (raw.purchaseLinks.length === 1) {
    purchaseUrl = getSafeExternalUrl(raw.purchaseLinks[0] ?? null);
  } else if (raw.purchaseLinks.length > 1) {
    warnings.push("複数の購入リンクが見つかったため purchase_url は未設定です。");
  }

  if (!name) {
    warnings.push("商品名をページから特定できませんでした。");
  }
  if (!brand) {
    warnings.push("ブランド情報がページに見つかりませんでした。");
  }
  if (priceMinYen === null || priceMaxYen === null) {
    warnings.push("価格情報がページに見つかりませんでした。");
  }
  if (!imageUrl) {
    warnings.push("画像URLがページに見つかりませんでした。");
  }

  warnings.push("カテゴリはページから自動判定しないため、登録前に人手で設定してください。");
  warnings.push("適合車種は商品ページから自動抽出しません。");

  const extractionSource = jsonLd
    ? raw.ogTitle || raw.metaDescription
      ? ("mixed" as const)
      : ("json-ld" as const)
    : raw.ogTitle || raw.metaDescription || raw.title
      ? ("meta" as const)
      : ("none" as const);

  return {
    sourceUrl: raw.sourceUrl,
    fetchedAt: raw.fetchedAt,
    name: name ?? null,
    brand,
    description: description ?? null,
    priceMinYen,
    priceMaxYen,
    imageUrl,
    productUrl,
    purchaseUrl,
    category: null,
    appearance: "unknown",
    comfort: "unknown",
    practicality: "unknown",
    resale: "unknown",
    style: null,
    tags: [],
    warnings,
    extractionSource,
  };
}
