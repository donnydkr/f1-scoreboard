import { Pool } from "pg";

let pool;

function getConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DATABASE_HOST || "localhost";
  const port = process.env.DATABASE_PORT || "5432";
  const database = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!host || !database || !user || !password) {
    return null;
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error("Database connection settings are not set.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString
    });
  }

  return pool;
}

export async function sql(text, params = []) {
  const activePool = getPool();
  return activePool.query(text, params);
}
