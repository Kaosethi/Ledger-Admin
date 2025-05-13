import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config";
import * as schema from "./schema";

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Create and export the database instance with the full schema
export const db = drizzle(pool, { schema });

// Export a query client
export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params || []);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// Export a single row query helper
export async function queryOne<T>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Graceful shutdown helper
export async function closeDb(): Promise<void> {
  await pool.end();
}
