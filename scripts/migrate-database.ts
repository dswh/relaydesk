import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

import { requireDatabaseUrl } from "./database-environment";

const pool = new Pool({ connectionString: requireDatabaseUrl() });
const migrationsDirectory = path.join(process.cwd(), "db", "migrations");

async function migrate() {
  await pool.query(`
    create table if not exists relaydesk_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const migrations = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migration of migrations) {
    const applied = await pool.query<{ exists: boolean }>(
      "select exists(select 1 from relaydesk_migrations where name = $1)",
      [migration],
    );
    if (applied.rows[0]?.exists) continue;

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        await readFile(path.join(migrationsDirectory, migration), "utf8"),
      );
      await client.query("insert into relaydesk_migrations (name) values ($1)", [
        migration,
      ]);
      await client.query("commit");
      console.info(`Applied ${migration}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}

try {
  await migrate();
} finally {
  await pool.end();
}

