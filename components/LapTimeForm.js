"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RainIndicator } from "@/components/RainIndicator";
import { adminText } from "@/lib/admin-text";
import { isLapTimeInAllowedRange, parseLapTimeToMs } from "@/lib/time";

const initialState = {
  driverName: "",
  trackName: "",
  lapTime: "",
  sessionDate: new Date().toISOString().slice(0, 10),
  isWet: false
};

const trackOptions = [
  "Albert Park",
  "Shanghai International",
  "Suzuka",
  "Bahrain",
  "Jeddah",
  "Miami Autodrome",
  "Imola",
  "Monaco",
  "Barcelona-Catalunya",
  "Gilles Villeneuve",
  "Red Bull Ring",
  "Silverstone",
  "Spa-Francorchamps",
  "Hungaroring",
  "Zandvoort",
  "Monza",
  "Baku",
  "Marina Bay",
  "Americas",
  "Hermanos Rodriguez",
  "Interlagos",
  "Las Vegas",
  "Lusail International",
  "Yas Marina"
];

function formatLapTimeInput(rawValue) {
  const digits = String(rawValue || "").replace(/\D/g, "").slice(0, 8);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, -3)}.${digits.slice(-3)}`;
  }

  const milliseconds = digits.slice(-3);
  const rawSeconds = Number(digits.slice(-5, -3));
  const rawMinutes = Number(digits.slice(0, -5));
  const normalizedMinutes = rawMinutes + Math.floor(rawSeconds / 60);
  const normalizedSeconds = rawSeconds % 60;

  return `${normalizedMinutes}:${String(normalizedSeconds).padStart(2, "0")}.${milliseconds}`;
}

function sortDrivers(drivers) {
  return [...drivers].sort((left, right) => left.name.localeCompare(right.name, "nl-NL"));
}

export function LapTimeForm({ initialDrivers = [] }) {
  const router = useRouter();
  const [values, setValues] = useState(initialState);
  const [drivers, setDrivers] = useState(() => sortDrivers(initialDrivers));
  const [isCreatingDriver, setIsCreatingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const parsedLapTimeMs = parseLapTimeToMs(values.lapTime);
  const lapTimeRangeError =
    values.lapTime && parsedLapTimeMs && !isLapTimeInAllowedRange(parsedLapTimeMs)
      ? adminText.api.lapTimeRangeError
      : "";

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

  function updateValue(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "lapTime" ? formatLapTimeInput(value) : value
    }));
  }

  async function handleCreateDriver() {
    const trimmedName = newDriverName.trim();
    if (!trimmedName) {
      setError(adminText.lapForm.addDriverEmptyError);
      return;
    }

    setError("");
    setFeedback("");

    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: trimmedName })
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setError(payload?.error || adminText.lapForm.addDriverError);
      return;
    }

    const createdDriver = payload?.data;
    if (!createdDriver?.name) {
      setError(adminText.lapForm.addDriverError);
      return;
    }

    setDrivers((current) => {
      const nextDrivers = current.some((driver) => driver.name === createdDriver.name)
        ? current
        : [...current, createdDriver];

      return sortDrivers(nextDrivers);
    });
    setValues((current) => ({
      ...current,
      driverName: createdDriver.name
    }));
    setNewDriverName("");
    setIsCreatingDriver(false);
    setFeedback(adminText.lapForm.addDriverSuccess.replace("{name}", createdDriver.name));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");

    if (lapTimeRangeError) {
      setError(lapTimeRangeError);
      return;
    }

    const response = await fetch("/api/lap-times", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setError(payload?.error || adminText.lapForm.saveError);
      return;
    }

    if (payload?.action === "skipped") {
      setFeedback(payload.message || adminText.lapForm.saveSkipped);
      return;
    }

    setValues({
      ...initialState,
      sessionDate: values.sessionDate || initialState.sessionDate
    });
    setFeedback(payload?.message || adminText.lapForm.saveSuccess);

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field driver-field">
          <label className="field">
            <span>{adminText.lapForm.driverLabel}</span>
            <select name="driverName" value={values.driverName} onChange={updateValue} required>
              <option value="" disabled>
                {adminText.lapForm.driverPlaceholder}
              </option>
              {drivers.map((driver) => (
                <option key={driver.id || driver.name} value={driver.name}>
                  {driver.name}
                </option>
              ))}
            </select>
          </label>

          <div className="driver-builder driver-builder-highlight">
            {isCreatingDriver ? (
              <div className="driver-builder-row">
                <input
                  className="driver-builder-input"
                  style={{ flex: 1 }}
                  value={newDriverName}
                  onChange={(event) => setNewDriverName(event.target.value)}
                  placeholder={adminText.lapForm.newDriverPlaceholder}
                  autoComplete="off"
                />
                <button className="primary-button compact-button" type="button" onClick={handleCreateDriver}>
                  {adminText.lapForm.saveDriver}
                </button>
                <button
                  className="ghost-button compact-button"
                  type="button"
                  onClick={() => {
                    setIsCreatingDriver(false);
                    setNewDriverName("");
                    setError("");
                  }}
                >
                  {adminText.lapForm.cancelDriver}
                </button>
              </div>
            ) : (
              <button
                className="driver-builder-button"
                type="button"
                onClick={() => {
                  setIsCreatingDriver(true);
                  setFeedback("");
                  setError("");
                }}
              >
                {adminText.lapForm.createDriver}
              </button>
            )}
          </div>
        </div>

        <div className="field driver-field">
          <label className="field">
            <span>{adminText.lapForm.circuitLabel}</span>
            <select name="trackName" value={values.trackName} onChange={updateValue} required>
              <option value="" disabled>
                {adminText.lapForm.circuitPlaceholder}
              </option>
              {trackOptions.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </label>

          <div className="driver-builder driver-builder-spacer" aria-hidden="true" />
        </div>

        <label className="field">
          <span>{adminText.lapForm.lapTimeLabel}</span>
          <input
            name="lapTime"
            value={values.lapTime}
            onChange={updateValue}
            inputMode="numeric"
            autoComplete="off"
            placeholder={adminText.lapForm.lapTimePlaceholder}
            required
          />
          {lapTimeRangeError ? <span className="field-error">{lapTimeRangeError}</span> : null}
        </label>

        <label className="field checkbox-field">
          <span>{adminText.lapForm.isWetLabel}</span>
          <span className="checkbox-input">
            <input type="checkbox" name="isWet" checked={values.isWet} onChange={updateValue} />
            <RainIndicator isWet size="xlarge" />
          </span>
        </label>

        <label className="field">
          <span>{adminText.lapForm.sessionDateLabel}</span>
          <input type="date" name="sessionDate" value={values.sessionDate} onChange={updateValue} required />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {feedback ? <p className="form-success">{feedback}</p> : null}

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isPending}>
          {isPending ? adminText.lapForm.submitting : adminText.lapForm.submit}
        </button>
      </div>
    </form>
  );
}
