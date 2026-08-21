import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { productVehicleCompatibilities, products } from "@/lib/server/db/schema";

import type { CompatibilityImportDb } from "./compatibility-import";
import type { ProductImportDb } from "./product-import";
import { createProductUpsertTx } from "./product-upsert";

type AppDb = PostgresJsDatabase<Record<string, unknown>>;

export function createProductImportDb(db: AppDb): ProductImportDb {
  return {
    transaction: (fn) =>
      db.transaction(async (tx) => fn(createProductUpsertTx(tx as AppDb))),
  };
}

export function createCompatibilityImportDb(db: AppDb): CompatibilityImportDb {
  return {
    findExistingProductIds: async (productIds) => {
      if (productIds.length === 0) {
        return new Set();
      }

      const rows = await db
        .select({ id: products.id })
        .from(products)
        .where(inArray(products.id, productIds));

      return new Set(rows.map((row) => row.id));
    },
    transaction: (fn) =>
      db.transaction(async (tx) =>
        fn({
          insertCompatibility: async (values) => {
            await tx.insert(productVehicleCompatibilities).values(values);
          },
        }),
      ),
  };
}

export { createProductUpsertTx };
