"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminText } from "@/lib/admin-text";
import { formatDateTime, formatLapTime } from "@/lib/time";

function formatJsonPreview(value) {
  if (!value) {
    return "-";
  }

  const serialized = JSON.stringify(value);

  if (!serialized) {
    return "-";
  }

  return serialized.length > 320 ? `${serialized.slice(0, 317)}...` : serialized;
}

function formatPacketCounts(packetCounts) {
  return Object.entries(packetCounts || {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8);
}

export function AdminTelemetryDashboard({
  runtimeState,
  stats,
  packets,
  lapEvents,
  databaseError
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const packetCountEntries = formatPacketCounts(runtimeState?.packetCounts);
  const listenerStatusClassName = runtimeState?.enabled
    ? runtimeState?.running
      ? "admin-telemetry-status admin-telemetry-status-active"
      : "admin-telemetry-status"
    : "admin-telemetry-status admin-telemetry-status-disabled";

  async function handleClearTelemetry() {
    const confirmed = window.confirm(adminText.telemetry.clearConfirm);

    if (!confirmed) {
      return;
    }

    setError("");
    setFeedback("");
    setIsClearing(true);

    try {
      const response = await fetch("/api/admin/telemetry/clear", {
        method: "DELETE"
      });

      const contentType = response.headers.get("content-type") || "";
      const raw = await response.text();
      const payload =
        raw && contentType.includes("application/json")
          ? (() => {
              try {
                return JSON.parse(raw);
              } catch {
                return null;
              }
            })()
          : null;

      if (!response.ok) {
        setError(payload?.error || adminText.telemetry.clearError);
        return;
      }

      setFeedback(payload?.message || adminText.telemetry.clearSuccess);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <div className="admin-telemetry-stack">
      <div className="admin-database-actions">
        <Link href="/admin" className="ghost-button">
          {adminText.telemetry.backToAdmin}
        </Link>
        <Link href="/invoerscherm" className="ghost-button">
          {adminText.database.openInputPage}
        </Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {feedback ? <p className="form-success">{feedback}</p> : null}

      <section className="stats-grid admin-stats-grid admin-telemetry-stats-grid">
        <article className="stat-card admin-stat-card">
          <p className="stat-label">{adminText.telemetry.listenerLabel}</p>
          <p className={`stat-value stat-value-small ${listenerStatusClassName}`}>
            {runtimeState?.enabled
              ? runtimeState?.running
                ? adminText.telemetry.listenerRunning
                : adminText.telemetry.listenerWaiting
              : adminText.telemetry.listenerDisabled}
          </p>
        </article>
        <article className="stat-card admin-stat-card">
          <p className="stat-label">{adminText.telemetry.bindLabel}</p>
          <p className="stat-value stat-value-small">
            {runtimeState?.host && Array.isArray(runtimeState?.ports) && runtimeState.ports.length > 0
              ? runtimeState.ports.map((port) => `${runtimeState.host}:${port}`).join(" / ")
              : "-"}
          </p>
        </article>
        <article className="stat-card admin-stat-card">
          <p className="stat-label">{adminText.telemetry.packetCountLabel}</p>
          <p className="stat-value">{stats?.totalPackets ?? 0}</p>
        </article>
        <article className="stat-card admin-stat-card">
          <p className="stat-label">{adminText.telemetry.lapCountLabel}</p>
          <p className="stat-value">{stats?.totalLapEvents ?? 0}</p>
        </article>
        <article className="stat-card admin-stat-card admin-telemetry-danger-card">
          <p className="stat-label">{adminText.telemetry.clearLabel}</p>
          <button
            type="button"
            className="danger-button admin-telemetry-clear-button"
            onClick={handleClearTelemetry}
            disabled={isClearing || isPending}
          >
            {isClearing || isPending ? adminText.telemetry.clearing : adminText.telemetry.clearButton}
          </button>
        </article>
      </section>

      <section className="admin-utility-grid">
        <article className="admin-import-card">
          <div className="admin-import-card-header">
            <h3>{adminText.telemetry.runtimeTitle}</h3>
            <p className="subtle">{adminText.telemetry.runtimeIntro}</p>
          </div>
          <div className="admin-telemetry-meta">
            <p>
              <strong>{adminText.telemetry.startedAtLabel}:</strong>{" "}
              {formatDateTime(runtimeState?.startedAt)}
            </p>
            <p>
              <strong>{adminText.telemetry.lastPacketLabel}:</strong>{" "}
              {formatDateTime(runtimeState?.lastPacketAt || stats?.latestPacketAt)}
            </p>
            <p>
              <strong>{adminText.telemetry.lastLapLabel}:</strong>{" "}
              {formatDateTime(runtimeState?.lastLapAt || stats?.latestLapAt)}
            </p>
            <p>
              <strong>{adminText.telemetry.persistedPacketIdsLabel}:</strong>{" "}
              {(runtimeState?.persistPacketIds || []).join(", ") || "-"}
            </p>
            <p>
              <strong>{adminText.telemetry.sessionCacheLabel}:</strong>{" "}
              {runtimeState?.sessionCacheSize ?? 0}
            </p>
            <p>
              <strong>{adminText.telemetry.processPacketsLabel}:</strong>{" "}
              {runtimeState?.totalPacketsSeen ?? 0}
            </p>
          </div>
          {runtimeState?.lastError ? <p className="form-error">{runtimeState.lastError}</p> : null}
          {databaseError ? <p className="form-error">{databaseError}</p> : null}
        </article>

        <article className="admin-notes-card">
          <div className="admin-import-card-header">
            <h3>{adminText.telemetry.packetMixTitle}</h3>
            <p className="subtle">{adminText.telemetry.packetMixIntro}</p>
          </div>
          {packetCountEntries.length === 0 ? (
            <p className="subtle admin-notes-body">{adminText.telemetry.noPacketMix}</p>
          ) : (
            <div className="mini-list">
              {packetCountEntries.map(([packetName, count]) => (
                <div key={packetName} className="mini-item">
                  <div className="mini-item-row">
                    <strong>{packetName}</strong>
                    <span className="subtle">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel admin-panel">
        <div className="panel-header admin-panel-header">
          <h2>{adminText.telemetry.lapsTitle}</h2>
          <p className="subtle">{adminText.telemetry.lapsIntro}</p>
        </div>
        <div className="panel-body admin-panel-body">
          {lapEvents.length === 0 ? (
            <p className="empty-state">{adminText.telemetry.emptyLaps}</p>
          ) : (
            <div className="admin-record-table-wrap">
              <table className="admin-record-table">
                <thead>
                  <tr>
                    <th>{adminText.telemetry.receivedAtLabel}</th>
                    <th>{adminText.telemetry.listenerPortLabel}</th>
                    <th>{adminText.telemetry.sourceIpLabel}</th>
                    <th>{adminText.telemetry.driverLabel}</th>
                    <th>{adminText.telemetry.trackLabel}</th>
                    <th>{adminText.telemetry.lapNumberLabel}</th>
                    <th>{adminText.telemetry.lapTimeLabel}</th>
                    <th>{adminText.telemetry.positionLabel}</th>
                    <th>{adminText.telemetry.sourceLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {lapEvents.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.received_at)}</td>
                      <td>{entry.listener_port ?? "-"}</td>
                      <td>{entry.source_ip ? `${entry.source_ip}:${entry.source_port}` : entry.session_uid || "-"}</td>
                      <td>{entry.driver_name || `${adminText.telemetry.playerFallback} ${entry.driver_index}`}</td>
                      <td>{entry.track_name || `#${entry.track_id ?? "?"}`}</td>
                      <td>{entry.completed_lap_number ?? "-"}</td>
                      <td>{entry.lap_time_display || formatLapTime(entry.lap_time_ms)}</td>
                      <td>{entry.car_position ?? "-"}</td>
                      <td>{entry.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="panel admin-panel">
        <div className="panel-header admin-panel-header">
          <h2>{adminText.telemetry.packetsTitle}</h2>
          <p className="subtle">{adminText.telemetry.packetsIntro}</p>
        </div>
        <div className="panel-body admin-panel-body">
          {packets.length === 0 ? (
            <p className="empty-state">{adminText.telemetry.emptyPackets}</p>
          ) : (
            <div className="admin-record-table-wrap">
              <table className="admin-record-table admin-telemetry-table">
                <thead>
                  <tr>
                    <th>{adminText.telemetry.receivedAtLabel}</th>
                    <th>{adminText.telemetry.packetLabel}</th>
                    <th>{adminText.telemetry.listenerPortLabel}</th>
                    <th>{adminText.telemetry.sourceIpLabel}</th>
                    <th>{adminText.telemetry.frameLabel}</th>
                    <th>{adminText.telemetry.payloadSizeLabel}</th>
                    <th>{adminText.telemetry.summaryLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {packets.map((packet) => (
                    <tr key={packet.id}>
                      <td>{formatDateTime(packet.received_at)}</td>
                      <td>
                        <div className="admin-telemetry-packet-name">
                          <strong>{packet.packet_name}</strong>
                          <span className="subtle">#{packet.packet_id}</span>
                        </div>
                      </td>
                      <td>{packet.listener_port ?? "-"}</td>
                      <td>{packet.source_ip ? `${packet.source_ip}:${packet.source_port}` : "-"}</td>
                      <td>{packet.frame_identifier ?? "-"}</td>
                      <td>{packet.payload_size_bytes}</td>
                      <td className="admin-telemetry-json-cell">
                        <code>{formatJsonPreview(packet.payload_json?.details || packet.payload_json)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
