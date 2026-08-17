import { createServerFn } from "@tanstack/react-start";
import { asc } from "drizzle-orm";

import { getDb } from "./server/db/client.server";
import { carMasters } from "./server/db/schema/car-masters";

export type CarMastersResult = {
  makers: string[];
  modelsByMaker: Record<string, string[]>;
};

export const listCarMasters = createServerFn({ method: "GET" }).handler(
  async (): Promise<CarMastersResult> => {
    let rows: { maker: string; model: string }[];

    try {
      const db = getDb();
      rows = await db
        .select({ maker: carMasters.maker, model: carMasters.model })
        .from(carMasters)
        .orderBy(asc(carMasters.maker), asc(carMasters.model));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error";
      throw new Error(`Failed to fetch car masters from database: ${message}`);
    }

    if (rows.length === 0) {
      throw new Error("No car masters found in database");
    }

    const makers: string[] = [];
    const modelsByMaker: Record<string, string[]> = {};

    for (const { maker, model } of rows) {
      if (!modelsByMaker[maker]) {
        modelsByMaker[maker] = [];
        makers.push(maker);
      }

      const models = modelsByMaker[maker];
      if (!models.includes(model)) {
        models.push(model);
      }
    }

    for (const maker of makers) {
      modelsByMaker[maker].sort((a, b) => a.localeCompare(b));
    }

    return { makers, modelsByMaker };
  },
);
