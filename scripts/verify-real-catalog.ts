/**
 * Verify the non-demo production catalog for Toyota Voxy 90 Series.
 *
 * Usage:
 *   MIGRATE_URL=... npm run db:verify:real-catalog
 */
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { ConsultationSummary } from "../src/lib/consult/types";
import { consultationSummaryToMatchInput, rankProductMatches } from "../src/lib/product/match";
import { fetchActiveProductsWithCompatibilities } from "../src/lib/product/query";
import { productVehicleCompatibilities } from "../src/lib/server/db/schema/product-vehicle-compatibilities";
import { products } from "../src/lib/server/db/schema/products";

const url = process.env.MIGRATE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Missing MIGRATE_URL or DATABASE_URL");

const normalizedUrl = url.replace(/^ppostgresql:/, "postgresql:");
const client = postgres(normalizedUrl, { max: 1 });
const db = drizzle(client);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`VERIFY FAILED: ${message}`);
    throw new Error(message);
  }
}

const categories = ["ホイール", "ドラレコ", "タイヤ", "車高調", "コーティング", "リセール"] as const;
const vehicle = { maker: "Toyota", model: "Voxy", series: "90 Series" };

const [{ value: realActiveTotal }] = await db
  .select({ value: count() })
  .from(products)
  .where(eq(products.isActive, true));

const [{ value: demoActiveTotal }] = await db
  .select({ value: count() })
  .from(products)
  .where(eq(products.isDemo, true));

console.log("--- real catalog counts ---");
console.log(`active real products: ${realActiveTotal}`);
console.log(`active demo products: ${demoActiveTotal}`);

const catalog = await fetchActiveProductsWithCompatibilities({ includeDemo: false });
console.log(`catalog loaded (includeDemo=false): ${catalog.length}`);
assert(catalog.every((item) => !item.isDemo), "demo product leaked into real catalog");

for (const category of categories) {
  const categoryProducts = catalog.filter((item) => item.category === category);
  const compatible = categoryProducts.filter((item) =>
    item.compatibilities.some(
      (compatibility) =>
        compatibility.maker === vehicle.maker &&
        compatibility.model === vehicle.model &&
        compatibility.series === vehicle.series,
    ),
  );
  const missingFitmentType = compatible.filter((item) =>
    item.compatibilities.some(
      (compatibility) =>
        compatibility.maker === vehicle.maker &&
        compatibility.model === vehicle.model &&
        compatibility.series === vehicle.series &&
        compatibility.fitmentType == null,
    ),
  );

  console.log(
    `${category}: products=${categoryProducts.length}, Voxy90 compat=${compatible.length}, missing fitment_type=${missingFitmentType.length}`,
  );

  for (const item of missingFitmentType) {
    console.warn(`  WARNING: ${item.name} has Voxy90 compatibility without fitment_type`);
  }
}

const wheelSummary: ConsultationSummary = {
  vehicle,
  budget: { maxYen: 200_000, note: "20万円以内" },
  category: "ホイール",
  usage: null,
  stylePreference: null,
  priorities: {
    appearance: "unknown",
    comfort: "unknown",
    practicality: "unknown",
    resale: "unknown",
  },
  direction: "ホイールのカスタムを検討中",
};

const wheelMatches = rankProductMatches(
  catalog,
  consultationSummaryToMatchInput(wheelSummary),
  { limit: 10 },
);

console.log("--- Voxy 90 wheel recommendation check ---");
console.log(`matches: ${wheelMatches.length}`);
for (const match of wheelMatches) {
  console.log(
    `  - ${match.product.name} | score ${Math.round(match.score)} | ${match.vehicleCompatibility}`,
  );
}

assert(wheelMatches.length >= 1, "Voxy 90 wheel consultation returned no real products");
assert(
  wheelMatches.every(
    (match) =>
      match.vehicleCompatibility === "confirmed" || match.vehicleCompatibility === "reference",
  ),
  "Voxy 90 wheel recommendation contains an unknown/incompatible vehicle status",
);

const voxyCompatRows = await db
  .select({ productId: productVehicleCompatibilities.productId, fitmentType: productVehicleCompatibilities.fitmentType })
  .from(productVehicleCompatibilities)
  .innerJoin(products, eq(products.id, productVehicleCompatibilities.productId))
  .where(eq(products.isActive, true));

const realVoxyRows = voxyCompatRows.filter((row) => row.productId != null);
const nullFitmentRows = realVoxyRows.filter((row) => row.fitmentType == null);
assert(nullFitmentRows.length === 0, `active real compatibility rows with null fitment_type: ${nullFitmentRows.length}`);

console.log("\n--- verify summary ---");
console.log("real catalog loads without demo products");
console.log("Voxy 90 wheel recommendation returns at least one real compatible product");
console.log("all active real compatibility rows have fitment_type");

await client.end();
