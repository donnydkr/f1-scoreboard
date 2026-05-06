import { Pool } from "pg";

let telemetryPool;

function getTelemetryConnectionString() {
  if (process.env.TELEMETRY_DATABASE_URL) {
    return process.env.TELEMETRY_DATABASE_URL;
  }

  const host = process.env.TELEMETRY_DATABASE_HOST || "localhost";
  const port = process.env.TELEMETRY_DATABASE_PORT || "5432";
  const database = process.env.TELEMETRY_POSTGRES_DB;
  const user = process.env.TELEMETRY_POSTGRES_USER;
  const password = process.env.TELEMETRY_POSTGRES_PASSWORD;

  if (!host || !database || !user || !password) {
    return null;
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getTelemetryPool() {
  const connectionString = getTelemetryConnectionString();

  if (!connectionString) {
    throw new Error("Telemetry database connection settings are not set.");
  }

  if (!telemetryPool) {
    telemetryPool = new Pool({
      connectionString
    });
  }

  return telemetryPool;
}

export async function telemetrySql(text, params = []) {
  const pool = getTelemetryPool();
  return pool.query(text, params);
}
