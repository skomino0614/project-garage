import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { ProductImportCandidate } from "./build-candidate";
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

export const fetchProductImportCandidate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FetchProductImportCandidateInputSchema.parse(data))
  .handler(async ({ data }): Promise<ProductImportCandidate> => handleFetchProductImportCandidate(data));

export const registerProductImportCandidate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RegisterProductCandidateSchema.parse(data))
  .handler(async ({ data }) => handleRegisterProductImportCandidate(data));

export const refreshRealProductImages = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({}).parse(data))
  .handler(async () => handleRefreshRealProductImages());
