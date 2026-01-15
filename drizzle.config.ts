import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use direct connection for drizzle-kit commands (not the pooler)
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL!,
  },
  schemaFilter: ["public"], // Only use public schema, ignore auth and other Supabase schemas
});
