import { getPool, sql } from "@/lib/db";

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

export async function deleteDriverWithLapTimes(id) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");

    const driverResult = await client.query(
      `
        select
          id,
          name,
          created_at
        from drivers
        where id = $1
        for update
      `,
      [id]
    );

    const driver = driverResult.rows[0] || null;

    if (!driver) {
      await client.query("commit");
      return null;
    }

    const lapTimesResult = await client.query(
      `
        delete from lap_times
        where driver_name = $1
      `,
      [driver.name]
    );

    await client.query(
      `
        delete from drivers
        where id = $1
      `,
      [id]
    );

    await client.query("commit");

    return {
      driver,
      deletedLapTimeCount: lapTimesResult.rowCount
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
