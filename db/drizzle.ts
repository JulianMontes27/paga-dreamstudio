import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";
import * as relations from "./relations";

/**
 * Connect to your database using the Connection Pooler.
 * Transaction pooler
 * Shared Pooler
 * Ideal for stateless applications like serverless functions where each interaction with Postgres is brief and isolated.
 * The transaction pooler is the key component that multiplexes many application connections onto a small number of database connections.
 */

// Next.js automatically loads .env files, no need for dotenv here
// DATABASE_URL connects to Supabase's transaction pooler (port 6543), not directly to PostgreSQL (port 5432)
// - The pooler maintains a small pool of actual PostgreSQL connections
// - Each serverless function borrows a connection only for the duration of a transaction
// - Connections are immediately returned to the pool after each query completes
const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString!, {
  prepare: false, // Required for transaction pooler mode
  max: 1, // Limit to 1 connection per serverless instance, ensures each Vercel function instance uses only 1 connection
  // idle_timeout: 20, // Close idle connections after 20s
  // connect_timeout: 10, // Connection timeout in seconds
  ssl: "require", // Required for Supabase
});

// Merge schema and relations to avoid circular dependency
const fullSchema = { ...schema, ...relations };

export const db = drizzle(client, { schema: fullSchema });
