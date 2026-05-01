import { getLapTimesForExport } from "@/db/queries/lap-times";
import { isPasswordChangeRequired, isValidAdminSessionToken } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const EXPORT_HEADERS = [
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

function formatCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function escapeCsvValue(value) {
  return `"${formatCsvValue(value).replace(/"/g, '""')}"`;
}

function buildCsv(rows) {
  const csvRows = rows.map((row) =>
    EXPORT_HEADERS.map((header) => escapeCsvValue(row[header])).join(",")
  );

  return `\uFEFF${[EXPORT_HEADERS.join(","), ...csvRows].join("\n")}`;
}

export async function GET(request) {
  try {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";

    if (!isValidAdminSessionToken(sessionToken)) {
      return new Response("Niet ingelogd.", { status: 401 });
    }

    if (await isPasswordChangeRequired()) {
      return new Response("Wijzig eerst het standaard wachtwoord.", { status: 403 });
    }

    const rows = await getLapTimesForExport();
    const csv = buildCsv(rows);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="f1-scoreboard-export-${date}.csv"`,
        "Content-Type": "text/csv; charset=utf-8"
      }
    });
  } catch (error) {
    console.error("Failed to export lap times", error);

    return new Response("Fout bij genereren export", { status: 500 });
  }
}
