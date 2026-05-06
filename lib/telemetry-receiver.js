import dgram from "node:dgram";
import {
  buildPacketPreview,
  parseLapDataPacket,
  parsePacketHeader,
  parseParticipantsPacket,
  parseSessionPacket,
  parseTimeTrialPacket,
  shouldCreateLapEvent
} from "@/lib/telemetry-parser";
import {
  getTelemetryRuntimeState,
  markTelemetryConfigured,
  markTelemetryError,
  markTelemetryLapStored,
  markTelemetryPacketSeen,
  markTelemetryPacketStored,
  markTelemetrySessionCacheSize,
  markTelemetryStarted,
  markTelemetryStopped,
  resetTelemetryRuntimeMetrics
} from "@/lib/telemetry-state";
import { recordTelemetryCapture } from "@/db/queries/telemetry";

const DEFAULT_PORTS = [20777, 20778];
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PERSIST_PACKET_IDS = [1, 2, 4, 14];

function getSessionCache() {
  if (!globalThis.__f1TelemetrySessionCache) {
    globalThis.__f1TelemetrySessionCache = new Map();
  }

  return globalThis.__f1TelemetrySessionCache;
}

function getListenerHandle() {
  return globalThis.__f1TelemetryListenerHandle || null;
}

function setListenerHandle(handle) {
  globalThis.__f1TelemetryListenerHandle = handle;
}

function parseBooleanEnv(value) {
  return String(value || "").toLowerCase() === "true";
}

function parsePacketIdList(value) {
  if (!value) {
    return DEFAULT_PERSIST_PACKET_IDS;
  }

  const parsed = String(value)
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isInteger(part) && part >= 0);

  return parsed.length > 0 ? [...new Set(parsed)] : DEFAULT_PERSIST_PACKET_IDS;
}

function parsePortList() {
  const explicitPorts = process.env.TELEMETRY_UDP_PORTS;

  if (explicitPorts) {
    const parsed = explicitPorts
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isInteger(part) && part > 0);

    if (parsed.length > 0) {
      return [...new Set(parsed)];
    }
  }

  const ps1Port = Number(process.env.TELEMETRY_UDP_PORT_PS1 || DEFAULT_PORTS[0]);
  const ps2Port = Number(process.env.TELEMETRY_UDP_PORT_PS2 || DEFAULT_PORTS[1]);

  return [...new Set([ps1Port, ps2Port].filter((part) => Number.isInteger(part) && part > 0))];
}

function buildLapCacheKey(header, lapData) {
  return [
    header.sessionUid,
    lapData.driverIndex,
    lapData.completedLapNumber,
    lapData.lastLapTimeMs
  ].join(":");
}

function updateSessionContext(header, partialUpdate) {
  const cache = getSessionCache();
  const current = cache.get(header.sessionUid) || {
    participants: {},
    lapKeys: new Set()
  };

  const next = {
    ...current,
    ...partialUpdate,
    participants: {
      ...current.participants,
      ...(partialUpdate?.participants || {})
    },
    lapKeys: current.lapKeys || new Set()
  };

  cache.set(header.sessionUid, next);
  markTelemetrySessionCacheSize(cache.size);
  return next;
}

function getSessionContext(header) {
  return getSessionCache().get(header.sessionUid) || null;
}

function buildPersistedSummary(header, packetDetails) {
  return {
    header: {
      packetFormat: header.packetFormat,
      gameYear: header.gameYear,
      packetVersion: header.packetVersion,
      packetId: header.packetId,
      packetName: header.packetName,
      sessionUid: header.sessionUid,
      sessionTime: header.sessionTime,
      frameIdentifier: header.frameIdentifier,
      overallFrameIdentifier: header.overallFrameIdentifier,
      playerCarIndex: header.playerCarIndex
    },
    details: packetDetails
  };
}

