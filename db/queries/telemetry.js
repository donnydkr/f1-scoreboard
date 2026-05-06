import { getTelemetryPool, telemetrySql } from "@/lib/telemetry-db";

export async function recordTelemetryCapture({
  header,
  sourceIp,
  sourcePort,
  listenerPort,
  payloadSizeBytes,
  packetHexPreview,
  payloadJson,
  lapEvent
}) {
  const pool = getTelemetryPool();
  const client = await pool.connect();

  try {
    await client.query("begin");

    const packetResult = await client.query(
      `
        insert into telemetry_packets (
          source_ip,
          source_port,
          packet_format,
          game_year,
          game_major_version,
          game_minor_version,
          packet_version,
          packet_id,
          packet_name,
          session_uid,
          session_time_seconds,
          frame_identifier,
          overall_frame_identifier,
          listener_port,
          player_car_index,
          secondary_player_car_index,
          payload_size_bytes,
          packet_hex_preview,
          payload_json
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        returning id
      `,
      [
        sourceIp,
        sourcePort,
        header.packetFormat,
        header.gameYear,
        header.gameMajorVersion,
        header.gameMinorVersion,
        header.packetVersion,
        header.packetId,
        header.packetName,
        header.sessionUid,
        header.sessionTime,
        header.frameIdentifier,
        header.overallFrameIdentifier,
        listenerPort,
        header.playerCarIndex,
        header.secondaryPlayerCarIndex,
        payloadSizeBytes,
        packetHexPreview,
        JSON.stringify(payloadJson)
      ]
    );

    let lapStored = false;

    if (lapEvent) {
      const lapResult = await client.query(
        `
          insert into telemetry_lap_events (
            telemetry_packet_id,
            listener_port,
            source_ip,
            source_port,
            session_uid,
            packet_format,
            driver_index,
            player_car_index,
            is_player_car,
            driver_name,
            track_id,
            track_name,
            session_type,
            completed_lap_number,
            current_lap_number,
            lap_time_ms,
            lap_time_display,
            current_lap_time_ms,
            sector,
            result_status,
            pit_status,
            car_position,
            source,
            raw_summary
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          on conflict do nothing
          returning id
        `,
        [
          packetResult.rows[0].id,
          listenerPort,
          sourceIp,
          sourcePort,
          lapEvent.sessionUid,
          lapEvent.packetFormat,
          lapEvent.driverIndex,
          lapEvent.playerCarIndex,
          lapEvent.isPlayerCar,
          lapEvent.driverName,
          lapEvent.trackId,
          lapEvent.trackName,
          lapEvent.sessionType,
          lapEvent.completedLapNumber,
          lapEvent.currentLapNumber,
          lapEvent.lapTimeMs,
          lapEvent.lapTimeDisplay,
          lapEvent.currentLapTimeMs,
          lapEvent.sector,
          lapEvent.resultStatus,
          lapEvent.pitStatus,
          lapEvent.carPosition,
          lapEvent.source,
          JSON.stringify(lapEvent.rawSummary)
        ]
      );

      lapStored = lapResult.rowCount > 0;
    }

    await client.query("commit");

    return {
      packetStored: true,
      lapStored
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getTelemetryStats() {
  const [packetsResult, lapsResult] = await Promise.all([
    telemetrySql(
      `
        select
          count(*)::int as total_packets,
          max(received_at) as latest_packet_at
        from telemetry_packets
      `
    ),
    telemetrySql(
      `
        select
          count(*)::int as total_lap_events,
          max(received_at) as latest_lap_at
        from telemetry_lap_events
      `
    )
  ]);

  return {
    totalPackets: packetsResult.rows[0]?.total_packets || 0,
    latestPacketAt: packetsResult.rows[0]?.latest_packet_at || null,
    totalLapEvents: lapsResult.rows[0]?.total_lap_events || 0,
    latestLapAt: lapsResult.rows[0]?.latest_lap_at || null
  };
}

export async function getRecentTelemetryPackets(limit = 40) {
  const result = await telemetrySql(
    `
      select
        id,
        received_at,
        source_ip,
        source_port,
        listener_port,
        packet_format,
        packet_id,
        packet_name,
        session_uid,
        session_time_seconds,
        frame_identifier,
        overall_frame_identifier,
        player_car_index,
        payload_size_bytes,
        payload_json
      from telemetry_packets
      order by received_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows;
}

export async function getRecentTelemetryLapEvents(limit = 25) {
  const result = await telemetrySql(
    `
      select
        id,
        received_at,
        session_uid,
        listener_port,
        source_ip,
        source_port,
        packet_format,
        driver_index,
        player_car_index,
        is_player_car,
        driver_name,
        track_id,
        track_name,
        session_type,
        completed_lap_number,
        current_lap_number,
        lap_time_ms,
        lap_time_display,
        current_lap_time_ms,
        sector,
        result_status,
        pit_status,
        car_position,
        source,
        raw_summary
      from telemetry_lap_events
      order by received_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows;
}

export async function clearTelemetryData() {
  const pool = getTelemetryPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query("truncate table telemetry_lap_events, telemetry_packets restart identity");
    await client.query("commit");

    return { success: true };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
