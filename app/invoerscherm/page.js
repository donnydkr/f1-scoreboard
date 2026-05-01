import { AdminShell } from "@/components/AdminShell";
import { AdminTrackRecentList } from "@/components/AdminTrackRecentList";
import { LapTimeForm } from "@/components/LapTimeForm";
import { adminText } from "@/lib/admin-text";
import { getDrivers } from "@/db/queries/drivers";
import { getAllLapTimes } from "@/db/queries/lap-times";

export const dynamic = "force-dynamic";

export default async function InvoerschermPage() {
  let drivers = [];
  let recentLapTimes = [];

  try {
    [drivers, recentLapTimes] = await Promise.all([
      getDrivers(),
      getAllLapTimes()
    ]);
  } catch {
    drivers = [];
    recentLapTimes = [];
  }

  return (
    <AdminShell>
      <div className="admin-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>{adminText.page.newLapTitle}</h2>
            {adminText.page.newLapIntro ? (
              <p className="subtle">{adminText.page.newLapIntro}</p>
            ) : null}
          </div>
          <div className="panel-body">
            <LapTimeForm initialDrivers={drivers} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>{adminText.page.recentTimesTitle}</h2>
          </div>
          <div className="panel-body mini-list">
            <AdminTrackRecentList entries={recentLapTimes} />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
