import { and, eq, isNotNull, isNull } from "drizzle-orm";

import { getDb } from "@/lib/server/db/client.server";
import { products } from "@/lib/server/db/schema";

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

export async function handleRefreshRealProductImages() {
  await assertProductImportAdmin();
  const db = getDb();

  const productsToRefresh = await db
    .select({ id: products.id, productUrl: products.productUrl })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        eq(products.isDemo, false),
        isNotNull(products.productUrl),
        isNull(products.imageUrl),
      ),
    );

  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const product of productsToRefresh) {
    if (!product.productUrl) {
      skippedCount += 1;
      continue;
    }

    try {
      const candidate = await createProductImportCandidateFromUrl(product.productUrl, {
        useAi: false,
      });

      if (!candidate.imageUrl) {
        skippedCount += 1;
        continue;
      }

      await db
        .update(products)
        .set({ imageUrl: candidate.imageUrl })
        .where(eq(products.id, product.id));
      updatedCount += 1;
    } catch (error) {
      console.error("[handleRefreshRealProductImages] Failed:", product.productUrl, error);
      failedCount += 1;
    }
  }

  return {
    totalCount: productsToRefresh.length,
    updatedCount,
    skippedCount,
    failedCount,
  };
}
