"use client";

import { useEffect } from "react";
import { DriverName } from "@/components/DriverName";
import { RainIndicator } from "@/components/RainIndicator";
import { formatLapTime } from "@/lib/time";

const confettiPieces = Array.from({ length: 40 }, (_, index) => ({
  id: index,
  left: `${(index * 17) % 100}%`,
  delay: `${(index % 10) * 0.08}s`,
  duration: `${1.9 + (index % 7) * 0.14}s`,
  rotate: `${(index * 23) % 360}deg`,
  color: ["#ffd166", "#ff6b6b", "#7fd36d", "#5bc0eb", "#f7b267", "#ffffff"][index % 6],
  size: `${8 + (index % 4) * 2}px`,
  height: `${14 + (index % 3) * 3}px`
}));

export function CircuitRecordCelebration({ open, record, title, description, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !record) {
    return null;
  }

  return (
    <div className="celebration-overlay" role="presentation" onClick={() => onClose?.()}>
      <div
        className="celebration-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="celebration-ribbon celebration-ribbon-left" aria-hidden="true" />
        <div className="celebration-ribbon celebration-ribbon-right" aria-hidden="true" />
        <div className="celebration-confetti" aria-hidden="true">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="celebration-confetti-piece"
              style={{
                left: piece.left,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.height,
                "--piece-rotation": piece.rotate
              }}
            />
          ))}
        </div>
        <div className="celebration-body">
          <h3 id="celebration-title">{title}</h3>
          <div className="celebration-summary">
            <div className="celebration-summary-item">
              <span className="celebration-summary-label">Circuit</span>
              <span className="celebration-summary-value">{record.trackName}</span>
            </div>
            <div className="celebration-summary-item">
              <span className="celebration-summary-label">Coureur</span>
              <span className="celebration-summary-value">
                <DriverName name={record.driverName} />
              </span>
            </div>
            <div className="celebration-summary-item">
              <span className="celebration-summary-label">Tijd</span>
              <span className="celebration-summary-value">
                {formatLapTime(record.lapTimeMs)}
                <span className="celebration-weather">
                  <RainIndicator isWet={Boolean(record.isWet)} size="large" />
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="celebration-actions">
          <button className="primary-button" type="button" onClick={() => onClose?.()}>
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
