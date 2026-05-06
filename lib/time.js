export const MIN_LAP_TIME_MS = 30_000;
export const MAX_LAP_TIME_MS = 120_000;

export function parseLapTimeToMs(input) {
  if (!input || typeof input !== "string") {
    return null;
  }

  const value = input.trim().replace(",", ".");
  if (!value) {
    return null;
  }

  if (value.includes(":")) {
    const [minutesPart, secondsPart] = value.split(":");
    const minutes = Number(minutesPart);
    const seconds = Number(secondsPart);

    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return null;
    }

    return Math.round((minutes * 60 + seconds) * 1000);
  }

  const seconds = Number(value);
  if (Number.isNaN(seconds)) {
    return null;
  }

  return Math.round(seconds * 1000);
}

export function isLapTimeInAllowedRange(ms) {
  return Number.isFinite(ms) && ms >= MIN_LAP_TIME_MS && ms <= MAX_LAP_TIME_MS;
}

export function formatLapTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    return "--:--.---";
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatDateTime(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

export function getAmsterdamDateString(dateValue = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(dateValue);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}
