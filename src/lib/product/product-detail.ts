import { eq } from "drizzle-orm";

import { getDb } from "@/lib/server/db/client.server";
import { productVehicleCompatibilities, products } from "@/lib/server/db/schema";

import { assembleProduct } from "./query";
import type { Product } from "./types";

export type ProductDetailStatus = "active" | "inactive" | "not_found";

export type ProductDetailResult =
  | { status: "not_found"; product: null }
  | { status: "inactive"; product: Product }
  | { status: "active"; product: Product };

/** Load a single product with compatibilities for the detail page. */
export async function fetchProductById(productId: string): Promise<Product | null> {
  const db = getDb();

  const productRows = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  const row = productRows[0];
  if (!row) {
    return null;
  }

  const compatibilityRows = await db
    .select()
    .from(productVehicleCompatibilities)
    .where(eq(productVehicleCompatibilities.productId, productId));

  return assembleProduct(row, compatibilityRows);
}

export async function fetchProductDetail(productId: string): Promise<ProductDetailResult> {
  const product = await fetchProductById(productId);
  if (!product) {
    return { status: "not_found", product: null };
  }

  if (!product.isActive) {
    return { status: "inactive", product };
  }

  return { status: "active", product };
}
