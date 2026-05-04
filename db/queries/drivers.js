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

export async function updateDriverName(id, name) {
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

    if (driver.name === name) {
      await client.query("commit");

      return {
        driver,
        updatedLapTimeCount: 0,
        renamed: false
      };
    }

    const conflictResult = await client.query(
      `
        select id
        from drivers
        where name = $1
          and id <> $2
        limit 1
      `,
      [name, id]
    );

    if (conflictResult.rows.length > 0) {
      await client.query("rollback");

      return {
        conflict: true
      };
    }

    const updatedDriverResult = await client.query(
      `
        update drivers
        set name = $1
        where id = $2
        returning
          id,
          name,
          created_at
      `,
      [name, id]
    );

    const updatedLapTimesResult = await client.query(
      `
        update lap_times
        set driver_name = $1
        where driver_name = $2
      `,
      [name, driver.name]
    );

    await client.query("commit");

    return {
      driver: updatedDriverResult.rows[0] || null,
      updatedLapTimeCount: updatedLapTimesResult.rowCount,
      renamed: true
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateDriverNameByCurrentName(currentName, name) {
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
        where name = $1
        for update
      `,
      [currentName]
    );

    const driver = driverResult.rows[0] || null;

    if (!driver) {
      await client.query("commit");
      return null;
    }

    if (driver.name === name) {
      await client.query("commit");

      return {
        driver,
        updatedLapTimeCount: 0,
        renamed: false
      };
    }

    const conflictResult = await client.query(
      `
        select id
        from drivers
        where name = $1
          and id <> $2
        limit 1
      `,
      [name, driver.id]
    );

    if (conflictResult.rows.length > 0) {
      await client.query("rollback");

      return {
        conflict: true
      };
    }

    const updatedDriverResult = await client.query(
      `
        update drivers
        set name = $1
        where id = $2
        returning
          id,
          name,
          created_at
      `,
      [name, driver.id]
    );

    const updatedLapTimesResult = await client.query(
      `
        update lap_times
        set driver_name = $1
        where driver_name = $2
      `,
      [name, currentName]
    );

    await client.query("commit");

    return {
      driver: updatedDriverResult.rows[0] || null,
      updatedLapTimeCount: updatedLapTimesResult.rowCount,
      renamed: true
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
