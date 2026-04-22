import { sql } from "@/lib/db";

export async function getDrivers() {
  const result = await sql(
    `
      select
        id,
        name,
        created_at
      from drivers
      order by lower(name) asc, created_at asc
    `
  );

  return result.rows;
}

export async function createDriver(name) {
  const result = await sql(
    `
      insert into drivers (name)
      values ($1)
      on conflict (name) do update
        set name = excluded.name
      returning
        id,
        name,
        created_at
    `,
    [name]
  );

  return result.rows[0];
}
