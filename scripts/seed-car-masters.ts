import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { MAKERS, MODELS } from "../src/lib/car-data";
import { carMasters } from "../src/lib/server/db/schema/car-masters";

const url = process.env.MIGRATE_URL;
if (!url) {
  throw new Error("Missing MIGRATE_URL");
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

const rows = MAKERS.flatMap((maker) => (MODELS[maker] ?? []).map((model) => ({ maker, model })));

await db
  .insert(carMasters)
  .values(rows)
  .onConflictDoNothing({ target: [carMasters.maker, carMasters.model] });

const result = await db.select().from(carMasters);
console.log(`car_masters seeded: ${result.length} rows`);

await client.end();
