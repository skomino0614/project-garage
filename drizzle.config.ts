import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/server/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.MIGRATE_URL!,
  },
});
