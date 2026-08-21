/**
 * Import real products from CSV.
 *
 * Usage:
 *   MIGRATE_URL=... npm run db:import:products -- path/to/products.csv
 *
 * Phase 8-2B upserts rows with product_url; rows without product_url are insert-only.
 * Re-importing the same product_url updates the existing row.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { createProductImportDb } from "../src/lib/product/import/db-adapter";
import {
  importProductsFromCsv,
  PRODUCT_IMPORT_MODE,
  ProductImportError,
} from "../src/lib/product/import/product-import";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npm run db:import:products -- <path-to-products.csv>");
  process.exit(1);
}

const url = process.env.MIGRATE_URL;
if (!url) {
  throw new Error("Missing MIGRATE_URL");
}

const absolutePath = resolve(csvPath);
const csvText = readFileSync(absolutePath, "utf8");

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
  const result = await importProductsFromCsv(createProductImportDb(db), csvText);
  console.log(`Import mode: ${PRODUCT_IMPORT_MODE}`);
  console.log(`Inserted products: ${result.insertedCount}`);
  console.log(`Updated products: ${result.updatedCount}`);
  console.log(`Product IDs: ${result.productIds.join(", ")}`);
} catch (error) {
  if (error instanceof ProductImportError) {
    console.error("Product import failed:");
    for (const entry of error.errors) {
      console.error(`  Line ${entry.lineNumber}: ${entry.message}`);
    }
    process.exit(1);
  }

  throw error;
} finally {
  await client.end();
}
