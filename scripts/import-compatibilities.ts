/**
 * Import product vehicle compatibilities from CSV.
 *
 * Usage:
 *   MIGRATE_URL=... npm run db:import:compatibilities -- path/to/compatibilities.csv
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { createCompatibilityImportDb } from "../src/lib/product/import/db-adapter";
import {
  CompatibilityImportError,
  importCompatibilitiesFromCsv,
} from "../src/lib/product/import/compatibility-import";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npm run db:import:compatibilities -- <path-to-compatibilities.csv>");
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
  const result = await importCompatibilitiesFromCsv(createCompatibilityImportDb(db), csvText);
  console.log(`Inserted compatibilities: ${result.insertedCount}`);
} catch (error) {
  if (error instanceof CompatibilityImportError) {
    console.error("Compatibility import failed:");
    for (const entry of error.errors) {
      console.error(`  Line ${entry.lineNumber}: ${entry.message}`);
    }
    process.exit(1);
  }

  throw error;
} finally {
  await client.end();
}
