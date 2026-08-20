import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getDb } from "@/lib/server/db/client.server";
import { products } from "@/lib/server/db/schema";

import type { ProductImportCandidate } from "./build-candidate";
import {
  createProductImportCandidateFromUrl,
  registerProductCandidate,
  RegisterProductCandidateSchema,
} from "./register-candidate";

const FetchProductImportCandidateInputSchema = z.object({
  url: z.string().min(1),
  useAi: z.boolean().optional(),
});

export const fetchProductImportCandidate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FetchProductImportCandidateInputSchema.parse(data))
  .handler(async ({ data }): Promise<ProductImportCandidate> => {
    return createProductImportCandidateFromUrl(data.url, { useAi: data.useAi ?? true });
  });

export const registerProductImportCandidate = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RegisterProductCandidateSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb();

    return registerProductCandidate(
      {
        transaction: (fn) =>
          db.transaction(async (tx) =>
            fn({
              insertProduct: async (values) => {
                const [row] = await tx.insert(products).values(values).returning({ id: products.id });
                if (!row) {
                  throw new Error("Failed to insert product");
                }
                return row;
              },
            }),
          ),
      },
      data,
    );
  });
