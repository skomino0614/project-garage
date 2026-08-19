import { z } from "zod";

import { ConsultPrioritiesSchema, VehicleContextSchema } from "@/lib/consult/schemas";

import {
  ProductAttributesSchema,
  ProductCategorySchema,
  ProductStyleSchema,
  VehicleCompatibilitySchema,
} from "./schemas";

export const ProductMatchReasonSchema = z.enum([
  "予算内",
  "予算内（上限付近）",
  "予算をやや超過",
  "見た目の優先度と一致",
  "乗り心地の条件と一致",
  "実用性の条件と一致",
  "リセールの条件と一致",
  "スタイルと一致",
  "タグと一致",
  "車種適合",
]);

export const VehicleCompatibilityStatusSchema = z.enum([
  "compatible",
  "unknown",
  "incompatible",
]);

export const ConsultationForRecommendationSchema = z.object({
  vehicle: VehicleContextSchema,
  budget: z.object({
    maxYen: z.number().nullable(),
    note: z.string().nullable(),
  }),
  category: z.string().nullable(),
  usage: z.string().nullable(),
  stylePreference: z.string().nullable(),
  priorities: ConsultPrioritiesSchema,
  direction: z.string().nullable().optional(),
});

export const ProductRecommendationCandidateSchema = z.object({
  product: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    brand: z.string().min(1),
    category: ProductCategorySchema,
    priceMinYen: z.number().int().nonnegative(),
    priceMaxYen: z.number().int().nonnegative(),
    style: ProductStyleSchema,
    attributes: ProductAttributesSchema,
    tags: z.array(z.string()),
    compatibilities: z.array(VehicleCompatibilitySchema),
  }),
  score: z.number(),
  reasons: z.array(ProductMatchReasonSchema),
  vehicleCompatibility: VehicleCompatibilityStatusSchema,
});

export const RecommendProductReasonsInputSchema = z.object({
  consultation: ConsultationForRecommendationSchema,
  candidates: z.array(ProductRecommendationCandidateSchema).max(5),
});

export const ProductRecommendationSchema = z.object({
  productId: z.string().uuid(),
  reason: z.string().min(1).max(600),
  highlights: z.array(z.string().min(1).max(120)).min(1).max(4),
  caution: z.string().max(300).nullable(),
});

export const RecommendProductReasonsOutputSchema = z.object({
  recommendations: z.array(ProductRecommendationSchema),
  source: z.enum(["ai", "fallback"]),
});

/** Structured output schema passed to OpenAI generateObject. */
export const AiRecommendationItemSchema = z.object({
  productId: z.string().uuid(),
  reason: z.string().min(1).max(600),
  highlights: z.array(z.string().min(1).max(120)).min(2).max(4),
  caution: z.string().max(300).nullable(),
});

export const AiRecommendationOutputSchema = z.object({
  recommendations: z.array(AiRecommendationItemSchema).max(5),
});

export type ConsultationForRecommendation = z.infer<typeof ConsultationForRecommendationSchema>;
export type ProductRecommendationCandidate = z.infer<typeof ProductRecommendationCandidateSchema>;
export type RecommendProductReasonsInput = z.infer<typeof RecommendProductReasonsInputSchema>;
export type ProductRecommendation = z.infer<typeof ProductRecommendationSchema>;
export type RecommendProductReasonsOutput = z.infer<typeof RecommendProductReasonsOutputSchema>;
export type AiRecommendationItem = z.infer<typeof AiRecommendationItemSchema>;

export const ProductRecommendationDisplayItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  brand: z.string().min(1),
  priceMinYen: z.number().int().nonnegative(),
  priceMaxYen: z.number().int().nonnegative(),
  imageUrl: z.string().url().nullable(),
  productUrl: z.string().url().nullable(),
  purchaseUrl: z.string().url().nullable(),
  style: ProductStyleSchema,
  score: z.number(),
  vehicleCompatibility: VehicleCompatibilityStatusSchema,
  compatibilities: z.array(VehicleCompatibilitySchema),
  reason: z.string().min(1),
  highlights: z.array(z.string().min(1)).min(1).max(4),
  caution: z.string().max(300).nullable(),
});

export const RecommendProductsForConsultationInputSchema = z.object({
  consultation: ConsultationForRecommendationSchema,
});

export const RecommendProductsForConsultationOutputSchema = z.object({
  items: z.array(ProductRecommendationDisplayItemSchema),
  source: z.enum(["ai", "fallback"]).nullable(),
  /** Temporary pipeline diagnostics (remove after production investigation). */
  _debug: z
    .object({
      stage: z.enum([
        "no_category",
        "db_error",
        "products_zero",
        "matches_zero",
        "recommend_zero",
        "success",
      ]),
      productCount: z.number().int().nonnegative().optional(),
      matchCount: z.number().int().nonnegative().optional(),
      recommendCount: z.number().int().nonnegative().optional(),
      error: z.string().optional(),
    })
    .optional(),
});

export type ProductRecommendationDisplayItem = z.infer<typeof ProductRecommendationDisplayItemSchema>;
export type RecommendProductsForConsultationInput = z.infer<
  typeof RecommendProductsForConsultationInputSchema
>;
export type RecommendProductsForConsultationOutput = z.infer<
  typeof RecommendProductsForConsultationOutputSchema
>;
