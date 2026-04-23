"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

export function RecentLapTimesList({ entries, emptyMessage = adminText.recentTimesList.emptyMessage }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id) {
    const confirmed = window.confirm(adminText.recentTimesList.confirmDelete);
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
      setError(payload?.error || adminText.recentTimesList.deleteError);
      return;
    }

    setFeedback(adminText.recentTimesList.deleteSuccess);
    startTransition(() => {
      router.refresh();
    });
  }

  if (entries.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}
      {feedback ? <p className="form-success">{feedback}</p> : null}
      {entries.map((entry) => {
        const deletingThisEntry = pendingId === entry.id;

        return (
          <article key={entry.id} className="mini-item">
            <div className="mini-item-row">
              <strong className="lap-value-content">
                <span>{formatLapTime(entry.lap_time_ms)}</span>
                <RainIndicator isWet={entry.is_wet} />
              </strong>
              <button
                className="danger-button"
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingThisEntry || isPending}
              >
                {deletingThisEntry ? adminText.recentTimesList.deleting : adminText.recentTimesList.delete}
              </button>
            </div>
            <p>
              <DriverName name={entry.driver_name} showCode /> - {entry.track_name}
            </p>
            <p className="subtle">
              {formatDate(entry.session_date)}
            </p>
          </article>
        );
      })}
    </>
  );
}
