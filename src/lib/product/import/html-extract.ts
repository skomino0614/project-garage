import { getSafeExternalUrl } from "@/lib/product/external-url";

import {
  extractBrandFromTitle,
  extractPricesFromHtml,
  extractProductDescription,
  extractProductImageUrl,
  extractProductNameFromTitle,
  extractSpecTags,
  extractTablePrices,
  isGenericSiteDescription,
  parseYen,
} from "./html-extract-product-page";

export type JsonLdProductExtract = {
  name: string | null;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  purchaseUrl: string | null;
  prices: number[];
};

export type RawWebExtract = {
  sourceUrl: string;
  fetchedAt: string;
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  jsonLdProducts: JsonLdProductExtract[];
  purchaseLinks: string[];
  visibleTextSample: string | null;
  tablePrices: number[];
  productDescription: string | null;
  productImageUrl: string | null;
  specTags: string[];
  brandFromTitle: string | null;
  productNameFromTitle: string | null;
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function readMetaContent(html: string, attr: "property" | "name", key: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["'][^>]*>`,
    "i",
  );

  const match = html.match(pattern) ?? html.match(reversePattern);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function readTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? stripTags(match[1]) : null;
}

function readCanonical(html: string): string | null {
  const match =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return match?.[1] ? getSafeExternalUrl(match[1].trim()) : null;
}

function readJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = pattern.exec(html);

  while (match) {
    const raw = match[1]?.trim();
    if (raw) {
      try {
        blocks.push(JSON.parse(raw));
      } catch {
        // ignore invalid JSON-LD blocks
      }
    }
    match = pattern.exec(html);
  }

  return blocks;
}

function isProductType(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const typeValue = (value as { ["@type"]?: unknown })["@type"];
  if (typeof typeValue === "string") {
    return typeValue.toLowerCase().includes("product");
  }

  if (Array.isArray(typeValue)) {
    return typeValue.some((entry) => typeof entry === "string" && entry.toLowerCase().includes("product"));
  }

  return false;
}

function flattenNodes(block: unknown): unknown[] {
  if (Array.isArray(block)) {
    return block.flatMap(flattenNodes);
  }

  if (typeof block !== "object" || block === null) {
    return [];
  }

  const record = block as Record<string, unknown>;
  const graph = record["@graph"];
  if (Array.isArray(graph)) {
    return graph.flatMap(flattenNodes);
  }

  return [block];
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

function readBrand(value: unknown): string | null {
  if (typeof value === "string") {
    return readString(value);
  }

  if (typeof value === "object" && value !== null) {
    return readString((value as { name?: unknown }).name);
  }

  return null;
}

function readImage(value: unknown): string | null {
  if (typeof value === "string") {
    return getSafeExternalUrl(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const image = readImage(entry);
      if (image) {
        return image;
      }
    }
    return null;
  }

  if (typeof value === "object" && value !== null) {
    return getSafeExternalUrl(readString((value as { url?: unknown }).url));
  }

  return null;
}

function readOffers(node: Record<string, unknown>): { prices: number[]; purchaseUrl: string | null } {
  const offers = node.offers;
  const offerList = Array.isArray(offers) ? offers : offers ? [offers] : [];
  const prices: number[] = [];
  let purchaseUrl: string | null = null;

  for (const offer of offerList) {
    if (typeof offer !== "object" || offer === null) {
      continue;
    }

    const offerRecord = offer as Record<string, unknown>;
    const price = parseYen(offerRecord.price ?? offerRecord.lowPrice ?? offerRecord.highPrice);
    if (price !== null) {
      prices.push(price);
    }

    const offerUrl = getSafeExternalUrl(readString(offerRecord.url));
    if (offerUrl) {
      purchaseUrl = offerUrl;
    }
  }

  return { prices, purchaseUrl };
}

function extractJsonLdProduct(node: unknown): JsonLdProductExtract | null {
  if (!isProductType(node) || typeof node !== "object" || node === null) {
    return null;
  }

  const record = node as Record<string, unknown>;
  const offers = readOffers(record);

  return {
    name: readString(record.name),
    brand: readBrand(record.brand),
    description: readString(record.description),
    imageUrl: readImage(record.image),
    purchaseUrl: offers.purchaseUrl,
    prices: offers.prices,
  };
}

function readPurchaseLinks(html: string): string[] {
  const links = new Set<string>();
  const pattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = pattern.exec(html);

  while (match) {
    const href = getSafeExternalUrl(match[1]);
    const label = stripTags(match[2] ?? "").toLowerCase();
    if (
      href &&
      (label.includes("購入") ||
        label.includes("カート") ||
        label.includes("buy") ||
        label.includes("shop now"))
    ) {
      links.add(href);
    }
    match = pattern.exec(html);
  }

  if (links.size === 0) {
    return [];
  }

  return [...links];
}

export function extractRawWebData(html: string, sourceUrl: string, fetchedAt = new Date().toISOString()): RawWebExtract {
  const jsonLdProducts = readJsonLdBlocks(html)
    .flatMap(flattenNodes)
    .map(extractJsonLdProduct)
    .filter((product): product is JsonLdProductExtract => product !== null);

  const title = readTitle(html);
  const ogImage = getSafeExternalUrl(readMetaContent(html, "property", "og:image"));
  const jsonLd = jsonLdProducts[0] ?? null;
  const jsonLdPrices = jsonLdProducts.flatMap((product) => product.prices);
  const tablePrices = extractTablePrices(html);
  const allPrices = extractPricesFromHtml(html, jsonLdPrices);

  const bodyText = stripTags(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));

  return {
    sourceUrl,
    fetchedAt,
    title,
    metaDescription: readMetaContent(html, "name", "description"),
    ogTitle: readMetaContent(html, "property", "og:title"),
    ogDescription: readMetaContent(html, "property", "og:description"),
    ogImage,
    canonicalUrl: readCanonical(html),
    jsonLdProducts,
    purchaseLinks: readPurchaseLinks(html),
    visibleTextSample: bodyText.slice(0, 4000) || null,
    tablePrices: allPrices.length > 0 ? allPrices : tablePrices,
    productDescription: extractProductDescription(html),
    productImageUrl: extractProductImageUrl(sourceUrl, {
      jsonLdImageUrl: jsonLd?.imageUrl,
      ogImage,
      html,
    }),
    specTags: extractSpecTags(html),
    brandFromTitle: extractBrandFromTitle(title),
    productNameFromTitle: extractProductNameFromTitle(title),
  };
}

export {
  extractTablePrices,
  extractSpecTags,
  extractProductDescription,
  extractProductImageUrl,
  isGenericSiteDescription,
} from "./html-extract-product-page";
