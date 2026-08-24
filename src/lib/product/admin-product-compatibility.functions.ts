import { and, desc, eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getDb } from "@/lib/server/db/client.server";
import { productVehicleCompatibilities, products } from "@/lib/server/db/schema";

import { assertProductImportAdmin } from "./import/product-import-auth";

const FitmentTypeSchema = z.enum(["confirmed", "reference"]);

const ProductCompatibilityInputSchema = z.object({
  productId: z.string().uuid(),
  maker: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  series: z.string().trim().max(100).nullable().optional(),
  fitmentType: FitmentTypeSchema,
  note: z.string().trim().max(5000).nullable().optional(),
});

const ProductCompatibilityListInputSchema = z.object({
  productId: z.string().uuid(),
});

const AdminProductsListInputSchema = z.object({});

export type AdminProductCompatibility = {
  id: string;
  productId: string;
  maker: string;
  model: string;
  series: string | null;
  fitmentType: string | null;
  note: string | null;
};

export type AdminProductSummary = {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceMinYen: number;
  priceMaxYen: number;
  imageUrl: string | null;
  productUrl: string | null;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
};

async function assertProductExists(productId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: products.id, name: products.name, brand: products.brand, category: products.category })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  const product = rows[0];
  if (!product) {
    throw new Error("商品が見つかりません。");
  }

  return product;
}

export const getAdminProducts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AdminProductsListInputSchema.parse(data))
  .handler(async () => {
    await assertProductImportAdmin();
    const db = getDb();

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        category: products.category,
        priceMinYen: products.priceMinYen,
        priceMaxYen: products.priceMaxYen,
        imageUrl: products.imageUrl,
        productUrl: products.productUrl,
        isActive: products.isActive,
        isDemo: products.isDemo,
        createdAt: products.createdAt,
      })
      .from(products)
      .orderBy(desc(products.createdAt));

    return rows.map((product) => ({
      ...product,
      createdAt: product.createdAt.toISOString(),
    } satisfies AdminProductSummary));
  });

export const getAdminProductCompatibility = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ProductCompatibilityListInputSchema.parse(data))
  .handler(async ({ data }) => {
    await assertProductImportAdmin();
    const product = await assertProductExists(data.productId);
    const db = getDb();

    const rows = await db
      .select({
        id: productVehicleCompatibilities.id,
        productId: productVehicleCompatibilities.productId,
        maker: productVehicleCompatibilities.maker,
        model: productVehicleCompatibilities.model,
        series: productVehicleCompatibilities.series,
        fitmentType: productVehicleCompatibilities.fitmentType,
        note: productVehicleCompatibilities.note,
      })
      .from(productVehicleCompatibilities)
      .where(eq(productVehicleCompatibilities.productId, data.productId));

    return { product, compatibilities: rows };
  });

export const saveAdminProductCompatibility = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ProductCompatibilityInputSchema.parse(data))
  .handler(async ({ data }) => {
    await assertProductImportAdmin();
    await assertProductExists(data.productId);
    const db = getDb();

    const maker = data.maker.trim();
    const model = data.model.trim();
    const series = data.series?.trim() || null;
    const note = data.note?.trim() || null;

    const existing = await db
      .select({ id: productVehicleCompatibilities.id })
      .from(productVehicleCompatibilities)
      .where(
        and(
          eq(productVehicleCompatibilities.productId, data.productId),
          eq(productVehicleCompatibilities.maker, maker),
          eq(productVehicleCompatibilities.model, model),
          series === null
            ? eq(productVehicleCompatibilities.series, "")
            : eq(productVehicleCompatibilities.series, series),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(productVehicleCompatibilities)
        .set({ fitmentType: data.fitmentType, note })
        .where(eq(productVehicleCompatibilities.id, existing[0].id))
        .returning({ id: productVehicleCompatibilities.id });

      return { id: updated?.id ?? existing[0].id, updated: true };
    }

    const [inserted] = await db
      .insert(productVehicleCompatibilities)
      .values({
        productId: data.productId,
        maker,
        model,
        series,
        fitmentType: data.fitmentType,
        note,
        carMasterId: null,
      })
      .returning({ id: productVehicleCompatibilities.id });

    return { id: inserted.id, updated: false };
  });
