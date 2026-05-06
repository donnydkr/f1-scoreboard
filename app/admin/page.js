import { redirect } from "next/navigation";
import Link from "next/link";
import packageJson from "../../package.json";
import { AdminShell } from "@/components/AdminShell";
import { getAllLapTimes } from "@/db/queries/lap-times";
import { getTelemetryStats } from "@/db/queries/telemetry";
import { adminText } from "@/lib/admin-text";
import { canUseProtectedAdminArea } from "@/lib/auth";
import { ensureTelemetryReceiverStarted } from "@/lib/telemetry-receiver";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  ensureTelemetryReceiverStarted();

  let lapTimes = [];
  let telemetryStats = {
    totalPackets: 0,
    totalLapEvents: 0
  };

  try {
    lapTimes = await getAllLapTimes();
  } catch {
    lapTimes = [];
  }

  try {
    telemetryStats = await getTelemetryStats();
  } catch {
    telemetryStats = {
      totalPackets: 0,
      totalLapEvents: 0
    };
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
            <div className="admin-telemetry-summary-card">
              <div className="admin-telemetry-summary-grid">
                <article className="mini-item">
                  <div className="mini-item-row">
                    <strong>{stats.totalRecords}</strong>
                    <span className="subtle">{adminText.adminPage.recordsLabel}</span>
                  </div>
                </article>
                <article className="mini-item">
                  <div className="mini-item-row">
                    <strong>{stats.totalDrivers}</strong>
                    <span className="subtle">{adminText.adminPage.driversLabel}</span>
                  </div>
                </article>
              </div>
              <Link href="/admin/records" className="ghost-button">
                {adminText.adminPage.recordsOpenButton}
              </Link>
            </div>
          </div>
        </section>

        <section className="panel admin-panel">
          <div className="panel-header admin-panel-header">
            <h2>{adminText.adminPage.telemetryTitle}</h2>
            <p className="subtle">{adminText.adminPage.telemetryIntro}</p>
          </div>
          <div className="panel-body admin-panel-body">
            <div className="admin-telemetry-summary-card">
              <div className="admin-telemetry-summary-grid">
                <article className="mini-item">
                  <div className="mini-item-row">
                    <strong>{telemetryStats.totalPackets}</strong>
                    <span className="subtle">{adminText.adminPage.telemetryPacketsLabel}</span>
                  </div>
                </article>
                <article className="mini-item">
                  <div className="mini-item-row">
                    <strong>{telemetryStats.totalLapEvents}</strong>
                    <span className="subtle">{adminText.adminPage.telemetryLapsLabel}</span>
                  </div>
                </article>
              </div>
              <Link href="/admin/telemetry" className="ghost-button">
                {adminText.adminPage.telemetryOpenButton}
              </Link>
            </div>
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
