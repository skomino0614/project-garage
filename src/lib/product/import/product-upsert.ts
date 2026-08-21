import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { products } from "@/lib/server/db/schema";

import type { ProductCatalogUpdateValues, ProductCatalogValues } from "./product-import";

type AppDb = PostgresJsDatabase<Record<string, unknown>>;

export function createProductUpsertTx(tx: AppDb) {
  return {
    insertProduct: async (values: ProductCatalogValues) => {
      const [row] = await tx.insert(products).values(values).returning({ id: products.id });
      if (!row) {
        throw new Error("Failed to insert product");
      }
      return row;
    },
    findProductIdByProductUrl: async (productUrl: string) => {
      const [row] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.productUrl, productUrl))
        .limit(1);
      return row?.id ?? null;
    },
    updateProductById: async (productId: string, values: ProductCatalogUpdateValues) => {
      await tx
        .update(products)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    },
  };
}

export type ProductUpsertTx = ReturnType<typeof createProductUpsertTx>;
