import { adminText } from "@/lib/admin-text";
import { getCircuitAsset, getCircuitFlagAsset } from "@/lib/circuit-assets";
import { getFeaturedRace } from "@/lib/f1-calendar";

export function AdminUpcomingRaceCard() {
  const race = getFeaturedRace();

  if (!race) {
    return null;
  }

  const circuitImage = getCircuitAsset(race.circuitName);
  const circuitFlag = getCircuitFlagAsset(race.circuitName);

  return (
    <section className="panel admin-race-panel">
      <div className="panel-header admin-panel-header">
        <h2>{adminText.page.upcomingRaceTitle}</h2>
      </div>

      <div className="panel-body admin-race-body">
        <div className="admin-race-hero">
          <div className="admin-race-visual" aria-hidden="true">
            {circuitImage ? (
              <img className="admin-race-track" src={circuitImage} alt="" aria-hidden="true" />
            ) : circuitFlag ? (
              <img className="admin-race-flag" src={circuitFlag} alt="" aria-hidden="true" />
            ) : (
              <span className="admin-race-visual-fallback">{race.round}</span>
            )}
          </div>

          <div className="admin-race-copy">
            <p className="admin-race-label">
              {race.isThisWeek
                ? adminText.page.upcomingRaceThisWeekLabel
                : adminText.page.upcomingRaceNextLabel}
            </p>
            <h3 className="admin-race-title">{race.circuitName}</h3>
            <p className="admin-race-subtitle">
              {adminText.page.upcomingRaceRoundLabel.replace("{round}", String(race.round))}
              {" · "}
              {adminText.page.upcomingRaceYearLabel.replace("{year}", race.year)}
            </p>
          </div>
        </div>

        <div className="admin-race-details">
          <p className="admin-race-date">{race.dateLabel}</p>
          <p className="admin-race-note">
            {race.isThisWeek
              ? adminText.page.upcomingRaceNoteThisWeek
              : adminText.page.upcomingRaceNoteNext}
          </p>
        </div>
      </div>
    </section>
  );
}
