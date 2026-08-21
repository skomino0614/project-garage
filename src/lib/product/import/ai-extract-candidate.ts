import { generateObject } from "ai";
import { z } from "zod";

import { getOpenAI } from "@/lib/openai.server";
import {
  PRIORITY_LEVELS,
  PRODUCT_CATEGORIES,
  PRODUCT_STYLES,
} from "@/lib/product/constants";
import { getSafeExternalUrl } from "@/lib/product/external-url";

import type { RawWebExtract } from "./html-extract";
import { buildCandidateFromRawExtract } from "./build-candidate";

const PriorityLevelSchema = z.enum(PRIORITY_LEVELS);
const ProductCategorySchema = z.enum(PRODUCT_CATEGORIES);
const ProductStyleSchema = z.enum(PRODUCT_STYLES);

export const AiProductExtractSchema = z.object({
  name: z.string().trim().min(1).nullable(),
  brand: z.string().trim().min(1).nullable(),
  description: z.string().trim().min(1).nullable(),
  priceMinYen: z.number().int().positive().nullable(),
  priceMaxYen: z.number().int().positive().nullable(),
  imageUrl: z.string().nullable(),
  purchaseUrl: z.string().nullable(),
  category: ProductCategorySchema.nullable(),
  appearance: PriorityLevelSchema.nullable(),
  comfort: PriorityLevelSchema.nullable(),
  practicality: PriorityLevelSchema.nullable(),
  resale: PriorityLevelSchema.nullable(),
  style: ProductStyleSchema.nullable(),
  tags: z.array(z.string().trim().min(1)).nullable(),
});

export type AiProductExtract = z.infer<typeof AiProductExtractSchema>;

function buildAiExtractPrompt(raw: RawWebExtract): string {
  return JSON.stringify(
    {
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      metaDescription: raw.metaDescription,
      ogTitle: raw.ogTitle,
      ogDescription: raw.ogDescription,
      ogImage: raw.ogImage,
      canonicalUrl: raw.canonicalUrl,
      jsonLdProducts: raw.jsonLdProducts,
      purchaseLinks: raw.purchaseLinks,
      visibleTextSample: raw.visibleTextSample,
      tablePrices: raw.tablePrices,
      productDescription: raw.productDescription,
      productImageUrl: raw.productImageUrl,
      specTags: raw.specTags,
      brandFromTitle: raw.brandFromTitle,
      productNameFromTitle: raw.productNameFromTitle,
    },
    null,
    2,
  );
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function appearsInRaw(raw: RawWebExtract, value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  const needle = normalize(value);
  const haystacks = [
    raw.title,
    raw.metaDescription,
    raw.ogTitle,
    raw.ogDescription,
    raw.visibleTextSample,
    raw.productDescription,
    JSON.stringify(raw.jsonLdProducts),
    JSON.stringify(raw.specTags),
    JSON.stringify(raw.tablePrices),
  ];

  return haystacks.some((haystack) => normalize(haystack).includes(needle));
}

function priceAllowed(raw: RawWebExtract, min: number | null, max: number | null): boolean {
  if (min === null && max === null) {
    return true;
  }

  const rawPrices =
    raw.tablePrices.length > 0
      ? raw.tablePrices
      : raw.jsonLdProducts.flatMap((product) => product.prices);
  if (rawPrices.length === 0) {
    return false;
  }

  const values = [min, max].filter((value): value is number => value !== null);
  return values.every((value) => rawPrices.includes(value));
}

function sanitizeUrlAgainstRaw(raw: RawWebExtract, value: string | null | undefined): string | null {
  const safe = getSafeExternalUrl(value);
  if (!safe) {
    return null;
  }

  const allowed = new Set(
    [
      raw.sourceUrl,
      raw.canonicalUrl,
      raw.ogImage,
      raw.productImageUrl,
      ...raw.purchaseLinks,
      ...raw.jsonLdProducts.flatMap((p) => [p.imageUrl, p.purchaseUrl]),
    ]
      .map((url) => getSafeExternalUrl(url))
      .filter((url): url is string => Boolean(url)),
  );

  return allowed.has(safe) ? safe : null;
}

export function mergeAiExtractWithRaw(raw: RawWebExtract, ai: AiProductExtract) {
  const deterministic = buildCandidateFromRawExtract(raw);
  const warnings = [...deterministic.warnings];

  const merged = {
    ...deterministic,
    name: appearsInRaw(raw, ai.name) ? ai.name : deterministic.name,
    brand:
      appearsInRaw(raw, ai.brand) ||
      normalize(raw.brandFromTitle) === normalize(ai.brand) ||
      raw.jsonLdProducts.some((product) => normalize(product.brand) === normalize(ai.brand))
        ? ai.brand
        : deterministic.brand,
    description: appearsInRaw(raw, ai.description) ? ai.description : deterministic.description,
    priceMinYen: priceAllowed(raw, ai.priceMinYen, ai.priceMaxYen) ? ai.priceMinYen : deterministic.priceMinYen,
    priceMaxYen: priceAllowed(raw, ai.priceMinYen, ai.priceMaxYen) ? ai.priceMaxYen : deterministic.priceMaxYen,
    imageUrl: sanitizeUrlAgainstRaw(raw, ai.imageUrl) ?? deterministic.imageUrl,
    purchaseUrl: sanitizeUrlAgainstRaw(raw, ai.purchaseUrl) ?? deterministic.purchaseUrl,
    category: ai.category && appearsInRaw(raw, ai.category) ? ai.category : deterministic.category,
    appearance: deterministic.appearance,
    comfort: deterministic.comfort,
    practicality: deterministic.practicality,
    resale: deterministic.resale,
    style: ai.style && appearsInRaw(raw, ai.style) ? ai.style : deterministic.style,
    tags:
      ai.tags && ai.tags.every((tag) => appearsInRaw(raw, tag) || raw.specTags.includes(tag))
        ? ai.tags
        : deterministic.tags,
    extractionSource: deterministic.extractionSource === "none" ? ("ai" as const) : ("mixed" as const),
  };

  if (merged.extractionSource === "mixed") {
    warnings.push("AI構造化結果をページ上の情報と照合して反映しました。");
  }

  return {
    ...merged,
    warnings,
  };
}

export async function tryEnhanceCandidateWithAi(raw: RawWebExtract) {
  if (!process.env.OPENAI_API_KEY) {
    return buildCandidateFromRawExtract(raw);
  }

  try {
    const openai = getOpenAI();
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: AiProductExtractSchema,
      system: [
        "You extract product catalog fields from provided web page evidence only.",
        "Do not infer vehicle compatibility, prices, brands, categories, style, or priority scores unless explicitly present.",
        "If a field is missing from the evidence, return null.",
        "Never invent purchase URLs unless they appear in purchaseLinks or JSON-LD offers.",
      ].join("\n"),
      prompt: buildAiExtractPrompt(raw),
    });

    return mergeAiExtractWithRaw(raw, object);
  } catch (error) {
    const fallback = buildCandidateFromRawExtract(raw);
    return {
      ...fallback,
      warnings: [...fallback.warnings, "AI構造化に失敗したため、決定論的抽出結果のみを返しました。"],
    };
  }
}
