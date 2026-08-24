import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { ProductImportCandidate } from "./build-candidate";
import {
  handleBulkCompatibilityImport,
  handleBulkProductImport,
} from "./bulk-import.handlers";
import {
  handleFetchProductImportCandidate,
  handleRefreshRealProductImages,
  handleRegisterProductImportCandidate,
} from "./product-import-candidate.handlers";
import { RegisterProductCandidateSchema } from "./register-candidate";

const FetchProductImportCandidateInputSchema = z.object({
  url: z.string().min(1),
  useAi: z.boolean().optional(),
});

const CsvInputSchema = z.object({
  csvText: z.string().min(1).max(1024 * 1024),
});

export const fetchProductImportCandidate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FetchProductImportCandidateInputSchema.parse(data))
  .handler(async ({ data }): Promise<ProductImportCandidate> => handleFetchProductImportCandidate(data));

export const registerProductImportCandidate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RegisterProductCandidateSchema.parse(data))
  .handler(async ({ data }) => handleRegisterProductImportCandidate(data));

export const refreshRealProductImages = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({}).parse(data))
  .handler(async () => handleRefreshRealProductImages());

export const bulkImportProducts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CsvInputSchema.parse(data))
  .handler(async ({ data }) => handleBulkProductImport(data.csvText));

export const bulkImportCompatibilities = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CsvInputSchema.parse(data))
  .handler(async ({ data }) => handleBulkCompatibilityImport(data.csvText));
