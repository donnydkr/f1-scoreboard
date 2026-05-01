"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminText } from "@/lib/admin-text";

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

export function AdminCsvImportForm() {
  const router = useRouter();
  const checkboxId = useId();
  const [file, setFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFeedback("");

    if (!file) {
      setError(adminText.import.fileRequired);
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("replaceExisting", replaceExisting ? "true" : "false");

    const response = await fetch("/api/admin/import", {
      method: "POST",
      body: formData
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setError(payload?.error || adminText.import.serverError);
      return;
    }

    setFeedback(payload?.message || adminText.import.successFallback);
    setFile(null);
    event.currentTarget.reset();

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="admin-import-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>{adminText.import.fileLabel}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          disabled={isPending}
        />
      </label>

      <label className="admin-import-toggle" htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={replaceExisting}
          onChange={(event) => setReplaceExisting(event.target.checked)}
          disabled={isPending}
        />
        <span>{adminText.import.replaceExisting}</span>
      </label>

      <p className="subtle admin-import-hint">{adminText.import.hint}</p>

      {error ? <p className="form-error">{error}</p> : null}
      {feedback ? <p className="form-success">{feedback}</p> : null}

      <button className="ghost-button compact-button admin-import-submit" type="submit" disabled={isPending}>
        {isPending ? adminText.import.importing : adminText.import.submit}
      </button>
    </form>
  );
}
