"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { startCheckout, type CheckoutState } from "@/app/experiences/[slug]/book/actions";
import { problemAction, problemCopy } from "./States";
import { Notice, buttonClass } from "./ui";

interface Props {
  slug: string;
  quoteId: string;
  policyVersion: string;
  idempotencyKey: string;
  reviewHref: string;
  preview: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  countryOfResidence: "Country of residence",
  note: "Note for your host",
  agree: "Agreement to the cancellation terms",
};

/**
 * Guest contact form. Values live only in component state: they are not put
 * in the URL, browser storage or analytics, and survive a failed attempt.
 */
export function BookingForm({ slug, quoteId, policyVersion, idempotencyKey, reviewHref, preview }: Props) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckout, { status: "idle" });
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", country: "", note: "" });
  const [agreed, setAgreed] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const errorFields = state.status === "error" ? state.fields : [];
  const invalid = (name: string) => errorFields.includes(name);

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  const field = (name: keyof typeof values, label: string, opts: { type?: string; autoComplete?: string; required?: boolean; hint?: string; errorName?: string } = {}) => {
    const errorName = opts.errorName ?? name;
    const inputId = `${id}-${name}`;
    const hintId = opts.hint ? `${inputId}-hint` : undefined;
    const errId = invalid(errorName) ? `${inputId}-error` : undefined;
    return (
      <div>
        <label htmlFor={inputId} className="mb-1 block font-bold">
          {label} {opts.required ? null : <span className="font-normal text-muted">(optional)</span>}
        </label>
        {opts.hint ? (
          <p id={hintId} className="mb-1.5 text-sm text-muted">
            {opts.hint}
          </p>
        ) : null}
        <input
          id={inputId}
          name={name}
          type={opts.type ?? "text"}
          autoComplete={opts.autoComplete}
          required={opts.required}
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
          aria-invalid={invalid(errorName) || undefined}
          aria-describedby={[hintId, errId].filter(Boolean).join(" ") || undefined}
          className={`min-h-12 w-full rounded-xl border bg-surface px-3 text-base ${invalid(errorName) ? "border-danger" : "border-line-strong"}`}
        />
        {errId ? (
          <p id={errId} className="mt-1 text-sm font-bold text-danger">
            Please check your {label.toLowerCase()}.
          </p>
        ) : null}
      </div>
    );
  };

  const problem = state.status === "error" ? state : null;
  const action = problem ? problemAction[problem.code] : null;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="policyVersion" value={policyVersion} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {problem ? (
        <div ref={alertRef} tabIndex={-1} className="outline-none">
          <Notice
            role="alert"
            tone={problemCopy[problem.code].tone}
            title={problemCopy[problem.code].title}
            action={
              action === "choose_date" ? (
                <Link href={`/experiences/${slug}#book`} className={buttonClass("secondary")}>
                  Choose another date
                </Link>
              ) : action === "review_total" ? (
                <a href={reviewHref} className={buttonClass("secondary")}>
                  Review the updated total
                </a>
              ) : action === "browse" ? (
                <Link href="/experiences" className={buttonClass("secondary")}>
                  See other experiences
                </Link>
              ) : null
            }
          >
            <p>{problemCopy[problem.code].body}</p>
            {problem.fields.length ? (
              <ul className="mt-1 list-disc pl-5">
                {problem.fields.map((f) => (
                  <li key={f}>{FIELD_LABELS[f] ?? f}</li>
                ))}
              </ul>
            ) : null}
          </Notice>
        </div>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="mb-1 font-display text-2xl font-semibold">Your details</legend>
        <p className="text-sm text-muted">We share these with your host only for this booking. No account is created.</p>
        {field("fullName", "Full name", { autoComplete: "name", required: true })}
        {field("email", "Email", { type: "email", autoComplete: "email", required: true, hint: "Your confirmation and meeting point are sent here." })}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel", hint: "For same-day contact only. Include your country code." })}
        {field("country", "Country of residence", { autoComplete: "country-name", errorName: "countryOfResidence" })}
        <div>
          <label htmlFor={`${id}-note`} className="mb-1 block font-bold">
            Note for your host <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id={`${id}-note`}
            name="note"
            rows={3}
            maxLength={500}
            value={values.note}
            onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
            placeholder="Allergies, dietary needs, or anything that helps your host prepare"
            className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base"
          />
        </div>
      </fieldset>

      <div className={`rounded-xl border p-4 ${invalid("agree") ? "border-danger bg-danger-pale" : "border-line bg-sand"}`}>
        <label className="flex cursor-pointer gap-3">
          <input
            type="checkbox"
            name="agree"
            value="yes"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={invalid("agree") || undefined}
            className="mt-1 size-5 shrink-0 accent-moss"
          />
          <span>
            I have checked the date, total and seller, and I agree to the{" "}
            <a href="#terms" className="font-bold text-moss underline">
              cancellation and weather terms
            </a>
            .
          </span>
        </label>
      </div>

      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary", "w-full text-lg")}>
        {pending ? "Preparing secure payment…" : preview ? "Continue to mock payment" : "Continue to secure payment"}
      </button>
      <p className="text-center text-sm text-muted">
        {preview
          ? "Preview: the next page imitates payment. No card details are asked for and nothing is charged."
          : "You'll pay on Stripe's secure page. Your booking is confirmed by email once the payment completes."}
      </p>
    </form>
  );
}
