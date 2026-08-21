import { getDb } from "@/lib/server/db/client.server";

import type { ProductImportCandidate } from "./build-candidate";
import { createProductUpsertTx } from "./db-adapter";
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
        db.transaction(async (tx) => fn(createProductUpsertTx(tx))),
    },
    data,
  );
}
