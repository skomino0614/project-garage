/**
 * Verify demo product catalog and Phase 6-2 matching against Toyota Voxy 90 Series.
 *
 * Usage:
 *   MIGRATE_URL=... npm run db:verify:products
 */
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ConsultationSummary } from "../src/lib/consult/types";
import { consultationSummaryToMatchInput, rankProductMatches } from "../src/lib/product/match";
import type { ProductMatchResult } from "../src/lib/product/match-types";
import { fetchActiveProductsWithCompatibilities } from "../src/lib/product/query";
import { productVehicleCompatibilities } from "../src/lib/server/db/schema/product-vehicle-compatibilities";
import { products } from "../src/lib/server/db/schema/products";

const WHEEL_OVER_BUDGET_ID = "a1000001-0001-4001-8001-000000000006";
const DASHCAM_OVER_BUDGET_ID = "a2000001-0001-4001-8001-000000000006";
const TIRE_OVER_BUDGET_ID = "a3000001-0001-4001-8001-000000000006";

const url = process.env.MIGRATE_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("Missing MIGRATE_URL or DATABASE_URL");
}

const normalizedUrl = url.replace(/^ppostgresql:/, "postgresql:");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizedUrl;
}

const client = postgres(normalizedUrl, { max: 1 });
const db = drizzle(client);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`VERIFY FAILED: ${message}`);
    process.exitCode = 1;
    throw new Error(message);
  }
}

async function countByCategory(category: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(products)
    .where(eq(products.category, category));
  return value;
}

function logMatches(label: string, matches: ProductMatchResult[]): void {
  console.log(`--- rankProductMatches (${label}) ---`);
  console.log(`matches returned: ${matches.length}`);
  for (const match of matches) {
    console.log(
      `  - ${match.product.name} | score ${Math.round(match.score)} | ¥${match.product.priceMinYen.toLocaleString("ja-JP")}〜¥${match.product.priceMaxYen.toLocaleString("ja-JP")} | ${match.vehicleCompatibility}`,
    );
  }
}

function verifyScenario(
  label: string,
  summary: ConsultationSummary,
  catalog: Awaited<ReturnType<typeof fetchActiveProductsWithCompatibilities>>,
  options: {
    expectedMatchCount: number;
    overBudgetProductId: string;
    minCompatibleMatches?: number;
  },
): ProductMatchResult[] {
  const matches = rankProductMatches(
    catalog,
    consultationSummaryToMatchInput(summary),
    { limit: 3 },
  );

  logMatches(label, matches);

  assert(
    matches.length === options.expectedMatchCount,
    `${label}: expected ${options.expectedMatchCount} matches, got ${matches.length}`,
  );

  assert(
    !matches.some((match) => match.product.id === options.overBudgetProductId),
    `${label}: over-budget product ${options.overBudgetProductId} must be excluded`,
  );

  const minCompatible = options.minCompatibleMatches ?? options.expectedMatchCount;
  const compatibleCount = matches.filter(
    (match) => match.vehicleCompatibility === "compatible",
  ).length;
  assert(
    compatibleCount >= minCompatible,
    `${label}: expected at least ${minCompatible} compatible matches, got ${compatibleCount}`,
  );

  return matches;
}

const [{ value: productTotal }] = await db.select({ value: count() }).from(products);
const [{ value: activeTotal }] = await db
  .select({ value: count() })
  .from(products)
  .where(eq(products.isActive, true));
const [{ value: compatTotal }] = await db
  .select({ value: count() })
  .from(productVehicleCompatibilities);

const wheelTotal = await countByCategory("ホイール");
const dashcamTotal = await countByCategory("ドラレコ");
const tireTotal = await countByCategory("タイヤ");

console.log("--- DB counts ---");
console.log(`products total: ${productTotal}`);
console.log(`products active: ${activeTotal}`);
console.log(`product_vehicle_compatibilities total: ${compatTotal}`);
console.log(`wheel products: ${wheelTotal}`);
console.log(`dashcam products: ${dashcamTotal}`);
console.log(`tire products: ${tireTotal}`);

assert(wheelTotal >= 6, `expected at least 6 wheel products, got ${wheelTotal}`);
assert(dashcamTotal >= 6, `expected at least 6 dashcam products, got ${dashcamTotal}`);
assert(tireTotal >= 6, `expected at least 6 tire products, got ${tireTotal}`);

const catalog = await fetchActiveProductsWithCompatibilities();
console.log(`fetchActiveProductsWithCompatibilities: ${catalog.length}`);

assert(catalog.length >= 18, `expected at least 18 active catalog products, got ${catalog.length}`);

const wheelSummary: ConsultationSummary = {
  vehicle: { maker: "Toyota", model: "Voxy", series: "90 Series" },
  budget: { maxYen: 200_000, note: "20万円以内" },
  category: "ホイール",
  usage: null,
  stylePreference: "高級感",
  priorities: {
    appearance: "high",
    comfort: "high",
    practicality: "unknown",
    resale: "unknown",
  },
  direction: null,
};

verifyScenario(
  "Voxy 90 / 20万 / ホイール / 高級感",
  wheelSummary,
  catalog,
  {
    expectedMatchCount: 3,
    overBudgetProductId: WHEEL_OVER_BUDGET_ID,
  },
);

const dashcamSummary: ConsultationSummary = {
  vehicle: { maker: "Toyota", model: "Voxy", series: "90 Series" },
  budget: { maxYen: 50_000, note: "5万円以内" },
  category: "ドラレコ",
  usage: null,
  stylePreference: "シンプル",
  priorities: {
    appearance: "unknown",
    comfort: "unknown",
    practicality: "high",
    resale: "unknown",
  },
  direction: null,
};

verifyScenario(
  "Voxy 90 / 5万 / ドラレコ / 実用性",
  dashcamSummary,
  catalog,
  {
    expectedMatchCount: 3,
    overBudgetProductId: DASHCAM_OVER_BUDGET_ID,
  },
);

const tireSummary: ConsultationSummary = {
  vehicle: { maker: "Toyota", model: "Voxy", series: "90 Series" },
  budget: { maxYen: 200_000, note: "20万円以内" },
  category: "タイヤ",
  usage: null,
  stylePreference: "高級感",
  priorities: {
    appearance: "unknown",
    comfort: "high",
    practicality: "unknown",
    resale: "unknown",
  },
  direction: null,
};

verifyScenario(
  "Voxy 90 / 20万 / タイヤ / 乗り心地",
  tireSummary,
  catalog,
  {
    expectedMatchCount: 3,
    overBudgetProductId: TIRE_OVER_BUDGET_ID,
  },
);

console.log("\n--- verify summary ---");
console.log("all category scenarios passed");

await client.end();
