import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

/**
 * Connect to your database using the Connection Pooler.
 * Transaction pooler
 * Shared Pooler
 * Ideal for stateless applications like serverless functions where each interaction with Postgres is brief and isolated.
 */

// Next.js automatically loads .env files, no need for dotenv here

const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString!, {
  prepare: false, // Required for transaction pooler mode
  max: 1, // Limit to 1 connection per serverless instance
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client, { schema });
