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
        seat,
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
        seat,
        is_wet,
        session_date,
        created_at
      from lap_times
      order by created_at desc
    `
  );

  return result.rows;
}

export async function getLapTimesForExport() {
  const result = await sql(
    `
      select
        id,
        driver_name,
        track_name,
        car_name,
        lap_time_display,
        lap_time_ms,
        setup,
        seat,
        is_wet,
        session_date,
        notes,
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
        seat,
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

    const trackBestResult = await client.query(
      `
        select
          id,
          driver_name,
          track_name,
          car_name,
          lap_time_ms,
          lap_time_display,
          setup,
          seat,
          is_wet,
          session_date,
          notes,
          created_at
        from lap_times
        where track_name = $1
        order by lap_time_ms asc, created_at asc
        for update
      `,
      [input.trackName]
    );

    const trackBestBefore = trackBestResult.rows[0] || null;

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
          seat,
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
    const isCircuitRecord = !trackBestBefore || input.lapTimeMs < trackBestBefore.lap_time_ms;

    if (existingBest && existingBest.lap_time_ms <= input.lapTimeMs) {
      await client.query("commit");

      return {
        action: "skipped",
        data: existingBest,
        isCircuitRecord: false
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
          notes,
          seat
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning
          id,
          driver_name,
          track_name,
          car_name,
          lap_time_ms,
          lap_time_display,
          setup,
          is_wet,
          seat,
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
        input.notes,
        input.seat
      ]
    );

    await client.query("commit");

    return {
      action: existingBest ? "replaced" : "created",
      data: insertResult.rows[0],
      previousBest: existingBest,
      isCircuitRecord
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

export async function importLapTimes(rows, { replaceExisting = false } = {}) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("begin");

    if (replaceExisting) {
      await client.query("delete from lap_times");
      await client.query("delete from drivers");
    }

    for (const row of rows) {
      await client.query(
        `
          insert into lap_times (
            id,
            driver_name,
            track_name,
            car_name,
            lap_time_display,
            lap_time_ms,
            setup,
            seat,
            is_wet,
            session_date,
            notes,
            created_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          on conflict (id) do update
            set driver_name = excluded.driver_name,
                track_name = excluded.track_name,
                car_name = excluded.car_name,
                lap_time_display = excluded.lap_time_display,
                lap_time_ms = excluded.lap_time_ms,
                setup = excluded.setup,
                seat = excluded.seat,
                is_wet = excluded.is_wet,
                session_date = excluded.session_date,
                notes = excluded.notes,
                created_at = excluded.created_at
        `,
        [
          row.id,
          row.driver_name,
          row.track_name,
          row.car_name,
          row.lap_time_display,
          row.lap_time_ms,
          row.setup,
          row.seat,
          row.is_wet,
          row.session_date,
          row.notes,
          row.created_at
        ]
      );
    }

    const driverNames = [...new Set(rows.map((row) => row.driver_name).filter(Boolean))];

    for (const driverName of driverNames) {
      await client.query(
        `
          insert into drivers (name)
          values ($1)
          on conflict (name) do nothing
        `,
        [driverName]
      );
    }

    await client.query(
      `
        select setval(
          pg_get_serial_sequence('lap_times', 'id'),
          coalesce((select max(id) from lap_times), 1),
          (select exists(select 1 from lap_times))
        )
      `
    );

    await client.query(
      `
        select setval(
          pg_get_serial_sequence('drivers', 'id'),
          coalesce((select max(id) from drivers), 1),
          (select exists(select 1 from drivers))
        )
      `
    );

    await client.query("commit");

    return {
      importedCount: rows.length,
      driverCount: driverNames.length,
      replacedExisting: replaceExisting
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
