import { getDb } from "@/lib/server/db/client.server";
import { products } from "@/lib/server/db/schema";

import type { ProductImportCandidate } from "./build-candidate";
import { assertProductImportAdmin } from "./product-import-auth";
import {
  createProductImportCandidateFromUrl,
  registerProductCandidate,
  type RegisterProductCandidateInput,
} from "./register-candidate";

type FetchProductImportCandidateInput = {
  url: string;
  useAi?: boolean;
};

export async function handleFetchProductImportCandidate(
  data: FetchProductImportCandidateInput,
): Promise<ProductImportCandidate> {
  await assertProductImportAdmin();
  return createProductImportCandidateFromUrl(data.url, { useAi: data.useAi ?? true });
}

export async function handleRegisterProductImportCandidate(data: RegisterProductCandidateInput) {
  await assertProductImportAdmin();
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
}
