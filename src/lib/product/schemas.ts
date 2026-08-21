import { z } from "zod";

import {
  PRIORITY_LEVELS,
  PRODUCT_CATEGORIES,
  PRODUCT_STYLES,
} from "./constants";

export const PriorityLevelSchema = z.enum(PRIORITY_LEVELS);

export const ProductCategorySchema = z.enum(PRODUCT_CATEGORIES);

export const ProductStyleSchema = z.enum(PRODUCT_STYLES);

export const ProductAttributesSchema = z.object({
  appearance: PriorityLevelSchema,
  comfort: PriorityLevelSchema,
  practicality: PriorityLevelSchema,
  resale: PriorityLevelSchema,
});

export const VehicleCompatibilitySchema = z.object({
  maker: z.string().min(1),
  model: z.string().min(1),
  series: z.string().min(1).nullable(),
  fitmentType: z.enum(["confirmed", "reference"]).nullable().optional(),
  note: z.string().nullable(),
  carMasterId: z.string().uuid().nullable(),
});

const yenSchema = z.number().int().nonnegative();

const ProductBaseSchema = z.object({
  id: z.string().uuid().optional(),
  category: ProductCategorySchema,
  name: z.string().min(1),
  brand: z.string().min(1),
  description: z.string().nullable(),
  priceMinYen: yenSchema,
  priceMaxYen: yenSchema,
  imageUrl: z.string().url().nullable(),
  productUrl: z.string().url().nullable(),
  purchaseUrl: z.string().url().nullable(),
  attributes: ProductAttributesSchema,
  style: ProductStyleSchema,
  tags: z.array(z.string().min(1)),
  isActive: z.boolean(),
  compatibilities: z.array(VehicleCompatibilitySchema),
});

export const ProductSchema = ProductBaseSchema.refine(
  (data) => data.priceMaxYen >= data.priceMinYen,
  {
    message: "priceMaxYen must be greater than or equal to priceMinYen",
    path: ["priceMaxYen"],
  },
);

export type ProductSchemaInput = z.input<typeof ProductBaseSchema>;
export type ProductSchemaOutput = z.output<typeof ProductBaseSchema>;

/** Flat DB row fields (for server-side assembly). */
export const ProductRecordSchema = ProductBaseSchema.omit({ compatibilities: true }).extend({
  appearance: PriorityLevelSchema,
  comfort: PriorityLevelSchema,
  practicality: PriorityLevelSchema,
  resale: PriorityLevelSchema,
});
