"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminCsvImportForm } from "@/components/AdminCsvImportForm";
import { DriverName } from "@/components/DriverName";
import { RainIndicator } from "@/components/RainIndicator";
import { adminText } from "@/lib/admin-text";
import { formatDate, formatLapTime } from "@/lib/time";

async function readJsonSafely(response) {
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!raw || !contentType.includes("application/json")) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AdminDatabaseManager({ entries }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const tracks = useMemo(() => {
    return [...new Set(entries.map((entry) => entry.track_name).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, "nl-NL"));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesTrack = trackFilter === "all" || entry.track_name === trackFilter;
      const matchesQuery =
        !query ||
        entry.driver_name?.toLowerCase().includes(query) ||
        entry.track_name?.toLowerCase().includes(query) ||
        entry.seat?.toLowerCase().includes(query) ||
        entry.setup?.toLowerCase().includes(query);

      return matchesTrack && matchesQuery;
    });
  }, [deferredSearch, entries, trackFilter]);

  async function handleDelete(id) {
    const confirmed = window.confirm(adminText.database.confirmDelete);
    if (!confirmed) {
      return;
    }

    setError("");
    setFeedback("");
    setPendingId(id);

    const response = await fetch(`/api/lap-times/${id}`, {
      method: "DELETE"
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setPendingId(null);
      setError(payload?.error || adminText.database.deleteError);
      return;
    }

    setFeedback(adminText.database.deleteSuccess);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleRenameDriver(entry) {
    const nextName = window.prompt(adminText.database.renameDriverPrompt, entry.driver_name || "")?.trim() || "";

    if (!nextName) {
      return;
    }

    if (nextName === entry.driver_name) {
      setFeedback(adminText.api.driverRenameNoChange);
      return;
    }

    setError("");
    setFeedback("");
    setPendingId(entry.driver_name);

    const response = await fetch("/api/drivers", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentName: entry.driver_name,
        newName: nextName
      })
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setPendingId(null);
      setError(payload?.error || adminText.api.driverRenameServerError);
      return;
    }

    setPendingId(null);
    setFeedback(
      payload?.renamed
        ? payload?.updatedLapTimeCount > 0
          ? `${adminText.api.driverRenamed} ${payload.updatedLapTimeCount} tijden bijgewerkt.`
          : adminText.api.driverRenamed
        : adminText.api.driverRenameNoChange
    );

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="admin-database-panel">
      <div className="admin-database-toolbar">
        <label className="field">
          <span>{adminText.database.searchLabel}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={adminText.database.searchPlaceholder}
          />
        </label>

        <label className="field">
          <span>{adminText.database.trackFilterLabel}</span>
          <select value={trackFilter} onChange={(event) => setTrackFilter(event.target.value)}>
            <option value="all">{adminText.database.allTracks}</option>
            {tracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-database-actions">
        <Link href="/invoerscherm" className="ghost-button">
          {adminText.database.openInputPage}
        </Link>
        <a href="/api/admin/export" className="ghost-button" download>
          {adminText.database.exportNow}
        </a>
      </div>

      <div className="admin-utility-grid">
        <section className="admin-import-card">
          <div className="admin-import-card-header">
            <h3>{adminText.import.title}</h3>
            <p className="subtle">{adminText.import.intro}</p>
          </div>
          <AdminCsvImportForm />
        </section>

        <section className="admin-notes-card">
          <div className="admin-import-card-header">
            <h3>{adminText.notes.title}</h3>
          </div>
          <p className="subtle admin-notes-body">{adminText.notes.body}</p>
        </section>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {feedback ? <p className="form-success">{feedback}</p> : null}

      <p className="subtle admin-database-count">
        {adminText.database.resultsLabel.replace("{count}", String(filteredEntries.length))}
      </p>

      {filteredEntries.length === 0 ? (
        <p className="empty-state">{adminText.database.emptyMessage}</p>
      ) : (
        <div className="admin-record-table-wrap">
          <table className="admin-record-table">
            <thead>
              <tr>
                <th>{adminText.database.idLabel}</th>
                <th>{adminText.database.lapTimeLabel}</th>
                <th>{adminText.database.driverLabel}</th>
                <th>{adminText.database.trackLabel}</th>
                <th>{adminText.database.setupLabel}</th>
                <th>{adminText.database.seatLabel}</th>
                <th>{adminText.database.sessionDateLabel}</th>
                <th>{adminText.database.createdAtLabel}</th>
                <th>{adminText.database.actionsLabel}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const deletingThisEntry = pendingId === entry.id;
                const renamingThisDriver = pendingId === entry.driver_name;

                return (
                  <tr key={entry.id}>
                    <td className="admin-record-id-cell">#{entry.id}</td>
                    <td>
                      <strong className="lap-value-content admin-record-lap">
                        <span>{formatLapTime(entry.lap_time_ms)}</span>
                        <RainIndicator isWet={entry.is_wet} />
                      </strong>
                    </td>
                    <td className="admin-record-driver-cell">
                      <DriverName name={entry.driver_name} showCode />
                    </td>
                    <td>{entry.track_name || "-"}</td>
                    <td>{entry.setup || "-"}</td>
                    <td>{entry.seat || "-"}</td>
                    <td>{formatDate(entry.session_date)}</td>
                    <td>{formatDate(entry.created_at)}</td>
                    <td className="admin-record-actions-cell">
                      <button
                        className="ghost-button compact-button admin-record-edit-button"
                        type="button"
                        onClick={() => handleRenameDriver(entry)}
                        disabled={deletingThisEntry || renamingThisDriver || isPending}
                      >
                        {pendingId === entry.driver_name ? adminText.database.saving : adminText.database.editDriver}
                      </button>
                      <button
                        className="danger-button admin-record-delete-button"
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingThisEntry || renamingThisDriver || isPending}
                      >
                        {deletingThisEntry ? adminText.database.deleting : adminText.database.delete}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
