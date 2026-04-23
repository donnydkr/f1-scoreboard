"use client";

import { useMemo, useState } from "react";
import { RecentLapTimesList } from "@/components/RecentLapTimesList";
import { adminText } from "@/lib/admin-text";
import { getCircuitAsset, getCircuitFlagAsset } from "@/lib/circuit-assets";
import { formatLapTime } from "@/lib/time";

const ALL_TRACKS = adminText.trackList.allCircuits;

function sortByBestLap(entries) {
  return [...entries].sort((left, right) => {
    if (left.lap_time_ms !== right.lap_time_ms) {
      return left.lap_time_ms - right.lap_time_ms;
    }

    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  });
}

export function AdminTrackRecentList({ entries }) {
  const tracks = useMemo(() => {
    const uniqueTracks = [...new Set(entries.map((entry) => entry.track_name).filter(Boolean))];
    return [ALL_TRACKS, ...uniqueTracks.sort((left, right) => left.localeCompare(right, "nl-NL"))];
  }, [entries]);

  const [selectedTrack, setSelectedTrack] = useState(ALL_TRACKS);

  const filteredEntries = useMemo(() => {
    if (selectedTrack === ALL_TRACKS) {
      return entries;
    }

    return entries.filter((entry) => entry.track_name === selectedTrack);
  }, [entries, selectedTrack]);

  const topEntries = useMemo(() => sortByBestLap(filteredEntries).slice(0, 5), [filteredEntries]);
  const bestLap = topEntries[0];

  return (
    <div className="admin-track-stack">
      <div className="admin-track-summary">
        <article className="stat-card">
          <p className="stat-label">{adminText.trackList.filterLabel}</p>
          <p className="stat-value stat-value-small">{selectedTrack}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">{adminText.trackList.fastestLapLabel}</p>
          <p className="stat-value">{bestLap ? formatLapTime(bestLap.lap_time_ms) : "--:--.---"}</p>
        </article>
      </div>

      <div className="track-chip-list">
        {tracks.map((track) => {
          const imageSrc = getCircuitAsset(track);
          const flagSrc = getCircuitFlagAsset(track);
          const hasVisuals = Boolean(imageSrc || flagSrc);

          return (
            <button
              key={track}
              className={
                track === selectedTrack
                  ? hasVisuals
                    ? "track-chip is-active"
                    : "track-chip track-chip-text-only is-active"
                  : hasVisuals
                    ? "track-chip"
                    : "track-chip track-chip-text-only"
              }
              type="button"
              onClick={() => setSelectedTrack(track)}
            >
              {imageSrc ? (
                <img className="track-chip-image" src={imageSrc} alt="" aria-hidden="true" />
              ) : null}
              {flagSrc ? (
                <img className="track-chip-flag" src={flagSrc} alt="" aria-hidden="true" />
              ) : null}
              <span className="track-chip-label">{track}</span>
            </button>
          );
        })}
      </div>

      <RecentLapTimesList entries={topEntries} emptyMessage={adminText.trackList.emptyMessage} />
    </div>
  );
}
