"use client";

import Link from "next/link";
import { Fragment, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminCsvImportForm } from "@/components/AdminCsvImportForm";
import { DriverName } from "@/components/DriverName";
import { RainIndicator } from "@/components/RainIndicator";
import { adminText } from "@/lib/admin-text";
import { circuitNames } from "@/lib/circuit-assets";
import { formatDate, formatLapTime } from "@/lib/time";

const setupOptions = [
  "Custom",
  "Maximum Downforce",
  "Increased Downforce",
  "Balanced",
  "Increased Top Speed",
  "Maximum Top Speed"
];

const seatOptions = ["Stoel 1", "Stoel 2"];

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

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function createEditValues(entry) {
  return {
    driverName: entry.driver_name || "",
    trackName: entry.track_name || "",
    lapTime: formatLapTime(entry.lap_time_ms),
    setup: entry.setup || "Balanced",
    seat: entry.seat || "Stoel 1",
    isWet: Boolean(entry.is_wet),
    sessionDate: toDateInputValue(entry.session_date)
  };
}

export function AdminDatabaseManager({ entries }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [pendingAction, setPendingAction] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
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
    setPendingAction("delete");

    const response = await fetch(`/api/lap-times/${id}`, {
      method: "DELETE"
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setPendingId(null);
      setPendingAction("");
      setError(payload?.error || adminText.database.deleteError);
      return;
    }

    setPendingId(null);
    setPendingAction("");
    setFeedback(adminText.database.deleteSuccess);
    startTransition(() => {
      router.refresh();
    });
  }

  function openEdit(entry) {
    setEditingId(entry.id);
    setEditValues(createEditValues(entry));
    setError("");
    setFeedback("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
    setError("");
  }

  function updateEditValue(event) {
    const { name, value, type, checked } = event.target;
    setEditValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleUpdateRecord(entry) {
    if (!editValues) {
      return;
    }

    setError("");
    setFeedback("");
    setPendingId(entry.id);
    setPendingAction("save");

    const response = await fetch(`/api/lap-times/${entry.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(editValues)
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setPendingId(null);
      setPendingAction("");
      setError(payload?.error || adminText.api.lapTimeUpdateServerError);
      return;
    }

    setPendingId(null);
    setPendingAction("");
    setEditingId(null);
    setEditValues(null);
    setFeedback(adminText.database.updateSuccess);

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
                const deletingThisEntry = pendingId === entry.id && pendingAction === "delete";
                const savingThisEntry = pendingId === entry.id && pendingAction === "save";
                const isEditing = editingId === entry.id;
                const trackOptions = circuitNames.includes(entry.track_name)
                  ? circuitNames
                  : [entry.track_name, ...circuitNames].filter(Boolean);
                const recordSetupOptions = setupOptions.includes(entry.setup)
                  ? setupOptions
                  : [entry.setup, ...setupOptions].filter(Boolean);
                const recordSeatOptions = seatOptions.includes(entry.seat)
                  ? seatOptions
                  : [entry.seat, ...seatOptions].filter(Boolean);

                return (
                  <Fragment key={entry.id}>
                    <tr>
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
                          onClick={() => (isEditing ? cancelEdit() : openEdit(entry))}
                          disabled={deletingThisEntry || savingThisEntry || isPending}
                        >
                          {isEditing ? adminText.database.cancelEdit : adminText.database.editDriver}
                        </button>
                        <button
                          className="danger-button admin-record-delete-button"
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingThisEntry || savingThisEntry || isPending}
                        >
                          {deletingThisEntry ? adminText.database.deleting : adminText.database.delete}
                        </button>
                      </td>
                    </tr>
                    {isEditing ? (
                      <tr className="admin-record-edit-row">
                        <td colSpan={9}>
                          <div className="admin-record-edit-form">
                            <label className="field admin-record-edit-field">
                              <span>{adminText.database.driverLabel}</span>
                              <input
                                name="driverName"
                                value={editValues?.driverName || ""}
                                onChange={updateEditValue}
                              />
                            </label>
                            <label className="field admin-record-edit-field">
                              <span>{adminText.database.trackLabel}</span>
                              <select
                                name="trackName"
                                value={editValues?.trackName || ""}
                                onChange={updateEditValue}
                              >
                                {trackOptions.map((track) => (
                                  <option key={track} value={track}>
                                    {track}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="field admin-record-edit-field">
                              <span>{adminText.database.lapTimeLabel}</span>
                              <input
                                name="lapTime"
                                value={editValues?.lapTime || ""}
                                onChange={updateEditValue}
                                placeholder={adminText.lapForm.lapTimePlaceholder}
                              />
                            </label>
                            <label className="field admin-record-edit-field">
                              <span>{adminText.database.setupLabel}</span>
                              <select
                                name="setup"
                                value={editValues?.setup || "Balanced"}
                                onChange={updateEditValue}
                              >
                                {recordSetupOptions.map((setup) => (
                                  <option key={setup} value={setup}>
                                    {setup}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="field admin-record-edit-field">
                              <span>{adminText.database.seatLabel}</span>
                              <select
                                name="seat"
                                value={editValues?.seat || "Stoel 1"}
                                onChange={updateEditValue}
                              >
                                {recordSeatOptions.map((seat) => (
                                  <option key={seat} value={seat}>
                                    {seat}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="field admin-record-edit-field">
                              <span>{adminText.database.sessionDateLabel}</span>
                              <input
                                type="date"
                                name="sessionDate"
                                value={editValues?.sessionDate || ""}
                                onChange={updateEditValue}
                              />
                            </label>
                            <label className="admin-record-edit-toggle">
                              <input
                                type="checkbox"
                                name="isWet"
                                checked={Boolean(editValues?.isWet)}
                                onChange={updateEditValue}
                              />
                              <span>Wet</span>
                            </label>
                            <div className="admin-record-edit-actions">
                              <button
                                className="primary-button compact-button"
                                type="button"
                                onClick={() => handleUpdateRecord(entry)}
                                disabled={savingThisEntry || deletingThisEntry || isPending}
                              >
                                {savingThisEntry ? adminText.database.saving : adminText.database.saveDriver}
                              </button>
                              <button
                                className="ghost-button compact-button"
                                type="button"
                                onClick={cancelEdit}
                                disabled={savingThisEntry}
                              >
                                {adminText.database.cancelEdit}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
