import { NextResponse } from "next/server";
import { importLapTimes } from "@/db/queries/lap-times";
import { isPasswordChangeRequired, isValidAdminSessionToken } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";
import { adminText } from "@/lib/admin-text";

const IMPORT_HEADERS = [
  "id",
  "driver_name",
  "track_name",
  "car_name",
  "lap_time_display",
  "lap_time_ms",
  "setup",
  "seat",
  "is_wet",
  "session_date",
  "notes",
  "created_at"
];

class CsvImportError extends Error {}

function parseCsv(text, separator = ",") {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let currentValue = "";
  let currentRow = [];
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === separator && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if (char === "\n" && !inQuotes) {
      currentRow.push(currentValue);
      if (currentRow.some((value) => value.trim() !== "")) {
        rows.push(currentRow);
      }
      currentValue = "";
      currentRow = [];
      continue;
    }

    currentValue += char;
  }

  if (inQuotes) {
    throw new CsvImportError(adminText.import.invalidFile);
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some((value) => value.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) {
    throw new CsvImportError(adminText.import.invalidFile);
  }

  const headers = rows[0].map((value) => value.trim());

  if (
    headers.length !== IMPORT_HEADERS.length ||
    headers.some((header, index) => header !== IMPORT_HEADERS[index])
  ) {
    throw new CsvImportError(adminText.import.invalidHeaders);
  }

  return rows.slice(1).map((values) => {
    const row = {};

    IMPORT_HEADERS.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function normalizeBoolean(value) {
  return String(value).trim().toLowerCase() === "true";
}

function normalizeOptionalText(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeRequiredText(value) {
  return String(value ?? "").trim();
}

function normalizeImportRows(rows) {
  return rows.map((row, index) => {
    const id = Number(row.id);
    const lapTimeMs = Number(row.lap_time_ms);
    const sessionDate = normalizeRequiredText(row.session_date);
    const createdAt = normalizeRequiredText(row.created_at);
    const driverName = normalizeRequiredText(row.driver_name);
    const trackName = normalizeRequiredText(row.track_name);
    const carName = normalizeRequiredText(row.car_name);
    const lapTimeDisplay = normalizeRequiredText(row.lap_time_display);
    const setup = normalizeRequiredText(row.setup) || "Balanced";
    const seat = normalizeRequiredText(row.seat) || "Stoel 1";

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !driverName ||
      !trackName ||
      !carName ||
      !lapTimeDisplay ||
      !Number.isFinite(lapTimeMs) ||
      lapTimeMs <= 0 ||
      !sessionDate ||
      Number.isNaN(new Date(sessionDate).getTime()) ||
      !createdAt ||
      Number.isNaN(new Date(createdAt).getTime())
    ) {
      throw new CsvImportError(adminText.import.invalidRow.replace("{row}", String(index + 2)));
    }

    return {
      id,
      driver_name: driverName,
      track_name: trackName,
      car_name: carName,
      lap_time_display: lapTimeDisplay,
      lap_time_ms: lapTimeMs,
      setup,
      seat,
      is_wet: normalizeBoolean(row.is_wet),
      session_date: sessionDate,
      notes: normalizeOptionalText(row.notes),
      created_at: createdAt
    };
  });
}

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";

    if (!isValidAdminSessionToken(sessionToken)) {
      return NextResponse.json({ error: adminText.auth.notAuthenticated }, { status: 401 });
    }

    if (await isPasswordChangeRequired()) {
      return NextResponse.json({ error: adminText.auth.passwordChangeRequired }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const replaceExisting = String(formData.get("replaceExisting") || "") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: adminText.import.fileRequired }, { status: 400 });
    }

    const csvText = await file.text();
    const parsedRows = parseCsv(csvText);
    const normalizedRows = normalizeImportRows(parsedRows);
    const result = await importLapTimes(normalizedRows, { replaceExisting });

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      driverCount: result.driverCount,
      replacedExisting: result.replacedExisting,
      message: adminText.import.success
        .replace("{count}", String(result.importedCount))
        .replace("{drivers}", String(result.driverCount))
    });
  } catch (error) {
    console.error("Failed to import lap times", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : adminText.import.serverError },
      { status: error instanceof CsvImportError ? 400 : 500 }
    );
  }
}
