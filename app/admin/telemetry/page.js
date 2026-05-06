import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { AdminTelemetryDashboard } from "@/components/AdminTelemetryDashboard";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  getRecentTelemetryLapEvents,
  getRecentTelemetryPackets,
  getTelemetryStats
} from "@/db/queries/telemetry";
import { canUseProtectedAdminArea } from "@/lib/auth";
import { ensureTelemetryReceiverStarted, getTelemetryListenerStatus } from "@/lib/telemetry-receiver";
import { adminText } from "@/lib/admin-text";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminTelemetryPage() {
  const authState = await canUseProtectedAdminArea();

  if (!authState.isLoggedIn) {
    redirect("/admin/login");
  }

  if (authState.mustChangePassword) {
    redirect("/admin/password");
  }

  ensureTelemetryReceiverStarted();

  let stats = {
    totalPackets: 0,
    latestPacketAt: null,
    totalLapEvents: 0,
    latestLapAt: null
  };
  let packets = [];
  let lapEvents = [];
  let databaseError = "";

  try {
    [stats, packets, lapEvents] = await Promise.all([
      getTelemetryStats(),
      getRecentTelemetryPackets(),
      getRecentTelemetryLapEvents()
    ]);
  } catch {
    databaseError = adminText.telemetry.databaseError;
  }

  return (
    <AdminShell
      eyebrow={adminText.telemetry.eyebrow}
      title={adminText.telemetry.title}
      intro={adminText.telemetry.intro}
      variant="admin"
    >
      <AutoRefresh intervalMs={5000} />
      <AdminTelemetryDashboard
        runtimeState={getTelemetryListenerStatus()}
        stats={stats}
        packets={packets}
        lapEvents={lapEvents}
        databaseError={databaseError}
      />
    </AdminShell>
  );
}
