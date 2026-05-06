import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminDatabaseManager } from "@/components/AdminDatabaseManager";
import { AdminShell } from "@/components/AdminShell";
import { getAllLapTimes } from "@/db/queries/lap-times";
import { adminText } from "@/lib/admin-text";
import { canUseProtectedAdminArea } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminRecordsPage() {
  const authState = await canUseProtectedAdminArea();

  if (!authState.isLoggedIn) {
    redirect("/admin/login");
  }

  if (authState.mustChangePassword) {
    redirect("/admin/password");
  }

  let lapTimes = [];

  try {
    lapTimes = await getAllLapTimes();
  } catch {
    lapTimes = [];
  }

  return (
    <AdminShell
      eyebrow={adminText.records.eyebrow}
      title={adminText.records.title}
      intro={adminText.records.intro}
      variant="admin"
    >
      <div className="admin-page-stack">
        <div className="admin-database-actions">
          <Link href="/admin" className="ghost-button">
            {adminText.telemetry.backToAdmin}
          </Link>
          <Link href="/invoerscherm" className="ghost-button">
            {adminText.database.openInputPage}
          </Link>
        </div>

        <section className="panel admin-panel">
          <div className="panel-header admin-panel-header">
            <h2>{adminText.records.panelTitle}</h2>
            <p className="subtle">{adminText.records.panelIntro}</p>
          </div>
          <div className="panel-body admin-panel-body">
            <AdminDatabaseManager entries={lapTimes} />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
