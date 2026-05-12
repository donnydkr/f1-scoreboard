"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { AdminGearLink } from "@/components/AdminGearLink";
import { CircuitRecordCelebration } from "@/components/CircuitRecordCelebration";
import { DriverName } from "@/components/DriverName";
import { RainIndicator } from "@/components/RainIndicator";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import { SetupIndicator } from "@/components/SetupIndicator";
import { getCircuitAsset, getCircuitFlagAsset } from "@/lib/circuit-assets";
import { adminText } from "@/lib/admin-text";
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

function getBestLapByTrack(entries) {
  const bestByTrack = new Map();

  for (const entry of entries) {
    if (!entry.track_name) {
      continue;
    }

    const currentBest = bestByTrack.get(entry.track_name);
    const entryCreatedAt = new Date(entry.created_at).getTime();
    const currentCreatedAt = currentBest ? new Date(currentBest.created_at).getTime() : null;

    if (
      !currentBest ||
      entry.lap_time_ms < currentBest.lap_time_ms ||
      (entry.lap_time_ms === currentBest.lap_time_ms && entryCreatedAt < currentCreatedAt)
    ) {
      bestByTrack.set(entry.track_name, entry);
    }
  }

  return bestByTrack;
}

function SeatWheelIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8.5v7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 9.5l1.8 2.5L9.5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 9.5l-1.8 2.5L14.5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrackStatsBlock({ trackName, entries, selectedTrack = null }) {
  const filteredEntries = entries.filter((entry) => entry.track_name === trackName);
  const topLapTimes = sortByBestLap(filteredEntries).slice(0, 10);
  const bestLap = topLapTimes[0];
  const podiumLapTimes = topLapTimes.slice(0, 5);
  const selectedTrackImage = getCircuitAsset(trackName);
  const selectedTrackFlag = getCircuitFlagAsset(trackName);

  return (
    <section className="track-dashboard-section">
      <div className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">{publicText.scoreboard.selectedCircuitLabel}</p>
          <div className={selectedTrackImage ? "stat-circuit" : "stat-circuit stat-circuit-centered"}>
            {selectedTrackImage ? (
              <img
                className="stat-circuit-image"
                src={selectedTrackImage}
                alt=""
                aria-hidden="true"
              />
            ) : null}
            <div className="stat-circuit-meta">
              {selectedTrackFlag ? (
                <img className="stat-circuit-flag" src={selectedTrackFlag} alt="" aria-hidden="true" />
              ) : null}
              <p className="stat-value stat-value-small">{trackName}</p>
            </div>
          </div>
        </article>
        <article className="stat-card">
          <p className="stat-label">{publicText.scoreboard.fastestLapLabel}</p>
          <div className="stat-driver-stack">
            <p className="stat-value">
              {bestLap ? (
                <span className="fastest-lap-value">
                  <span className="lap-value-content">
                    <span>{formatLapTime(bestLap.lap_time_ms)}</span>
                    <RainIndicator isWet={bestLap.is_wet} size="large" />
                  </span>
                  <span className="fastest-lap-driver">
                    <DriverName name={bestLap.driver_name} />
                  </span>
                </span>
              ) : (
                "--:--.---"
              )}
            </p>
            {bestLap?.setup && (
              <div className="setup-display">
                <SetupIndicator setup={bestLap.setup} size="large" />
                <p className="stat-secondary-label">{bestLap.setup}</p>
              </div>
            )}
            {bestLap?.seat && (
              <div className="seat-display">
                <span className="seat-display-icon" aria-hidden="true">
                  <SeatWheelIcon />
                </span>
                <p className="stat-secondary-label">{bestLap.seat}</p>
              </div>
            )}
          </div>
        </article>
        <article className="stat-card">
          <p className="stat-label">{publicText.scoreboard.topThreeLabel}</p>
          {podiumLapTimes.length === 0 ? (
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
                  {entry.seat ? <span className="podium-seat">{entry.seat}</span> : <span className="podium-seat">-</span>}
                  <span className="podium-setup">
                    {entry.setup ? <SetupIndicator setup={entry.setup} /> : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
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

  const lastHandledTrackRef = useRef(initialSelectedTrack);
  const seenBestByTrackRef = useRef(new Map());
  const hasInitializedBestRef = useRef(false);
  const celebrationTimerRef = useRef(null);
  const [celebrationRecord, setCelebrationRecord] = useState(null);

  useEffect(() => {
    // Schakel alleen automatisch als het actieve circuit op de server echt is veranderd
    // ten opzichte van de vorige keer dat we dit verwerkt hebben (bijv. door een nieuwe save).
    if (initialSelectedTrack !== lastHandledTrackRef.current) {
      if (initialSelectedTrack && tracks.includes(initialSelectedTrack)) {
        setSelectedTrack(initialSelectedTrack);
      }
      lastHandledTrackRef.current = initialSelectedTrack;
    }
  }, [initialSelectedTrack, tracks]);

  useEffect(() => {
    const currentBestByTrack = getBestLapByTrack(entries);
    const seenBestByTrack = seenBestByTrackRef.current;

    if (!hasInitializedBestRef.current) {
      currentBestByTrack.forEach((entry, trackName) => {
        seenBestByTrack.set(trackName, {
          id: entry.id,
          lapTimeMs: entry.lap_time_ms,
          trackName: entry.track_name
        });
      });
      hasInitializedBestRef.current = true;
      return;
    }

    let newestRecord = null;

    currentBestByTrack.forEach((entry, trackName) => {
      const previousBest = seenBestByTrack.get(trackName);

      if (!previousBest || entry.lap_time_ms < previousBest.lapTimeMs) {
        newestRecord = {
          trackName: entry.track_name,
          driverName: entry.driver_name,
          lapTimeMs: entry.lap_time_ms,
          isWet: entry.is_wet
        };
      }

      seenBestByTrack.set(trackName, {
        id: entry.id,
        lapTimeMs: entry.lap_time_ms,
        trackName: entry.track_name
      });
    });

    if (newestRecord) {
      setCelebrationRecord(newestRecord);
    }
  }, [entries]);

  useEffect(() => {
    if (!celebrationRecord) {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
      return undefined;
    }

    if (celebrationTimerRef.current) {
      window.clearTimeout(celebrationTimerRef.current);
    }

    celebrationTimerRef.current = window.setTimeout(() => {
      setCelebrationRecord(null);
      celebrationTimerRef.current = null;
    }, 7000);

    return () => {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, [celebrationRecord]);

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
  const visibleTracks = useMemo(
    () => tracks.filter((track) => track !== ALL_TRACKS),
    [tracks]
  );

  return (
    <>
      <header className="hero">
        <img className="hero-logo" src="/F1_logo.png" alt="F1 logo" />
        <div className="public-nav-actions">
          <div className="nav-action-group">
            <Link href="/invoerscherm" className="ghost-button">
              {adminText.page.openAdminPage}
            </Link>
          </div>
          <AdminGearLink />
        </div>
        <p className="eyebrow">{publicText.page.eyebrow}</p>
        <h1>{publicText.page.title}</h1>
        {publicText.page.intro && (
          <p className="hero-copy">{publicText.page.intro}</p>
        )}
      </header>

      {selectedTrack === ALL_TRACKS ? (
        <div className="track-dashboard-stack">
          {visibleTracks.map((track) => (
            <TrackStatsBlock key={track} trackName={track} entries={entries} selectedTrack={selectedTrack} />
          ))}
        </div>
      ) : (
        <TrackStatsBlock trackName={selectedTrack} entries={entries} selectedTrack={selectedTrack} />
      )}

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

      <ScoreboardTable
        entries={topLapTimes}
        title={selectedTrack === ALL_TRACKS ? publicText.scoreboard.topLapsTitle : `Top 10 - ${selectedTrack}`}
        emptyMessage={publicText.scoreboard.emptyTopLaps}
        showSetupIcon
      />

      <CircuitRecordCelebration
        open={Boolean(celebrationRecord)}
        record={celebrationRecord}
        title={
          celebrationRecord
            ? `Nieuwe snelste tijd op ${celebrationRecord.trackName}!`
            : "Nieuwe snelste tijd op het circuit!"
        }
        onClose={() => setCelebrationRecord(null)}
      />
    </>
  );
}
