import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/server/db/client.server";
import { productClickEvents, products } from "@/lib/server/db/schema";

import {
  createEmptyProductClickCount,
  incrementProductClickCount,
  isProductClickEventType,
  PRODUCT_CLICK_EVENT_TYPES,
  type ProductClickCount,
  type ProductClickEventType,
} from "./click-event-types";

export const RecordProductClickInputSchema = z.object({
  productId: z.string().uuid(),
  eventType: z.enum(PRODUCT_CLICK_EVENT_TYPES),
});

export const GetProductClickCountsInputSchema = z.object({
  productIds: z.array(z.string().uuid()).optional(),
});

export type RecordProductClickInput = z.infer<typeof RecordProductClickInputSchema>;
export type GetProductClickCountsInput = z.infer<typeof GetProductClickCountsInputSchema>;

type ActiveProductRow = {
  id: string;
  isActive: boolean;
  purchaseUrl: string | null;
};

async function fetchActiveProductRow(productId: string): Promise<ActiveProductRow | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: products.id,
      isActive: products.isActive,
      purchaseUrl: products.purchaseUrl,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return rows[0] ?? null;
}

export function canRecordProductClick(
  product: ActiveProductRow | null,
  eventType: ProductClickEventType,
): boolean {
  if (!product || !product.isActive) {
    return false;
  }

  if (eventType === "purchase_click" && !product.purchaseUrl?.trim()) {
    return false;
  }

  return true;
}

export async function recordProductClickEvent(
  input: RecordProductClickInput,
): Promise<{ recorded: boolean }> {
  const product = await fetchActiveProductRow(input.productId);
  if (!canRecordProductClick(product, input.eventType)) {
    return { recorded: false };
  }

  const db = getDb();
  await db.insert(productClickEvents).values({
    productId: input.productId,
    eventType: input.eventType,
  });

  return { recorded: true };
}

export async function getProductClickCounts(
  input: GetProductClickCountsInput = {},
): Promise<ProductClickCount[]> {
  const db = getDb();
  const productIds = input.productIds;

  const rows = await db
    .select({
      productId: productClickEvents.productId,
      eventType: productClickEvents.eventType,
      count: sql<number>`count(*)::int`,
    })
    .from(productClickEvents)
    .where(productIds && productIds.length > 0 ? inArray(productClickEvents.productId, productIds) : undefined)
    .groupBy(productClickEvents.productId, productClickEvents.eventType);

  const countsByProductId = new Map<string, ProductClickCount>();

  for (const row of rows) {
    if (!isProductClickEventType(row.eventType)) {
      continue;
    }

    const current = countsByProductId.get(row.productId) ?? createEmptyProductClickCount(row.productId);
    let next = current;

    for (let index = 0; index < row.count; index += 1) {
      next = incrementProductClickCount(next, row.eventType);
    }

    countsByProductId.set(row.productId, next);
  }

  if (productIds && productIds.length > 0) {
    return productIds.map((productId) => countsByProductId.get(productId) ?? createEmptyProductClickCount(productId));
  }

  return [...countsByProductId.values()].sort((left, right) => left.productId.localeCompare(right.productId));
}

export async function productExists(productId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return rows.length > 0;
}

export async function isActiveProduct(productId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ isActive: products.isActive })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  return rows.length > 0;
}
