import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

export function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env.local before running database scripts.",
    );
  }

  return process.env.DATABASE_URL;
}

