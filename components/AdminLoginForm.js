"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminText } from "@/lib/admin-text";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData) {
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accessCode: formData.get("accessCode")
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || adminText.loginForm.loginError);
      return;
    }

    startTransition(() => {
      router.refresh();
      router.push("/admin");
    });
  }

  return (
    <form
      className="stack-form"
      action={handleSubmit}
    >
      <label className="field">
        <span>{adminText.loginForm.accessCodeLabel}</span>
        <input
          type="password"
          name="accessCode"
          placeholder={adminText.loginForm.accessCodePlaceholder}
          required
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isPending}>
        {isPending ? adminText.loginForm.submitting : adminText.loginForm.submit}
      </button>
    </form>
  );
}
