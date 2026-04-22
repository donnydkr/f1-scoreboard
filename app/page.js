import { AutoRefresh } from "@/components/AutoRefresh";
import { PublicTrackScoreboard } from "@/components/PublicTrackScoreboard";
import { getAppSetting } from "@/db/queries/app-settings";
import { getAllLapTimes } from "@/db/queries/lap-times";
import { SCOREBOARD_REFRESH_MS } from "@/lib/constants";
import { publicText } from "@/lib/public-text";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let activeCircuit = null;
  let lapTimes = [];

  try {
    [lapTimes, activeCircuit] = await Promise.all([
      getAllLapTimes(),
      getAppSetting("public_active_circuit")
    ]);
  } catch {
    activeCircuit = null;
    lapTimes = [];
  }

  return (
    <main className="site-shell">
      <AutoRefresh intervalMs={SCOREBOARD_REFRESH_MS} />

      <section className="hero">
        <p className="eyebrow">{publicText.page.eyebrow}</p>
        <h1>{publicText.page.title}</h1>
        <p className="hero-copy">
          {publicText.page.intro}
        </p>
      </section>

      <PublicTrackScoreboard entries={lapTimes} initialSelectedTrack={activeCircuit} />
    </main>
  );
}
