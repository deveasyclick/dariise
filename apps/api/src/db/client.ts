// Built without a schema so this file imports no table definitions, which keeps it
// usable from any context and avoids a repository -> db -> schema -> repository
// cycle. Schemas are passed where needed; add `{ schema }` if `db.query.*` is wanted.

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { env } from "../config/index.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.databasePoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

/** Surface pool-level failures instead of letting them crash the process. */
pool.on("error", (error) => {
  console.error("[db] idle client error", error);
});

export const db = drizzle(pool);

export type Database = typeof db;

// Called from the shutdown path so in-flight queries are not severed mid-request.
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
