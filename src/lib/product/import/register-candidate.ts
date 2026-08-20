import { z } from "zod";

import {
  PRIORITY_LEVELS,
  PRODUCT_CATEGORIES,
  PRODUCT_STYLES,
} from "@/lib/product/constants";
import { getSafeExternalUrl } from "@/lib/product/external-url";

import { buildCandidateFromRawExtract } from "./build-candidate";
import { fetchAndExtractRawWebData } from "./fetch-page";
import { tryEnhanceCandidateWithAi } from "./ai-extract-candidate";
import type { ProductImportCandidate } from "./build-candidate";

export async function createProductImportCandidateFromUrl(
  inputUrl: string,
  options?: {
    fetchImpl?: typeof fetch;
    useAi?: boolean;
  },
): Promise<ProductImportCandidate> {
  const raw = await fetchAndExtractRawWebData(inputUrl, { fetchImpl: options?.fetchImpl });
  const deterministic = buildCandidateFromRawExtract(raw);

  if (options?.useAi === false) {
    return deterministic;
  }

  return tryEnhanceCandidateWithAi(raw);
}

export { type ProductImportCandidate };

const PriorityLevelSchema = z.enum(PRIORITY_LEVELS);
const ProductCategorySchema = z.enum(PRODUCT_CATEGORIES);
const ProductStyleSchema = z.enum(PRODUCT_STYLES);

const optionalUrlSchema = z
  .string()
  .nullable()
  .transform((value) => getSafeExternalUrl(value));

export const RegisterProductCandidateSchema = z
  .object({
    sourceUrl: z.string().min(1),
    fetchedAt: z.string().min(1),
    name: z.string().trim().min(1),
    brand: z.string().trim().min(1),
    description: z.string().trim().nullable(),
    priceMinYen: z.number().int().positive(),
    priceMaxYen: z.number().int().positive(),
    imageUrl: optionalUrlSchema,
    productUrl: optionalUrlSchema,
    purchaseUrl: optionalUrlSchema,
    category: ProductCategorySchema,
    appearance: PriorityLevelSchema.default("unknown"),
    comfort: PriorityLevelSchema.default("unknown"),
    practicality: PriorityLevelSchema.default("unknown"),
    resale: PriorityLevelSchema.default("unknown"),
    style: ProductStyleSchema.default("その他"),
    tags: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.priceMaxYen < data.priceMinYen) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "priceMaxYen must be greater than or equal to priceMinYen",
        path: ["priceMaxYen"],
      });
    }
  });

export type RegisterProductCandidateInput = z.infer<typeof RegisterProductCandidateSchema>;

export function registerInputToInsertValues(input: RegisterProductCandidateInput) {
  return {
    category: input.category,
    name: input.name,
    brand: input.brand,
    description: input.description,
    priceMinYen: input.priceMinYen,
    priceMaxYen: input.priceMaxYen,
    imageUrl: input.imageUrl,
    productUrl: input.productUrl ?? getSafeExternalUrl(input.sourceUrl),
    purchaseUrl: input.purchaseUrl,
    appearance: input.appearance,
    comfort: input.comfort,
    practicality: input.practicality,
    resale: input.resale,
    style: input.style,
    tags: input.tags,
    isActive: true,
    isDemo: false,
  };
}

export type RegisterCandidateDb = {
  transaction<T>(fn: (tx: RegisterCandidateTx) => Promise<T>): Promise<T>;
};

export type RegisterCandidateTx = {
  insertProduct: (values: ReturnType<typeof registerInputToInsertValues>) => Promise<{ id: string }>;
};

export type RegisterProductCandidateResult = {
  productId: string;
};

export async function registerProductCandidate(
  db: RegisterCandidateDb,
  input: RegisterProductCandidateInput,
): Promise<RegisterProductCandidateResult> {
  const parsed = RegisterProductCandidateSchema.parse(input);

  let productId = "";
  await db.transaction(async (tx) => {
    const inserted = await tx.insertProduct(registerInputToInsertValues(parsed));
    productId = inserted.id;
  });

  return { productId };
}

export class RegisterProductCandidateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegisterProductCandidateError";
  }
}

export function toRegisterInputFromCandidate(
  candidate: ProductImportCandidate,
  overrides: Partial<RegisterProductCandidateInput>,
): RegisterProductCandidateInput {
  if (!candidate.name || !candidate.brand || !candidate.priceMinYen || !candidate.priceMaxYen) {
    throw new RegisterProductCandidateError(
      "name, brand, priceMinYen, priceMaxYen are required before registration",
    );
  }

  if (!overrides.category) {
    throw new RegisterProductCandidateError("category is required before registration");
  }

  return RegisterProductCandidateSchema.parse({
    sourceUrl: candidate.sourceUrl,
    fetchedAt: candidate.fetchedAt,
    name: candidate.name,
    brand: candidate.brand,
    description: candidate.description,
    priceMinYen: candidate.priceMinYen,
    priceMaxYen: candidate.priceMaxYen,
    imageUrl: candidate.imageUrl,
    productUrl: candidate.productUrl ?? candidate.sourceUrl,
    purchaseUrl: candidate.purchaseUrl,
    category: overrides.category,
    appearance: candidate.appearance,
    comfort: candidate.comfort,
    practicality: candidate.practicality,
    resale: candidate.resale,
    style: candidate.style ?? "その他",
    tags: candidate.tags,
    ...overrides,
  });
}
