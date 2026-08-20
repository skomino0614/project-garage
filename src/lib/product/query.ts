import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/server/db/client.server";
import {
  productVehicleCompatibilities,
  products,
} from "@/lib/server/db/schema";
import type { PriorityLevel } from "./constants";
import type { Product, ProductAttributes, VehicleCompatibility } from "./types";

type ProductRow = typeof products.$inferSelect;
type CompatibilityRow = typeof productVehicleCompatibilities.$inferSelect;

export type FetchActiveProductsOptions = {
  /** Include demo catalog rows — intended for verification scripts and local QA. */
  includeDemo?: boolean;
};

export function isProductEligibleForRecommendation(
  product: Pick<ProductRow, "isActive" | "isDemo">,
  options: FetchActiveProductsOptions = {},
): boolean {
  if (!product.isActive) {
    return false;
  }

  const includeDemo = options.includeDemo ?? false;
  if (product.isDemo && !includeDemo) {
    return false;
  }

  return true;
}

function toPriorityLevel(value: string): PriorityLevel {
  if (value === "high" || value === "medium" || value === "low" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function toProductAttributes(row: ProductRow): ProductAttributes {
  return {
    appearance: toPriorityLevel(row.appearance),
    comfort: toPriorityLevel(row.comfort),
    practicality: toPriorityLevel(row.practicality),
    resale: toPriorityLevel(row.resale),
  };
}

function toVehicleCompatibility(row: CompatibilityRow): VehicleCompatibility {
  return {
    maker: row.maker,
    model: row.model,
    series: row.series,
    note: row.note,
    carMasterId: row.carMasterId,
  };
}

function assembleProduct(row: ProductRow, compatRows: CompatibilityRow[]): Product {
  return {
    id: row.id,
    category: row.category as Product["category"],
    name: row.name,
    brand: row.brand,
    description: row.description,
    priceMinYen: row.priceMinYen,
    priceMaxYen: row.priceMaxYen,
    imageUrl: row.imageUrl,
    productUrl: row.productUrl,
    purchaseUrl: row.purchaseUrl,
    attributes: toProductAttributes(row),
    style: row.style as Product["style"],
    tags: row.tags ?? [],
    isActive: row.isActive,
    compatibilities: compatRows.map(toVehicleCompatibility),
  };
}

/** Load active products with vehicle compatibilities for deterministic matching. */
export async function fetchActiveProductsWithCompatibilities(
  options: FetchActiveProductsOptions = {},
): Promise<Product[]> {
  const db = getDb();
  const includeDemo = options.includeDemo ?? false;

  const productRows = await db
    .select()
    .from(products)
    .where(
      includeDemo
        ? eq(products.isActive, true)
        : and(eq(products.isActive, true), eq(products.isDemo, false)),
    );

  if (productRows.length === 0) {
    return [];
  }

  const compatibilityRows = await db.select().from(productVehicleCompatibilities);

  const compatibilitiesByProductId = new Map<string, CompatibilityRow[]>();
  for (const row of compatibilityRows) {
    const existing = compatibilitiesByProductId.get(row.productId) ?? [];
    existing.push(row);
    compatibilitiesByProductId.set(row.productId, existing);
  }

  return productRows.map((row) =>
    assembleProduct(row, compatibilitiesByProductId.get(row.id) ?? []),
  );
}

export { assembleProduct };
