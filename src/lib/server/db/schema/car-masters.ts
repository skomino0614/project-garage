import { index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const carMasters = pgTable(
  "car_masters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    maker: text("maker").notNull(),
    model: text("model").notNull(),
    generation: text("generation"),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("car_masters_maker_model_unique").on(table.maker, table.model),
    index("car_masters_maker_idx").on(table.maker),
  ],
);
