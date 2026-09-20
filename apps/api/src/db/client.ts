/**
 * Database client.
 *
 * The whole database layer lives under `src/db/`: this client, the per-table
 * schema files in `schema/`, and the audit helper. It is outside `src/modules/`
 * because every module needs it and no module owns it.
 *
 * The Drizzle instance is built **without** a schema, so this file imports no
 * table definitions and is usable from any context — including `app.ts` and the
 * shutdown path, which only need the pool. Schemas are passed explicitly where a
 * library needs them: the Better Auth adapter takes every table it might touch
 * (`auth.config.ts`), and `drizzle.config.ts` points at `schema/index.ts` for
 * migrations. Pass `{ schema }` here if and when relational `db.query.*` is
 * wanted.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { env } from "../shared/config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

/** Surface pool-level failures instead of letting them crash the process. */
pool.on("error", (error) => {
  console.error("[db] idle client error", error);
});

export const db = drizzle(pool);

export type Database = typeof db;

/**
 * Close the pool. Called from the shutdown path so in-flight queries are not
 * severed mid-request.
 */
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
