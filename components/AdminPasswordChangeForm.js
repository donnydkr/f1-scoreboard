"use client";

import { useState } from "react";
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

export function AdminPasswordChangeForm({ requireCurrentPassword = true }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("admin");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(adminText.auth.passwordMismatch);
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      setError(payload?.error || adminText.auth.passwordChangeError);
      setIsSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {requireCurrentPassword ? (
        <label className="field">
          <span>{adminText.auth.currentPasswordLabel}</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder={adminText.auth.currentPasswordPlaceholder}
            disabled={isSubmitting}
          />
        </label>
      ) : null}

      <label className="field">
        <span>{adminText.auth.newPasswordLabel}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder={adminText.auth.newPasswordPlaceholder}
          disabled={isSubmitting}
        />
      </label>

      <label className="field">
        <span>{adminText.auth.confirmPasswordLabel}</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={adminText.auth.confirmPasswordPlaceholder}
          disabled={isSubmitting}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? adminText.auth.savingPassword : adminText.auth.savePasswordButton}
      </button>
    </form>
  );
}
