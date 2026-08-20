import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { productVehicleCompatibilities, products } from "@/lib/server/db/schema";

import type { CompatibilityImportDb } from "./compatibility-import";
import type { ProductImportDb } from "./product-import";

type AppDb = PostgresJsDatabase<Record<string, unknown>>;

export function createProductImportDb(db: AppDb): ProductImportDb {
  return {
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
