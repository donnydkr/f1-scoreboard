function createInitialState() {
  return {
    enabled: false,
    running: false,
    startedAt: null,
    host: null,
    ports: [],
    persistPacketIds: [],
    totalPacketsSeen: 0,
    totalPacketsStored: 0,
    totalLapEventsStored: 0,
    lastPacketAt: null,
    lastLapAt: null,
    lastError: null,
    packetCounts: {},
    sessionCacheSize: 0
  };
}

function getStateContainer() {
  if (!globalThis.__f1TelemetryRuntimeState) {
    globalThis.__f1TelemetryRuntimeState = createInitialState();
  }

  return globalThis.__f1TelemetryRuntimeState;
}

export function getTelemetryRuntimeState() {
  return { ...getStateContainer() };
}

export function resetTelemetryRuntimeState() {
  globalThis.__f1TelemetryRuntimeState = createInitialState();
  return getTelemetryRuntimeState();
}

export function resetTelemetryRuntimeMetrics() {
  const state = getStateContainer();
  state.totalPacketsSeen = 0;
  state.totalPacketsStored = 0;
  state.totalLapEventsStored = 0;
  state.lastPacketAt = null;
  state.lastLapAt = null;
  state.lastError = null;
  state.packetCounts = {};
  state.sessionCacheSize = 0;

  return getTelemetryRuntimeState();
}

export function markTelemetryConfigured(config) {
  const state = getStateContainer();
  Object.assign(state, {
    enabled: Boolean(config?.enabled),
    host: config?.host || null,
    ports: Array.isArray(config?.ports) ? [...config.ports] : [],
    persistPacketIds: Array.isArray(config?.persistPacketIds) ? [...config.persistPacketIds] : []
  });
}

export function markTelemetryStarted() {
  const state = getStateContainer();
  state.running = true;
  state.startedAt = state.startedAt || new Date().toISOString();
  state.lastError = null;
}

export function markTelemetryStopped(errorMessage = null) {
  const state = getStateContainer();
  state.running = false;
  state.lastError = errorMessage;
}

export function markTelemetryPacketSeen(packetName) {
  const state = getStateContainer();
  state.totalPacketsSeen += 1;
  state.lastPacketAt = new Date().toISOString();
  state.packetCounts[packetName] = (state.packetCounts[packetName] || 0) + 1;
}

export function markTelemetryPacketStored() {
  const state = getStateContainer();
  state.totalPacketsStored += 1;
}

export function markTelemetryLapStored() {
  const state = getStateContainer();
  state.totalLapEventsStored += 1;
  state.lastLapAt = new Date().toISOString();
}

export function markTelemetrySessionCacheSize(size) {
  const state = getStateContainer();
  state.sessionCacheSize = size;
}

export function markTelemetryError(error) {
  const state = getStateContainer();
  state.lastError = error instanceof Error ? error.message : String(error || "Unknown telemetry error");
}
