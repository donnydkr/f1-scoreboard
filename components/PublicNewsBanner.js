import { DriverName } from "@/components/DriverName";
import { getCircuitFlagAsset } from "@/lib/circuit-assets";
import { formatLapTime } from "@/lib/time";

function getRecentEntries(entries, limit = 10) {
  const recentEntries = [];

  for (const entry of entries) {
    if (!entry?.driver_name || entry?.lap_time_ms == null) {
      continue;
    }

    recentEntries.push(entry);

    if (recentEntries.length >= limit) {
      break;
    }
  }

  return recentEntries;
}

function NewsItem({ entry }) {
  const circuitFlag = getCircuitFlagAsset(entry.track_name);

  return (
    <span className="public-news-item">
      <span className="public-news-item-driver">
        <DriverName name={entry.driver_name} />
      </span>
      <span className="public-news-item-separator">•</span>
      <span className="public-news-item-time">{formatLapTime(entry.lap_time_ms)}</span>
      {entry.track_name ? (
        <>
          <span className="public-news-item-separator">•</span>
          <span className="public-news-item-track-group">
            {circuitFlag ? (
              <img className="public-news-item-flag" src={circuitFlag} alt="" aria-hidden="true" />
            ) : null}
            <span className="public-news-item-track">{entry.track_name}</span>
          </span>
        </>
      ) : null}
    </span>
  );
}

export function PublicNewsBanner({ entries }) {
  const recentEntries = getRecentEntries(entries, 10);

  if (recentEntries.length === 0) {
    return (
      <div className="public-news-banner" role="region" aria-label="Nieuwsbanner">
        <div className="public-news-banner-track public-news-banner-track-empty">
          <span className="public-news-item">Nog geen recente tijden ingevoerd.</span>
        </div>
      </div>
    );
  }

  const marqueeEntries = [...recentEntries, ...recentEntries];

  return (
    <div className="public-news-banner" role="region" aria-label="Nieuwsbanner met recente tijden">
      <div className="public-news-banner-track">
        {marqueeEntries.map((entry, index) => (
          <NewsItem key={`${entry.id}-${index}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}
