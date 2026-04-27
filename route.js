import { hasValidAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  if (!await hasValidAdminSession()) {
    return new Response("Niet geautoriseerd", { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.query("SELECT * FROM lap_times ORDER BY created_at DESC");
    const rows = result.rows;

    if (!rows || rows.length === 0) {
      return new Response("Geen data gevonden", { status: 200 });
    }

    // Haal headers op uit de eerste rij
    const headers = Object.keys(rows[0]);
    
    // Bouw CSV regels op basis van headers (veilig voor kolomvolgorde)
    const csvRows = rows.map(row => 
      headers.map(header => {
        const val = row[header];
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(",")
    );

    // Voeg UTF-8 BOM toe (\uFEFF) zodat Excel speciale tekens en kolommen direct snapt
    const BOM = "\uFEFF";
    const csv = BOM + [headers.join(","), ...csvRows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=UTF-8",
        "Content-Disposition": `attachment; filename="f1_scoreboard_export_${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response("Fout bij genereren export", { status: 500 });
  }
}