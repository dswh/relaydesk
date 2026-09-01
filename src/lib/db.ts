import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

const globalDatabase = globalThis as typeof globalThis & {
  relaydeskPool?: Pool;
};

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for PostgreSQL-backed reads.");
  }

  if (!globalDatabase.relaydeskPool) {
    globalDatabase.relaydeskPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      idleTimeoutMillis: 30_000,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      ssl:
        process.env.DATABASE_SSL === "require"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return globalDatabase.relaydeskPool;
}

export async function query<Row extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<Row>> {
  return getPool().query<Row>(text, values);
}

export async function closeDatabase() {
  if (!globalDatabase.relaydeskPool) return;
  const pool = globalDatabase.relaydeskPool;
  delete globalDatabase.relaydeskPool;
  await pool.end();
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
