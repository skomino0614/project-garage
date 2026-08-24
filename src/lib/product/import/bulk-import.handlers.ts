import { getDb } from "@/lib/server/db/client.server";

import {
  importCompatibilitiesFromCsv,
  type CompatibilityImportResult,
} from "./compatibility-import";
import { createCompatibilityImportDb, createProductImportDb } from "./db-adapter";
import { assertProductImportAdmin } from "./product-import-auth";
import {
  importProductsFromCsv,
  type ProductImportResult,
} from "./product-import";

const MAX_CSV_BYTES = 1024 * 1024;

function assertCsvSize(csvText: string) {
  const bytes = new TextEncoder().encode(csvText).byteLength;
  if (bytes > MAX_CSV_BYTES) {
    throw new Error("CSV is too large. Please keep each file within 1MB.");
  }
}

export async function handleBulkProductImport(csvText: string): Promise<ProductImportResult> {
  await assertProductImportAdmin();
  assertCsvSize(csvText);
  return importProductsFromCsv(createProductImportDb(getDb()), csvText);
}

export async function handleBulkCompatibilityImport(
  csvText: string,
): Promise<CompatibilityImportResult> {
  await assertProductImportAdmin();
  assertCsvSize(csvText);
  return importCompatibilitiesFromCsv(createCompatibilityImportDb(getDb()), csvText);
}
