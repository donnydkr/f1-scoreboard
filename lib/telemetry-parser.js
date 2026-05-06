import { formatLapTime } from "@/lib/time";

export const TELEMETRY_PACKET_NAMES = {
  0: "motion",
  1: "session",
  2: "lap_data",
  3: "event",
  4: "participants",
  5: "car_setups",
  6: "car_telemetry",
  7: "car_status",
  8: "final_classification",
  9: "lobby_info",
  10: "car_damage",
  11: "session_history",
  12: "tyre_sets",
  13: "motion_ex",
  14: "time_trial"
};

const TRACK_NAMES = {
  0: "Albert Park",
  2: "Shanghai International",
  3: "Bahrain",
  4: "Barcelona-Catalunya",
  5: "Monaco",
  6: "Gilles Villeneuve",
  7: "Silverstone",
  9: "Hungaroring",
  10: "Spa-Francorchamps",
  11: "Monza",
  12: "Marina Bay",
  13: "Suzuka",
  14: "Yas Marina",
  15: "Americas",
  16: "Interlagos",
  17: "Red Bull Ring",
  19: "Hermanos Rodriguez",
  20: "Baku",
  26: "Zandvoort",
  27: "Imola",
  29: "Jeddah",
  30: "Miami Autodrome",
  31: "Las Vegas",
  32: "Lusail International"
};

const HEADER_SIZE = 29;
const LAP_DATA_ENTRY_SIZE = 57;
const PARTICIPANT_ENTRY_SIZE = 60;
const SUPPORTED_PACKET_FORMATS = new Set([2024, 2025]);

function sanitizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\u0000/g, "").trim();
}

function readUtf8String(buffer, start, length) {
  return sanitizeString(
    buffer
      .subarray(start, start + length)
      .toString("utf8")
      .split("\u0000")[0]
  );
}

function getTrackName(trackId) {
  return TRACK_NAMES[trackId] || null;
}

function getPacketName(packetId) {
  return TELEMETRY_PACKET_NAMES[packetId] || `unknown_${packetId}`;
}

export function parsePacketHeader(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < HEADER_SIZE) {
    return null;
  }

  const packetFormat = buffer.readUInt16LE(0);

  if (!SUPPORTED_PACKET_FORMATS.has(packetFormat)) {
    return {
      packetFormat,
      packetName: "unsupported",
      isSupported: false
    };
  }

  const packetId = buffer.readUInt8(6);

  return {
    packetFormat,
    gameYear: buffer.readUInt8(2),
    gameMajorVersion: buffer.readUInt8(3),
    gameMinorVersion: buffer.readUInt8(4),
    packetVersion: buffer.readUInt8(5),
    packetId,
    packetName: getPacketName(packetId),
    sessionUid: buffer.readBigUInt64LE(7).toString(),
    sessionTime: Number(buffer.readFloatLE(15).toFixed(3)),
    frameIdentifier: buffer.readUInt32LE(19),
    overallFrameIdentifier: buffer.readUInt32LE(23),
    playerCarIndex: buffer.readUInt8(27),
    secondaryPlayerCarIndex: buffer.readUInt8(28),
    isSupported: true
  };
}

export function parseSessionPacket(buffer, header) {
  if (!header?.isSupported || buffer.length < HEADER_SIZE + 9) {
    return null;
  }

  const weather = buffer.readUInt8(29);
  const trackTemperature = buffer.readInt8(30);
  const airTemperature = buffer.readInt8(31);
  const totalLaps = buffer.readUInt8(32);
  const trackLength = buffer.readUInt16LE(33);
  const sessionType = buffer.readUInt8(35);
  const trackId = buffer.readInt8(36);

  return {
    weather,
    trackTemperature,
    airTemperature,
    totalLaps,
    trackLength,
    sessionType,
    trackId,
    trackName: getTrackName(trackId)
  };
}

export function parseParticipantsPacket(buffer, header) {
  if (!header?.isSupported || buffer.length < HEADER_SIZE + 1 + PARTICIPANT_ENTRY_SIZE) {
    return null;
  }

  const numActiveCars = buffer.readUInt8(29);
  const participants = [];
  const startOffset = 30;

  for (let index = 0; index < 22; index += 1) {
    const offset = startOffset + index * PARTICIPANT_ENTRY_SIZE;

    if (offset + PARTICIPANT_ENTRY_SIZE > buffer.length) {
      break;
    }

    participants.push({
      index,
      aiControlled: buffer.readUInt8(offset) === 1,
      driverId: buffer.readUInt8(offset + 1),
      networkId: buffer.readUInt8(offset + 2),
      teamId: buffer.readUInt8(offset + 3),
      myTeam: buffer.readUInt8(offset + 4) === 1,
      raceNumber: buffer.readUInt8(offset + 5),
      nationality: buffer.readUInt8(offset + 6),
      name: readUtf8String(buffer, offset + 7, 48),
      yourTelemetry: buffer.readUInt8(offset + 55),
      showOnlineNames: buffer.readUInt8(offset + 56),
      techLevel: buffer.readUInt16LE(offset + 57),
      platform: buffer.readUInt8(offset + 59)
    });
  }

  const player = participants[header.playerCarIndex] || null;

  return {
    numActiveCars,
    participants,
    player
  };
}

