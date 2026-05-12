"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircuitRecordCelebration } from "@/components/CircuitRecordCelebration";
import { RainIndicator } from "@/components/RainIndicator";
import { SetupIndicator } from "@/components/SetupIndicator";
import { circuitNames, getCircuitFlagAsset } from "@/lib/circuit-assets";
import { adminText } from "@/lib/admin-text";
import { parseLapTimeToMs, isLapTimeInAllowedRange } from "@/lib/time";

const initialState = {
  driverName: "",
  trackName: "",
  lapTime: "",
  isWet: false,
  setup: "Balanced",
  seat: "Stoel 1"
};

const setupOptions = [
  "Custom",
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
  const [isCircuitMenuOpen, setIsCircuitMenuOpen] = useState(false);
  const [isSetupMenuOpen, setIsSetupMenuOpen] = useState(false);
  const [isSeatMenuOpen, setIsSeatMenuOpen] = useState(false);
  const [deletingDriverId, setDeletingDriverId] = useState(null);
  const [isCreatingDriver, setIsCreatingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [celebrationRecord, setCelebrationRecord] = useState(null);
  const driverMenuRef = useRef(null);
  const circuitMenuRef = useRef(null);
  const setupMenuRef = useRef(null);
  const seatMenuRef = useRef(null);
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

      if (circuitMenuRef.current && !circuitMenuRef.current.contains(event.target)) {
        setIsCircuitMenuOpen(false);
      }

      if (setupMenuRef.current && !setupMenuRef.current.contains(event.target)) {
        setIsSetupMenuOpen(false);
      }

      if (seatMenuRef.current && !seatMenuRef.current.contains(event.target)) {
        setIsSeatMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDriverMenuOpen(false);
        setIsCircuitMenuOpen(false);
        setIsSetupMenuOpen(false);
        setIsSeatMenuOpen(false);
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

  function selectCircuit(trackName) {
    setValues((current) => ({
      ...current,
      trackName
    }));
    setIsCircuitMenuOpen(false);
    setFeedback("");
    setError("");
  }

  function selectSetup(setup) {
    setValues((current) => ({
      ...current,
      setup
    }));
    setIsSetupMenuOpen(false);
    setFeedback("");
    setError("");
  }

  function selectSeat(seat) {
    setValues((current) => ({
      ...current,
      seat
    }));
    setIsSeatMenuOpen(false);
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

    if (!values.trackName) {
      setError(adminText.api.lapTimeMissingFields);
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

    setValues({ ...initialState });
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

        <div className="field circuit-select-field">
          <span id="circuit-select-label">{adminText.lapForm.circuitLabel}</span>
          <div className="setup-field-group">
            <div
              className={`circuit-select${isCircuitMenuOpen ? " is-open" : ""}`}
              ref={circuitMenuRef}
            >
              <button
                className="circuit-select-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={isCircuitMenuOpen}
                aria-labelledby="circuit-select-label"
                onClick={() => setIsCircuitMenuOpen((current) => !current)}
              >
                <span className={values.trackName ? "circuit-select-value" : "circuit-select-placeholder"}>
                  {values.trackName || adminText.lapForm.circuitPlaceholder}
                </span>
                <span className="circuit-select-chevron" aria-hidden="true" />
              </button>

              {isCircuitMenuOpen ? (
                <div className="circuit-select-menu" role="menu" aria-labelledby="circuit-select-label">
                  {circuitNames.map((track) => {
                    const flagSrc = getCircuitFlagAsset(track);
                    const isSelected = track === values.trackName;

                    return (
                      <button
                        key={track}
                        className={`circuit-option-button${isSelected ? " is-selected" : ""}`}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => selectCircuit(track)}
                      >
                        {flagSrc ? (
                          <img
                            className="circuit-option-flag"
                            src={flagSrc}
                            alt=""
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="circuit-option-name">{track}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
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
        </div>

        <div className="field">
          <span>Vul een naam in</span>
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

        <div className="field seat-select-field">
          <span id="seat-select-label">{adminText.lapForm.seatLabel}</span>
          <div className="setup-field-group">
            <div className={`seat-select${isSeatMenuOpen ? " is-open" : ""}`} ref={seatMenuRef}>
              <button
                className="seat-select-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={isSeatMenuOpen}
                aria-labelledby="seat-select-label"
                onClick={() => setIsSeatMenuOpen((current) => !current)}
              >
                <span className={values.seat ? "seat-select-value" : "seat-select-placeholder"}>
                  {values.seat || "Kies een stoel"}
                </span>
                <span className="seat-select-chevron" aria-hidden="true" />
              </button>

              {isSeatMenuOpen ? (
                <div className="seat-select-menu" role="menu" aria-labelledby="seat-select-label">
                  {seatOptions.map((seat) => {
                    const isSelected = seat === values.seat;

                    return (
                      <button
                        key={seat}
                        className={`seat-option-button${isSelected ? " is-selected" : ""}`}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => selectSeat(seat)}
                      >
                        <SeatWheelIcon />
                        <span className="seat-option-name">{seat}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
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

        <label className="field">
          <span id="setup-select-label">{adminText.lapForm.setupLabel}</span>
          <div className="setup-field-group">
            <div className={`setup-select${isSetupMenuOpen ? " is-open" : ""}`} ref={setupMenuRef}>
              <button
                className="setup-select-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={isSetupMenuOpen}
                aria-labelledby="setup-select-label"
                onClick={() => setIsSetupMenuOpen((current) => !current)}
              >
                <span className={values.setup ? "setup-select-value" : "setup-select-placeholder"}>
                  {values.setup || adminText.lapForm.setupPlaceholder}
                </span>
                <span className="setup-select-chevron" aria-hidden="true" />
              </button>

              {isSetupMenuOpen ? (
                <div className="setup-select-menu" role="menu" aria-labelledby="setup-select-label">
                  {setupOptions.map((opt) => {
                    const isSelected = opt === values.setup;

                    return (
                      <button
                        key={opt}
                        className={`setup-option-button${isSelected ? " is-selected" : ""}`}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => selectSetup(opt)}
                      >
                        <SetupIndicator setup={opt} size="large" />
                        <span className="setup-option-name">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
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
