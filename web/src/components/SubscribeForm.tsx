"use client";

import { useId, useState, type FormEvent } from "react";
import type { SiteSetting } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SubscribeForm({ settings }: { settings: SiteSetting }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  function validate(value: string) {
    if (!value.trim()) return settings.subscribeRequiredMessage;
    if (!EMAIL_RE.test(value.trim())) return settings.subscribeInvalidMessage;
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const error = validate(email);
    setFieldError(error);
    if (error) return;

    setStatus("submitting");
    const website = new FormData(e.currentTarget).get("website"); // honeypot
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      if (res.status === 422) {
        setFieldError(settings.subscribeInvalidMessage);
        setStatus("idle");
        return;
      }
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="subscribe__success" role="status">
        {settings.subscribeSuccess}
      </p>
    );
  }

  return (
    <form className="subscribe" onSubmit={onSubmit} noValidate>
      <label className="sr-only" htmlFor={id}>
        {settings.subscribePlaceholder}
      </label>
      <div className="subscribe__row">
        <input
          id={id}
          className={`subscribe__input${fieldError ? " is-invalid" : ""}`}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={settings.subscribePlaceholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? `${id}-err` : undefined}
        />
        {/* Honeypot: hidden from people, irresistible to bots. */}
        <input className="sr-only" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className="btn btn--solid" type="submit" disabled={status === "submitting"}>
          {settings.subscribeButton}
        </button>
      </div>
      {fieldError && (
        <p id={`${id}-err`} className="subscribe__error" role="alert">
          {fieldError}
        </p>
      )}
      {status === "error" && (
        <p className="subscribe__error" role="alert">
          {settings.subscribeError}
        </p>
      )}
    </form>
  );
}