async function handleMessage(message, remoteInfo, persistPacketIds, listenerPort) {
  const header = parsePacketHeader(message);

  if (!header) {
    return;
  }

  const packetName = header.packetName || "unknown";
  markTelemetryPacketSeen(packetName);

  if (!header.isSupported) {
    return;
  }

  let sessionContext = getSessionContext(header);
  let packetDetails = null;
  let lapEvent = null;

  if (header.packetId === 1) {
    packetDetails = parseSessionPacket(message, header);

    if (packetDetails) {
      sessionContext = updateSessionContext(header, {
        trackId: packetDetails.trackId,
        trackName: packetDetails.trackName,
        sessionType: packetDetails.sessionType
      });
    }
  } else if (header.packetId === 4) {
    packetDetails = parseParticipantsPacket(message, header);

    if (packetDetails) {
      const participants = Object.fromEntries(
        packetDetails.participants
          .filter((participant) => participant.name)
          .map((participant) => [participant.index, participant])
      );

      sessionContext = updateSessionContext(header, { participants });
    }
  } else if (header.packetId === 2) {
    packetDetails = parseLapDataPacket(message, header, sessionContext);

    if (shouldCreateLapEvent(packetDetails)) {
      const activeContext = sessionContext || updateSessionContext(header, {});
      const lapKey = buildLapCacheKey(header, packetDetails);

      if (!activeContext.lapKeys.has(lapKey)) {
        activeContext.lapKeys.add(lapKey);
        lapEvent = {
          sessionUid: header.sessionUid,
          packetFormat: header.packetFormat,
          driverIndex: packetDetails.driverIndex,
          playerCarIndex: header.playerCarIndex,
          isPlayerCar: packetDetails.isPlayerCar,
          driverName: packetDetails.driverName,
          trackId: packetDetails.trackId,
          trackName: packetDetails.trackName,
          sessionType: packetDetails.sessionType,
          completedLapNumber: packetDetails.completedLapNumber,
          currentLapNumber: packetDetails.currentLapNum,
          lapTimeMs: packetDetails.lastLapTimeMs,
          lapTimeDisplay: packetDetails.lapTimeDisplay,
          currentLapTimeMs: packetDetails.currentLapTimeMs,
          sector: packetDetails.sector,
          resultStatus: packetDetails.resultStatus,
          pitStatus: packetDetails.pitStatus,
          carPosition: packetDetails.carPosition,
          source: "lap_data",
          rawSummary: packetDetails
        };
      }
    }
  } else if (header.packetId === 14) {
    packetDetails = parseTimeTrialPacket(message, header, sessionContext);
  }

  if (!persistPacketIds.includes(header.packetId)) {
    return;
  }

  const result = await recordTelemetryCapture({
    header,
    sourceIp: remoteInfo?.address || null,
    sourcePort: remoteInfo?.port || null,
    listenerPort,
    payloadSizeBytes: message.length,
    packetHexPreview: buildPacketPreview(message),
    payloadJson: buildPersistedSummary(header, packetDetails),
    lapEvent
  });

  if (result.packetStored) {
    markTelemetryPacketStored();
  }

  if (result.lapStored) {
    markTelemetryLapStored();
  }
}

export function ensureTelemetryReceiverStarted() {
  const existingHandle = getListenerHandle();

  if (existingHandle) {
    return existingHandle;
  }

  const enabled = parseBooleanEnv(process.env.TELEMETRY_UDP_ENABLED);
  const host = process.env.TELEMETRY_UDP_HOST || DEFAULT_HOST;
  const ports = parsePortList();
  const persistPacketIds = parsePacketIdList(process.env.TELEMETRY_PERSIST_PACKET_IDS);

  markTelemetryConfigured({
    enabled,
    host,
    ports,
    persistPacketIds
  });

  if (!enabled || ports.length === 0) {
    return null;
  }

  const sockets = ports.map((port) => {
    const socket = dgram.createSocket("udp4");

    socket.on("listening", () => {
      markTelemetryStarted();
    });

    socket.on("error", (error) => {
      setListenerHandle(null);
      markTelemetryError(error);
      markTelemetryStopped(error.message);
    });

    socket.on("close", () => {
      if (getTelemetryRuntimeState().lastError) {
        markTelemetryStopped(getTelemetryRuntimeState().lastError);
        return;
      }

      markTelemetryStopped("Telemetry UDP socket closed.");
    });

    socket.on("message", (message, remoteInfo) => {
      void handleMessage(Buffer.from(message), remoteInfo, persistPacketIds, port).catch((error) => {
        markTelemetryError(error);
      });
    });

    socket.bind(port, host);

    return { socket, port };
  });

  const handle = { sockets, host, ports };
  setListenerHandle(handle);
  return handle;
}

export function getTelemetryListenerStatus() {
  return getTelemetryRuntimeState();
}

export function resetTelemetryReceiverState() {
  const cache = getSessionCache();
  cache.clear();
  markTelemetrySessionCacheSize(0);
  return resetTelemetryRuntimeMetrics();
}
