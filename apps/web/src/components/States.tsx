import Link from "next/link";
import type { ApiErrorCode } from "@niho-experience/api-client";
import { ButtonLink, buttonClass } from "./ui";

/** Full-width failure state with a way forward. Safe in client and server components. */
export function ErrorState({
  title = "We couldn't load this page",
  message = "The connection to our booking service failed. Nothing has been booked or charged.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="container-page max-w-2xl py-16 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 text-3xl">{title}</h1>
      <p className="mt-4 text-ink-soft">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {onRetry ? (
          <button type="button" onClick={onRetry} className={buttonClass("primary")}>
            Try again
          </button>
        ) : null}
        <Link href="/experiences" className={buttonClass(onRetry ? "secondary" : "primary")}>
          See all experiences
        </Link>
      </div>
    </div>
  );
}

export function EmptyResults({ clearHref }: { clearHref: string | null }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <h2 className="text-2xl">{clearHref ? "Nothing matches these filters" : "No experiences are listed right now"}</h2>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        {clearHref
          ? "Try another date or theme. We only list a few experiences at a time, so each one gets real attention."
          : "New experiences are being prepared with local hosts. Please check back soon."}
      </p>
      {clearHref ? (
        <div className="mt-6 flex justify-center">
          <ButtonLink href={clearHref}>Clear filters</ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

export interface ProblemCopy {
  title: string;
  body: string;
  tone: "warn" | "danger";
}

/** Guest-facing copy for API errors. Describes the state and the next step, never internals. */
export const problemCopy: Record<ApiErrorCode, ProblemCopy> = {
  EXPERIENCE_NOT_FOUND: { tone: "warn", title: "This experience is no longer listed", body: "It may have ended. Have a look at what else is on." },
  EXPERIENCE_PAUSED: { tone: "warn", title: "Bookings are paused", body: "This experience isn't taking bookings right now. Nothing has been charged." },
  SLOT_NOT_FOUND: { tone: "warn", title: "That date is no longer available", body: "Please pick another date." },
  SLOT_SOLD_OUT: { tone: "warn", title: "This time just filled up", body: "Someone booked the last places a moment ago. Nothing has been charged. Please choose another date." },
  SLOT_CLOSED: { tone: "warn", title: "Booking has closed for this time", body: "Bookings close shortly before the start so the host can prepare. Please choose another date." },
  GUESTS_OUT_OF_RANGE: { tone: "warn", title: "That group size isn't available", body: "Please change the number of guests for this date." },
  PRICE_CHANGED: { tone: "warn", title: "The price has changed", body: "The total for this date was updated. Please review the new total before you continue." },
  TERMS_CHANGED: { tone: "warn", title: "The booking terms were updated", body: "Please review the updated cancellation terms before you continue." },
  QUOTE_EXPIRED: { tone: "warn", title: "Your held price expired", body: "We hold a price for a short time. Review the current total to continue." },
  INVALID_CONTACT: { tone: "danger", title: "Please check your details", body: "Some fields need attention." },
  RATE_LIMITED: { tone: "danger", title: "Too many attempts", body: "Please wait a minute and try again. Nothing has been charged." },
  UNAVAILABLE: { tone: "danger", title: "We couldn't reach the booking service", body: "Nothing has been charged. Your details are still here, so you can try again." },
};

/** Shown when the site's booking switch is off during an incident (#15). */
export const bookingsPausedCopy: ProblemCopy = {
  tone: "warn",
  title: "Online booking is paused for now",
  body: "We've paused new bookings for a short time. Bookings you already made are not affected and nothing new has been charged. Please try again later.",
};

/** What the guest can do next for each error. */
export type ProblemAction = "choose_date" | "review_total" | "retry" | "browse";

export const problemAction: Record<ApiErrorCode, ProblemAction> = {
  EXPERIENCE_NOT_FOUND: "browse",
  EXPERIENCE_PAUSED: "browse",
  SLOT_NOT_FOUND: "choose_date",
  SLOT_SOLD_OUT: "choose_date",
  SLOT_CLOSED: "choose_date",
  GUESTS_OUT_OF_RANGE: "choose_date",
  PRICE_CHANGED: "review_total",
  TERMS_CHANGED: "review_total",
  QUOTE_EXPIRED: "review_total",
  INVALID_CONTACT: "retry",
  RATE_LIMITED: "retry",
  UNAVAILABLE: "retry",
};
