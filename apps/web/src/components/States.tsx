"use client";
import Link from "next/link";
import type { CheckoutErrorCode } from "@niho-experience/api-client";
import { ButtonLink, buttonClass } from "./ui";

export function ErrorState({ title = "We couldn't load this page", message = "The connection to our booking service failed. Nothing has been booked or charged.", onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return <div role="alert" className="container-page max-w-2xl py-16 text-center"><p className="eyebrow">Something went wrong</p><h1 className="mt-2 text-3xl">{title}</h1><p className="mt-4 text-ink-soft">{message}</p><div className="mt-8 flex flex-wrap justify-center gap-3">{onRetry ? <button type="button" onClick={onRetry} className={buttonClass("primary")}>Try again</button> : null}<Link href="/experiences" className={buttonClass(onRetry ? "secondary" : "primary")}>See all experiences</Link></div></div>;
}
export function EmptyResults({ clearHref, searchActive = false }: { clearHref: string | null; searchActive?: boolean }) {
  const title = searchActive ? "No experiences match your search" : clearHref ? "Nothing matches these filters" : "No experiences are listed right now";
  const message = searchActive ? "Try a different word or clear your search to see all experiences." : "Please check back soon for more experiences.";
  const clearLabel = searchActive ? "Clear search" : "Clear filters";
  return <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface px-6 py-12 text-center"><h2 className="text-2xl">{title}</h2><p className="mx-auto mt-3 max-w-md text-ink-soft">{message}</p>{clearHref ? <div className="mt-6 flex justify-center"><ButtonLink href={clearHref}>{clearLabel}</ButtonLink></div> : null}</div>;
}
export const checkoutErrorCopy: Record<CheckoutErrorCode, string> = {
  VALIDATION_ERROR: "Please review your details and try again.", INPUT_INVALID: "Please check the highlighted details.", ANSWERS_INVALID: "Please check your answers.", CONSENT_OUTDATED: "The booking terms changed. Return to the experience and review them.", OCCURRENCE_INVALID: "This date is no longer available. Choose another date.", UNAVAILABLE: "Bookings are paused. Nothing has been charged.", FULL: "This date just filled up. Choose another date.", HOLD_LIMIT: "Too many places are being held. Please try a different date.", REQUEST_MISMATCH: "Please review your booking and try again.", QUESTIONS_CHANGED: "The booking questions changed. Return to the experience and review them.", PRICE_CHANGED: "The price changed. Return to the experience and review the total.", RATE_LIMITED: "Too many attempts. Please wait before trying again.", CHECKOUT_UNAVAILABLE: "We couldn't reach checkout. Your details are still here; please try again.",
};
