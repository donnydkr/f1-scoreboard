import { getPool, sql } from "@/lib/db";

export async function getTopLapTimes(limit = 10) {
  const result = await sql(
    `
      select
        id,
        driver_name,
        track_name,
        car_name,
        lap_time_ms,
        setup,
        is_wet,
        session_date,
        created_at
      from lap_times
      order by lap_time_ms asc, created_at asc
      limit $1
    `,
    [limit]
  );

  return result.rows;
}

export async function getAllLapTimes() {
  const result = await sql(
    `
      select
        id,
        driver_name,
        track_name,
        car_name,
        lap_time_ms,
        setup,
        is_wet,
        session_date,
        created_at
      from lap_times
      order by created_at desc
    `
  );

  return result.rows;
}

export async function getRecentLapTimes(limit = 12) {
  const result = await sql(
    `
      select
        id,
        driver_name,
        track_name,
        car_name,
        lap_time_ms,
        setup,
        is_wet,
        session_date,
        created_at
      from lap_times
      order by created_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows;
}

export async function createLapTime(input) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");

    const existingResult = await client.query(
      `
        select
          id,
          driver_name,
          track_name,
          car_name,
          lap_time_ms,
          lap_time_display,
          setup,
          is_wet,
          session_date,
          notes,
          created_at
        from lap_times
        where driver_name = $1
          and track_name = $2
          and is_wet = $3
        order by lap_time_ms asc, created_at asc
        for update
      `,
      [input.driverName, input.trackName, input.isWet]
    );

    const existingBest = existingResult.rows[0] || null;

    if (existingBest && existingBest.lap_time_ms <= input.lapTimeMs) {
      await client.query("commit");

      return {
        action: "skipped",
        data: existingBest
      };
    }

    if (existingResult.rows.length > 0) {
      await client.query(
        `
          delete from lap_times
          where driver_name = $1
            and track_name = $2
            and is_wet = $3
        `,
        [input.driverName, input.trackName, input.isWet]
      );
    }

    const insertResult = await client.query(
      `
        insert into lap_times (
          driver_name,
          track_name,
          car_name,
          lap_time_ms,
          lap_time_display,
          setup,
          is_wet,
          session_date,
          notes
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning
          id,
          driver_name,
          track_name,
          car_name,
          lap_time_ms,
          lap_time_display,
          setup,
          is_wet,
          session_date,
          notes,
          created_at
      `,
      [
        input.driverName,
        input.trackName,
        input.carName,
        input.lapTimeMs,
        input.lapTimeDisplay,
        input.setup,
        input.isWet,
        input.sessionDate,
        input.notes
      ]
    );

    await client.query("commit");

    return {
      action: existingBest ? "replaced" : "created",
      data: insertResult.rows[0],
      previousBest: existingBest
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteLapTimeById(id) {
  const result = await sql(
    `
      delete from lap_times
      where id = $1
      returning id
    `,
    [id]
  );

  return result.rows[0] || null;
}
