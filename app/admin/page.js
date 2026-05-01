import { redirect } from "next/navigation";
import packageJson from "../../package.json";
import { AdminDatabaseManager } from "@/components/AdminDatabaseManager";
import { AdminShell } from "@/components/AdminShell";
import { getAllLapTimes } from "@/db/queries/lap-times";
import { adminText } from "@/lib/admin-text";
import { canUseProtectedAdminArea } from "@/lib/auth";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";

function buildAdminStats(entries) {
  const drivers = new Set(entries.map((entry) => entry.driver_name).filter(Boolean));
  const tracks = new Set(entries.map((entry) => entry.track_name).filter(Boolean));
  const latestEntry = entries[0] || null;

  return {
    totalRecords: entries.length,
    totalDrivers: drivers.size,
    totalTracks: tracks.size,
    latestEntry
  };
}

export default async function AdminPage() {
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

  const stats = buildAdminStats(lapTimes);

  return (
    <AdminShell
      eyebrow={adminText.shell.eyebrow}
      title={adminText.shell.title}
      intro={adminText.shell.intro}
      variant="admin"
    >
      <div className="admin-page-stack">
        <section className="stats-grid admin-stats-grid">
          <article className="stat-card admin-stat-card">
            <p className="stat-label">{adminText.adminPage.totalRecordsLabel}</p>
            <p className="stat-value">{stats.totalRecords}</p>
          </article>
          <article className="stat-card admin-stat-card">
            <p className="stat-label">{adminText.adminPage.totalDriversLabel}</p>
            <p className="stat-value">{stats.totalDrivers}</p>
          </article>
          <article className="stat-card admin-stat-card">
            <p className="stat-label">{adminText.adminPage.totalTracksLabel}</p>
            <p className="stat-value">{stats.totalTracks}</p>
          </article>
          <article className="stat-card admin-stat-card">
            <p className="stat-label">{adminText.adminPage.lastUpdateLabel}</p>
            <p className="stat-value stat-value-small">
              {stats.latestEntry ? formatDate(stats.latestEntry.created_at) : "-"}
            </p>
          </article>
        </section>

        <section className="panel admin-panel">
          <div className="panel-header admin-panel-header">
            <h2>{adminText.adminPage.databaseTitle}</h2>
            <p className="subtle">{adminText.adminPage.databaseIntro}</p>
          </div>
          <div className="panel-body admin-panel-body">
            <AdminDatabaseManager entries={lapTimes} />
          </div>
        </section>

        <footer className="admin-page-footer">
          <p>{adminText.adminPage.footerCopyright}</p>
          <p>{adminText.adminPage.footerVersion.replace("{version}", packageJson.version)}</p>
        </footer>
      </div>
    </AdminShell>
  );
}