export function parseLapDataPacket(buffer, header, sessionContext = null) {
  if (!header?.isSupported || buffer.length < HEADER_SIZE + LAP_DATA_ENTRY_SIZE) {
    return null;
  }

  const entryOffset = HEADER_SIZE + header.playerCarIndex * LAP_DATA_ENTRY_SIZE;

  if (entryOffset + LAP_DATA_ENTRY_SIZE > buffer.length) {
    return null;
  }

  const lastLapTimeMs = buffer.readUInt32LE(entryOffset);
  const currentLapTimeMs = buffer.readUInt32LE(entryOffset + 4);
  const lapDistance = buffer.readFloatLE(entryOffset + 20);
  const totalDistance = buffer.readFloatLE(entryOffset + 24);
  const safetyCarDelta = buffer.readFloatLE(entryOffset + 28);
  const carPosition = buffer.readUInt8(entryOffset + 32);
  const currentLapNum = buffer.readUInt8(entryOffset + 33);
  const pitStatus = buffer.readUInt8(entryOffset + 34);
  const numPitStops = buffer.readUInt8(entryOffset + 35);
  const sector = buffer.readUInt8(entryOffset + 36);
  const currentLapInvalid = buffer.readUInt8(entryOffset + 37) === 1;
  const penalties = buffer.readUInt8(entryOffset + 38);
  const totalWarnings = buffer.readUInt8(entryOffset + 39);
  const cornerCuttingWarnings = buffer.readUInt8(entryOffset + 40);
  const numUnservedDriveThroughPens = buffer.readUInt8(entryOffset + 41);
  const numUnservedStopGoPens = buffer.readUInt8(entryOffset + 42);
  const gridPosition = buffer.readUInt8(entryOffset + 43);
  const driverStatus = buffer.readUInt8(entryOffset + 44);
  const resultStatus = buffer.readUInt8(entryOffset + 45);
  const pitLaneTimerActive = buffer.readUInt8(entryOffset + 46) === 1;
  const pitLaneTimeInLaneInMs = buffer.readUInt16LE(entryOffset + 47);
  const pitStopTimerInMs = buffer.readUInt16LE(entryOffset + 49);
  const pitStopShouldServePen = buffer.readUInt8(entryOffset + 51) === 1;
  const speedTrapFastestSpeed = Number(buffer.readFloatLE(entryOffset + 52).toFixed(3));
  const speedTrapFastestLap = buffer.readUInt8(entryOffset + 56);

  const completedLapNumber = currentLapNum > 0 ? currentLapNum - 1 : null;
  const driverName = sessionContext?.participants?.[header.playerCarIndex]?.name || null;
  const trackId = sessionContext?.trackId ?? null;
  const trackName = sessionContext?.trackName || null;
  const lapTimeDisplay = lastLapTimeMs > 0 ? formatLapTime(lastLapTimeMs) : null;

  return {
    driverIndex: header.playerCarIndex,
    isPlayerCar: true,
    driverName,
    trackId,
    trackName,
    sessionType: sessionContext?.sessionType ?? null,
    lastLapTimeMs,
    lapTimeDisplay,
    currentLapTimeMs,
    completedLapNumber,
    currentLapNum,
    carPosition,
    pitStatus,
    numPitStops,
    sector,
    currentLapInvalid,
    penalties,
    totalWarnings,
    cornerCuttingWarnings,
    numUnservedDriveThroughPens,
    numUnservedStopGoPens,
    gridPosition,
    driverStatus,
    resultStatus,
    pitLaneTimerActive,
    pitLaneTimeInLaneInMs,
    pitStopTimerInMs,
    pitStopShouldServePen,
    speedTrapFastestSpeed,
    speedTrapFastestLap,
    lapDistance: Number(lapDistance.toFixed(3)),
    totalDistance: Number(totalDistance.toFixed(3)),
    safetyCarDelta: Number(safetyCarDelta.toFixed(3))
  };
}

export function parseTimeTrialPacket(buffer, header, sessionContext = null) {
  if (!header?.isSupported || buffer.length < HEADER_SIZE + 72) {
    return null;
  }

  const startOffset = HEADER_SIZE;

  function readDataSet(offset) {
    return {
      carIndex: buffer.readUInt8(offset),
      teamId: buffer.readUInt8(offset + 1),
      lapTimeMs: buffer.readUInt32LE(offset + 2),
      sector1TimeMs: buffer.readUInt32LE(offset + 6),
      sector2TimeMs: buffer.readUInt32LE(offset + 10),
      sector3TimeMs: buffer.readUInt32LE(offset + 14),
      tractionControl: buffer.readUInt8(offset + 18),
      gearboxAssist: buffer.readUInt8(offset + 19),
      antiLockBrakes: buffer.readUInt8(offset + 20),
      equalCarPerformance: buffer.readUInt8(offset + 21) === 1,
      customSetup: buffer.readUInt8(offset + 22) === 1,
      valid: buffer.readUInt8(offset + 23) === 1
    };
  }

  const playerSessionBest = readDataSet(startOffset);
  const personalBest = readDataSet(startOffset + 24);
  const rival = readDataSet(startOffset + 48);

  return {
    driverName: sessionContext?.participants?.[header.playerCarIndex]?.name || null,
    trackId: sessionContext?.trackId ?? null,
    trackName: sessionContext?.trackName || null,
    playerSessionBest,
    personalBest,
    rival
  };
}

export function shouldCreateLapEvent(lapData) {
  return Boolean(
    lapData &&
      Number.isFinite(lapData.lastLapTimeMs) &&
      lapData.lastLapTimeMs > 0 &&
      Number.isFinite(lapData.completedLapNumber) &&
      lapData.completedLapNumber >= 1 &&
      !lapData.currentLapInvalid &&
      lapData.resultStatus !== 0 &&
      lapData.resultStatus !== 1
  );
}

export function buildPacketPreview(buffer) {
  return buffer.subarray(0, Math.min(buffer.length, 64)).toString("hex");
}
