function splitDriverName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstNames: "",
      surname: parts[0] || ""
    };
  }

  return {
    firstNames: parts.slice(0, -1).join(" "),
    surname: parts.at(-1)
  };
}

function getDriverCode(name) {
  const { surname } = splitDriverName(name);
  const sanitizedSurname = surname.replace(/[^A-Za-z\u00C0-\u017F]/g, "");

  if (!sanitizedSurname) {
    return "";
  }

  return sanitizedSurname.slice(0, 3).toLocaleUpperCase("nl-NL");
}

export function DriverName({ name, showCode = false }) {
  const { firstNames, surname } = splitDriverName(name);
  const code = getDriverCode(name);

  return (
    <span className="driver-name">
      <span className="driver-name-text">
        {firstNames ? `${firstNames} ` : null}
        <strong>{surname}</strong>
      </span>
      {showCode && code ? <span className="driver-code">{code}</span> : null}
    </span>
  );
}
