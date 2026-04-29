"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircuitRecordCelebration } from "@/components/CircuitRecordCelebration";
import { RainIndicator } from "@/components/RainIndicator";
import { SetupIndicator } from "@/components/SetupIndicator";
import { circuitNames } from "@/lib/circuit-assets";
import { adminText } from "@/lib/admin-text";
import { parseLapTimeToMs, isLapTimeInAllowedRange } from "@/lib/time";

const initialState = {
  driverName: "",
  trackName: "",
  lapTime: "",
  sessionDate: new Date().toISOString().slice(0, 10),
  isWet: false,
  setup: "Balanced",
  seat: "Stoel 1"
};

const setupOptions = [
  "Maximum Downforce",
  "Increased Downforce",
  "Balanced",
  "Increased Top Speed",
  "Maximum Top Speed"
];

function TrashIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

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
  const [isDriverMenuOpen, setIsDriverMenuOpen] = useState(false);
  const [deletingDriverId, setDeletingDriverId] = useState(null);
  const [isCreatingDriver, setIsCreatingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [celebrationRecord, setCelebrationRecord] = useState(null);
  const driverMenuRef = useRef(null);
  const celebrationTimerRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  const parsedLapTimeMs = parseLapTimeToMs(values.lapTime);
  const lapTimeRangeError =
    values.lapTime && parsedLapTimeMs && !isLapTimeInAllowedRange(parsedLapTimeMs)
      ? adminText.api.lapTimeRangeError
      : "";

  useEffect(() => {
    function handlePointerDown(event) {
      if (driverMenuRef.current && !driverMenuRef.current.contains(event.target)) {
        setIsDriverMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDriverMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    }, 6500);

    return () => {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, [celebrationRecord]);

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

  const seatOptions = ["Stoel 1", "Stoel 2"];

  function updateValue(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "lapTime" ? formatLapTimeInput(value) : value
    }));
  }

  function selectDriver(driverName) {
    setValues((current) => ({
      ...current,
      driverName
    }));
    setIsDriverMenuOpen(false);
    setFeedback("");
    setError("");
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

  async function handleDeleteDriver(driver) {
    if (!driver?.id) {
      return;
    }

    const confirmed = window.confirm(
      adminText.lapForm.confirmDeleteDriver.replace("{name}", driver.name)
    );

    if (!confirmed) {
      return;
    }

    const driverId = String(driver.id);

    setError("");
    setFeedback("");
    setDeletingDriverId(driverId);

    const response = await fetch(`/api/drivers/${driver.id}`, {
      method: "DELETE"
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setDeletingDriverId(null);
      setError(payload?.error || adminText.lapForm.deleteDriverError);
      return;
    }

    setDrivers((current) => current.filter((currentDriver) => String(currentDriver.id) !== driverId));
    setValues((current) => ({
      ...current,
      driverName: current.driverName === driver.name ? "" : current.driverName
    }));
    setDeletingDriverId(null);
    setIsDriverMenuOpen(false);
    setFeedback(adminText.lapForm.deleteDriverSuccess.replace("{name}", driver.name));

    startTransition(() => {
      router.refresh();
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    setError("");

    if (!values.driverName) {
      setError(adminText.api.driverRequired);
      return;
    }

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
    if (payload?.isCircuitRecord && payload?.data) {
      setCelebrationRecord({
        trackName: payload.data.track_name,
        driverName: payload.data.driver_name,
        lapTimeMs: payload.data.lap_time_ms,
        isWet: payload.data.is_wet
      });
    }

    setFeedback(
      payload?.message ||
        (payload?.isCircuitRecord ? adminText.lapForm.recordSuccess : adminText.lapForm.saveSuccess)
    );

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field driver-select-field">
          <span id="driver-select-label">{adminText.lapForm.driverLabel}</span>
          <div className={`driver-select${isDriverMenuOpen ? " is-open" : ""}`} ref={driverMenuRef}>
            <button
              className="driver-select-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isDriverMenuOpen}
              aria-labelledby="driver-select-label"
              onClick={() => setIsDriverMenuOpen((current) => !current)}
            >
              <span className={values.driverName ? "driver-select-value" : "driver-select-placeholder"}>
                {values.driverName || adminText.lapForm.driverPlaceholder}
              </span>
              <span className="driver-select-chevron" aria-hidden="true" />
            </button>

            {isDriverMenuOpen ? (
              <div className="driver-select-menu" role="menu" aria-labelledby="driver-select-label">
                {drivers.length === 0 ? (
                  <div className="driver-select-empty">{adminText.lapForm.emptyDrivers}</div>
                ) : (
                  drivers.map((driver) => {
                    const driverId = String(driver.id || driver.name);
                    const isSelected = driver.name === values.driverName;
                    const deletingThisDriver = deletingDriverId === String(driver.id);

                    return (
                      <div
                        key={driverId}
                        className={`driver-option-row${isSelected ? " is-selected" : ""}`}
                        role="none"
                      >
                        <button
                          className="driver-option-button"
                          type="button"
                          role="menuitemradio"
                          aria-checked={isSelected}
                          disabled={Boolean(deletingDriverId)}
                          onClick={() => selectDriver(driver.name)}
                        >
                          <span className="driver-option-name">{driver.name}</span>
                        </button>
                        <button
                          className="driver-option-delete"
                          type="button"
                          aria-label={adminText.lapForm.deleteDriverAria.replace("{name}", driver.name)}
                          title={adminText.lapForm.deleteDriver}
                          disabled={!driver.id || Boolean(deletingDriverId)}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteDriver(driver);
                          }}
                        >
                          {deletingThisDriver ? <span className="driver-option-spinner" /> : <TrashIcon />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </div>

        <label className="field">
          <span>{adminText.lapForm.circuitLabel}</span>
          <div className="setup-field-group">
            <select name="trackName" value={values.trackName} onChange={updateValue} required>
              <option value="" disabled>
                {adminText.lapForm.circuitPlaceholder}
              </option>
              {circuitNames.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
            <label className={`rain-toggle-button ${values.isWet ? "is-active" : ""}`}>
              <input
                className="rain-toggle-input"
                type="checkbox"
                name="isWet"
                checked={values.isWet}
                onChange={updateValue}
              />
              <RainIndicator isWet size="large" />
            </label>
          </div>
        </label>

        <div className="field">
          <span>{adminText.lapForm.createDriver}</span>
          <div className="driver-builder-highlight">
            {isCreatingDriver ? (
              <div className="driver-builder-row driver-builder-row-stacked">
                <input
                  className="driver-builder-input"
                  value={newDriverName}
                  onChange={(event) => setNewDriverName(event.target.value)}
                  placeholder={adminText.lapForm.newDriverPlaceholder}
                  autoComplete="off"
                />
                <div className="driver-builder-actions">
                  <button className="primary-button compact-button builder-action-button" type="button" onClick={handleCreateDriver}>
                    {adminText.lapForm.saveDriver}
                  </button>
                  <button
                    className="ghost-button compact-button builder-action-button"
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

        <label className="field">
          <span>{adminText.lapForm.seatLabel}</span>
          <select name="seat" value={values.seat} onChange={updateValue}>
            {seatOptions.map((seat) => (
              <option key={seat} value={seat}>{seat}</option>
            ))}
          </select>
        </label>

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

        <label className="field">
          <span>{adminText.lapForm.setupLabel}</span>
          <div className="setup-field-group">
            <select name="setup" value={values.setup} onChange={updateValue} required>
              {setupOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="setup-preview">
              <SetupIndicator setup={values.setup} size="large" />
            </div>
          </div>
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

      <CircuitRecordCelebration
        open={Boolean(celebrationRecord)}
        record={celebrationRecord}
        title={
          celebrationRecord ? `Nieuwe snelste tijd op ${celebrationRecord.trackName}!` : "Nieuwe snelste tijd!"
        }
        onClose={() => setCelebrationRecord(null)}
      />
    </form>
  );
}
