"use client";

import { useEffect, useMemo, useState } from "react";
import { DriverName } from "@/components/DriverName";
import { RainIndicator } from "@/components/RainIndicator";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import { getCircuitAsset, getCircuitFlagAsset } from "@/lib/circuit-assets";
import { publicText } from "@/lib/public-text";
import { formatLapTime } from "@/lib/time";

const ALL_TRACKS = publicText.scoreboard.allCircuits;

function sortByBestLap(entries) {
  return [...entries].sort((left, right) => {
    if (left.lap_time_ms !== right.lap_time_ms) {
      return left.lap_time_ms - right.lap_time_ms;
    }

    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  });
}

function sortByRecent(entries) {
  return [...entries].sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export function PublicTrackScoreboard({ entries, initialSelectedTrack = null }) {
  const tracks = useMemo(() => {
    const uniqueTracks = [...new Set(entries.map((entry) => entry.track_name).filter(Boolean))];
    return [ALL_TRACKS, ...uniqueTracks.sort((left, right) => left.localeCompare(right, "nl-NL"))];
  }, [entries]);

  const [selectedTrack, setSelectedTrack] = useState(() => {
    if (initialSelectedTrack && initialSelectedTrack !== ALL_TRACKS) {
      return initialSelectedTrack;
    }

    return ALL_TRACKS;
  });

  useEffect(() => {
    if (initialSelectedTrack && tracks.includes(initialSelectedTrack)) {
      setSelectedTrack(initialSelectedTrack);
    }
  }, [initialSelectedTrack, tracks]);

  useEffect(() => {
    if (selectedTrack !== ALL_TRACKS && !tracks.includes(selectedTrack)) {
      setSelectedTrack(ALL_TRACKS);
    }
  }, [selectedTrack, tracks]);

  const filteredEntries = useMemo(() => {
    if (selectedTrack === ALL_TRACKS) {
      return entries;
    }

    return entries.filter((entry) => entry.track_name === selectedTrack);
  }, [entries, selectedTrack]);

  const topLapTimes = useMemo(() => sortByBestLap(filteredEntries).slice(0, 10), [filteredEntries]);
  const recentLapTimes = useMemo(() => sortByRecent(filteredEntries).slice(0, 8), [filteredEntries]);
  const bestLap = topLapTimes[0];
  const bestWetLap = useMemo(
    () => sortByBestLap(filteredEntries.filter((entry) => entry.is_wet))[0],
    [filteredEntries]
  );
  const podiumLapTimes = topLapTimes.slice(0, 3);
  const selectedTrackImage = getCircuitAsset(selectedTrack);
  const selectedTrackFlag = getCircuitFlagAsset(selectedTrack);

  return (
    <>
      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">{publicText.scoreboard.selectedCircuitLabel}</p>
          <div className={selectedTrack !== ALL_TRACKS && selectedTrackImage ? "stat-circuit" : "stat-circuit stat-circuit-centered"}>
            {selectedTrack !== ALL_TRACKS && selectedTrackImage ? (
              <img
                className="stat-circuit-image"
                src={selectedTrackImage}
                alt=""
                aria-hidden="true"
              />
            ) : null}
            {selectedTrack !== ALL_TRACKS && selectedTrackFlag ? (
              <img className="stat-circuit-flag" src={selectedTrackFlag} alt="" aria-hidden="true" />
            ) : null}
            <p className="stat-value stat-value-small">{selectedTrack}</p>
          </div>
        </article>
        <article className="stat-card">
          <p className="stat-label">{publicText.scoreboard.fastestLapLabel}</p>
          <p className="stat-value">
            {bestLap ? (
              <span className="lap-value-content">
                <span>{formatLapTime(bestLap.lap_time_ms)}</span>
                <RainIndicator isWet={bestLap.is_wet} size="large" />
              </span>
            ) : (
              "--:--.---"
            )}
          </p>
        </article>
        <article className="stat-card">
          <p className="stat-label">{publicText.scoreboard.topThreeLabel}</p>
          {selectedTrack === ALL_TRACKS ? (
            <p className="stat-value">-</p>
          ) : podiumLapTimes.length === 0 ? (
            <p className="stat-value">-</p>
          ) : (
            <div className="podium-list">
              {podiumLapTimes.map((entry, index) => (
                <div key={entry.id} className="podium-item">
                  <span className="podium-rank">{index + 1}</span>
                  <span className="podium-lap">
                    <span className="lap-value-content">
                      <span>{formatLapTime(entry.lap_time_ms)}</span>
                      <RainIndicator isWet={entry.is_wet} size="large" />
                    </span>
                  </span>
                  <span className="podium-driver">
                    <DriverName name={entry.driver_name} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="stat-card">
          <p className="stat-label">{publicText.scoreboard.fastestDriverLabel}</p>
          <div className="stat-driver-stack">
            <p className="stat-value stat-value-small">
              {bestLap ? <DriverName name={bestLap.driver_name} /> : "-"}
            </p>
            <div className="stat-secondary-driver">
              <p className="stat-secondary-label">{publicText.scoreboard.fastestWetDriverLabel}</p>
              <p className="stat-secondary-value">
                {bestWetLap ? (
                  <span className="lap-value-content">
                    <DriverName name={bestWetLap.driver_name} />
                    <RainIndicator isWet={bestWetLap.is_wet} size="large" />
                  </span>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="track-filter-panel">
        <div className="track-filter-header">
          <h2>{publicText.scoreboard.circuitMenuTitle}</h2>
          <p className="subtle">{publicText.scoreboard.circuitMenuIntro}</p>
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
      </section>

      <div className="dashboard-grid">
        <ScoreboardTable
          entries={topLapTimes}
          title={selectedTrack === ALL_TRACKS ? publicText.scoreboard.topLapsTitle : `Top 10 - ${selectedTrack}`}
          emptyMessage={publicText.scoreboard.emptyTopLaps}
        />
        <ScoreboardTable
          entries={recentLapTimes}
          title={selectedTrack === ALL_TRACKS ? publicText.scoreboard.latestEntriesTitle : `${publicText.scoreboard.latestEntriesTitle} - ${selectedTrack}`}
          emptyMessage={publicText.scoreboard.emptyLatestEntries}
        />
      </div>
    </>
  );
}
