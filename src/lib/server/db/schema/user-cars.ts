import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { carMasters } from "./car-masters";
import { users } from "./users";

export const userCars = pgTable(
  "user_cars",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    carMasterId: uuid("car_master_id")
      .notNull()
      .references(() => carMasters.id, { onDelete: "restrict" }),
    nickname: text("nickname"),
    year: text("year"),
    mileage: integer("mileage"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("user_cars_user_id_idx").on(table.userId)],
);
