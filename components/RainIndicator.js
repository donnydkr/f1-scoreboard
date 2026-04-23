export function RainIndicator({ isWet = false, size = "default" }) {
  if (!isWet) {
    return null;
  }

  return (
    <span className={`rain-indicator rain-indicator-${size}`} title="Regenronde" aria-label="Regenronde">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 18a4 4 0 1 1 .8-7.92A5 5 0 0 1 18.5 11a3.5 3.5 0 0 1-.5 7H8Z" />
        <path d="M9 19.5l-1 2.5" />
        <path d="M13 19.5l-1 2.5" />
        <path d="M17 19.5l-1 2.5" />
      </svg>
    </span>
  );
}
