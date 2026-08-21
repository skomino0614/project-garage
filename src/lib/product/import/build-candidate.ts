import type { PriorityLevel, ProductCategory, ProductStyle } from "@/lib/product/constants";
import { getSafeExternalUrl } from "@/lib/product/external-url";

import type { RawWebExtract } from "./html-extract";
import { isGenericSiteDescription } from "./html-extract-product-page";

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

function pickDescription(raw: RawWebExtract, jsonLdDescription: string | null | undefined): string | null {
  if (jsonLdDescription?.trim()) {
    return jsonLdDescription;
  }

  if (raw.productDescription?.trim()) {
    return raw.productDescription;
  }

  const metaCandidates = [raw.ogDescription, raw.metaDescription].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const candidate of metaCandidates) {
    if (!isGenericSiteDescription(candidate)) {
      return candidate;
    }
  }

  return null;
}

function cleanProductName(raw: RawWebExtract, jsonLdName: string | null | undefined): string | null {
  return jsonLdName ?? raw.productNameFromTitle ?? raw.ogTitle ?? raw.title ?? null;
}

export function buildCandidateFromRawExtract(raw: RawWebExtract): ProductImportCandidate {
  const warnings: string[] = [];
  const jsonLd = raw.jsonLdProducts[0] ?? null;

  const name = cleanProductName(raw, jsonLd?.name);
  const brand = jsonLd?.brand ?? raw.brandFromTitle ?? null;
  const description = pickDescription(raw, jsonLd?.description);
  const imageUrl = getSafeExternalUrl(raw.productImageUrl ?? jsonLd?.imageUrl ?? null);
  const productUrl = getSafeExternalUrl(raw.canonicalUrl ?? raw.sourceUrl);

  const prices = raw.tablePrices.length > 0 ? raw.tablePrices : (jsonLd?.prices ?? []);
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
  if (!description) {
    warnings.push("商品説明をページから特定できませんでした。");
  }

  warnings.push("カテゴリはページから自動判定しないため、登録前に人手で設定してください。");
  warnings.push("適合車種は商品ページから自動抽出しません。");

  const hasJsonLd = Boolean(jsonLd);
  const hasStructuredPageData =
    raw.tablePrices.length > 0 || Boolean(raw.productDescription) || Boolean(raw.productImageUrl);
  const hasMeta = Boolean(raw.ogTitle || raw.metaDescription || raw.title);

  const extractionSource = hasJsonLd
    ? hasMeta || hasStructuredPageData
      ? ("mixed" as const)
      : ("json-ld" as const)
    : hasStructuredPageData
      ? ("mixed" as const)
      : hasMeta
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
    tags: raw.specTags,
    warnings,
    extractionSource,
  };
}
