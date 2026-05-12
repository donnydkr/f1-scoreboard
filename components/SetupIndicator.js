export function SetupIndicator({ setup, size = "default" }) {
  const getIcon = () => {
    switch (setup) {
      case "Maximum Downforce":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" opacity="0.4" />
            <path d="M4 12h16" opacity="0.7" />
            <path d="M4 17h16" />
            <path d="m7 14 5 5 5-5" />
          </svg>
        );
      case "Increased Downforce":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h16" opacity="0.4" />
            <path d="M4 17h16" />
            <path d="m9 14 3 3 3-3" />
          </svg>
        );
      case "Balanced":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h16" />
            <path d="m18 8 3 4-3 4" />
            <path d="m6 16-3-4 3-4" />
          </svg>
        );
      case "Increased Top Speed":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h16" />
            <path d="m15 9 3 3-3 3" />
          </svg>
        );
      case "Maximum Top Speed":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" opacity="0.4" />
            <path d="M4 12h16" />
            <path d="m13 9 3 3-3 3" />
            <path d="m17 9 3 3-3 3" />
          </svg>
        );
      case "Custom":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h7" />
            <path d="M13 12h7" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M7 7h10" opacity="0.45" />
            <path d="M7 17h10" opacity="0.45" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!setup) return null;

  return (
    <span className={`setup-indicator setup-indicator-${size}`} title={setup}>
      {getIcon()}
    </span>
  );
}
