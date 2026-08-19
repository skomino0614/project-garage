/**
 * Idempotent seed for demo wheel products (Phase 6-5).
 * These are explicitly test/demo catalog entries — not real retail products.
 *
 * Usage:
 *   MIGRATE_URL=... npm run db:seed:products
 */
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { carMasters } from "../src/lib/server/db/schema/car-masters";
import { productVehicleCompatibilities } from "../src/lib/server/db/schema/product-vehicle-compatibilities";
import { products } from "../src/lib/server/db/schema/products";

const url = process.env.MIGRATE_URL;
if (!url) {
  throw new Error("Missing MIGRATE_URL");
}

const DEMO_NOTE =
  "Project Garage 動作確認用のデモ商品です。実在の販売商品ではありません。";

/** Stable IDs so re-running the seed updates the same rows. */
const DEMO_PRODUCT_IDS = {
  wheel01: "a1000001-0001-4001-8001-000000000001",
  wheel02: "a1000001-0001-4001-8001-000000000002",
  wheel03: "a1000001-0001-4001-8001-000000000003",
  wheel04: "a1000001-0001-4001-8001-000000000004",
  wheel05: "a1000001-0001-4001-8001-000000000005",
  wheel06: "a1000001-0001-4001-8001-000000000006",
} as const;

const DEMO_PRODUCT_ROWS = [
  {
    id: DEMO_PRODUCT_IDS.wheel01,
    category: "ホイール",
    name: "[DEMO] Test Wheel Luxe 18",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 150_000,
    priceMaxYen: 175_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "メッシュ", "高級感"],
  },
  {
    id: DEMO_PRODUCT_IDS.wheel02,
    category: "ホイール",
    name: "[DEMO] Test Wheel Comfort Mesh",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 165_000,
    priceMaxYen: 190_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "メッシュ", "高級感"],
  },
  {
    id: DEMO_PRODUCT_IDS.wheel03,
    category: "ホイール",
    name: "[DEMO] Test Wheel Budget Line",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 140_000,
    priceMaxYen: 160_000,
    appearance: "high",
    comfort: "medium",
    practicality: "high",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "17インチ", "高級感"],
  },
  {
    id: DEMO_PRODUCT_IDS.wheel04,
    category: "ホイール",
    name: "[DEMO] Test Wheel Premium Edge",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 180_000,
    priceMaxYen: 200_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "高級感"],
  },
  {
    id: DEMO_PRODUCT_IDS.wheel05,
    category: "ホイール",
    name: "[DEMO] Test Wheel Max Budget",
    brand: "Project Garage Demo",
    description: DEMO_NOTE,
    priceMinYen: 195_000,
    priceMaxYen: 200_000,
    appearance: "high",
    comfort: "high",
    practicality: "low",
    resale: "low",
    style: "高級感",
    tags: ["demo", "test-data", "18インチ", "メッシュ"],
  },
  {
    id: DEMO_PRODUCT_IDS.wheel06,
    category: "ホイール",
    name: "[DEMO] Test Wheel Over Budget",
    brand: "Project Garage Demo",
    description: `${DEMO_NOTE} 予算フィルタ確認用（20万円超）。`,
    priceMinYen: 250_000,
    priceMaxYen: 280_000,
    appearance: "high",
    comfort: "high",
    practicality: "medium",
    resale: "medium",
    style: "高級感",
    tags: ["demo", "test-data", "予算超過確認用"],
  },
] as const;

const VEHICLE = {
  maker: "Toyota",
  model: "Voxy",
  series: "90 Series",
} as const;

const client = postgres(url, { max: 1 });
const db = drizzle(client);

const demoProductIdList = Object.values(DEMO_PRODUCT_IDS);

const [voxyCarMaster] = await db
  .select({ id: carMasters.id })
  .from(carMasters)
  .where(and(eq(carMasters.maker, VEHICLE.maker), eq(carMasters.model, VEHICLE.model)))
  .limit(1);

const carMasterId = voxyCarMaster?.id ?? null;

for (const row of DEMO_PRODUCT_ROWS) {
  await db
    .insert(products)
    .values({
      id: row.id,
      category: row.category,
      name: row.name,
      brand: row.brand,
      description: row.description,
      priceMinYen: row.priceMinYen,
      priceMaxYen: row.priceMaxYen,
      imageUrl: null,
      productUrl: null,
      purchaseUrl: null,
      appearance: row.appearance,
      comfort: row.comfort,
      practicality: row.practicality,
      resale: row.resale,
      style: row.style,
      tags: [...row.tags],
      isActive: true,
    })
    .onConflictDoUpdate({
      target: products.id,
      set: {
        category: row.category,
        name: row.name,
        brand: row.brand,
        description: row.description,
        priceMinYen: row.priceMinYen,
        priceMaxYen: row.priceMaxYen,
        appearance: row.appearance,
        comfort: row.comfort,
        practicality: row.practicality,
        resale: row.resale,
        style: row.style,
        tags: [...row.tags],
        isActive: true,
        updatedAt: new Date(),
      },
    });
}

await db
  .delete(productVehicleCompatibilities)
  .where(inArray(productVehicleCompatibilities.productId, demoProductIdList));

const compatibilityRows = demoProductIdList.map((productId) => ({
  productId,
  carMasterId,
  maker: VEHICLE.maker,
  model: VEHICLE.model,
  series: VEHICLE.series,
  note: "90系Voxy向けデモ適合データ",
}));

await db.insert(productVehicleCompatibilities).values(compatibilityRows);

const compatCount = await db
  .select({ id: productVehicleCompatibilities.id })
  .from(productVehicleCompatibilities)
  .where(inArray(productVehicleCompatibilities.productId, demoProductIdList));

console.log(`demo products upserted: ${DEMO_PRODUCT_ROWS.length}`);
console.log(`demo compatibilities inserted: ${compatCount.length}`);
console.log(`carMasterId linked: ${carMasterId ?? "none (maker/model text only)"}`);

await client.end();
