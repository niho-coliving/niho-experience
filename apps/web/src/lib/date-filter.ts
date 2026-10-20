import type { Occurrence } from "@niho-experience/api-client";
import type { CardOffer } from "./card-model";

/**
 * Date and party-size filtering for the experience list (and the home finder).
 * Dates are Japan dates (JST). The availability itself is read in the browser and
 * only used to decide what to show: seats left are never displayed.
 */

export type DayOption = {
  /** YYYY-MM-DD in JST. */
  key: string;
  weekday: string;
  day: string;
  /** "Sat 24 Oct". */
  label: string;
};

export const MAX_GUESTS = 8;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Today's date in Japan as YYYY-MM-DD. */
export function jstToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function dayOption(key: string): DayOption {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAY_SHORT[date.getUTCDay()]!;
  return { key, weekday, day: String(d), label: `${weekday} ${d} ${MONTH_SHORT[m - 1]}` };
}

/** `count` consecutive JST days from today. */
export function upcomingDays(now: Date, count: number): DayOption[] {
  const [y, m, d] = jstToday(now).split("-").map(Number) as [number, number, number];
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(y, m - 1, d + offset));
    const pad = (value: number) => String(value).padStart(2, "0");
    return dayOption(`${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`);
  });
}

/** A `date` query value is used only when it is one of the offered days. */
export function parseDateParam(value: string | string[] | undefined, allowed: readonly DayOption[]): string | null {
  if (typeof value !== "string" || !DATE_KEY.test(value)) return null;
  return allowed.some((day) => day.key === value) ? value : null;
}

/** `guests` query value: 1–8, otherwise 1. */
export function parseGuestsParam(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^\d{1,2}$/.test(value)) return 1;
  const guests = Number(value);
  return guests >= 1 && guests <= MAX_GUESTS ? guests : 1;
}

/**
 * The first bookable session on `date` that fits the party: seats left and the
 * option's party-size limit both cover `guests`. Options unknown to the card (its
 * detail could not be read) are judged by seats alone. A minimum party size is not
 * checked here: one guest is also the list's "not chosen" state, and cards already
 * show private sessions as "Private · 2–4 guests" (the booking form enforces it).
 */
export function matchingOccurrence(occurrences: readonly Occurrence[], offers: readonly CardOffer[], date: string, guests: number): Occurrence | null {
  const limits = new Map(offers.map((offer) => [offer.id, offer.maxPartySize]));
  return (
    occurrences.find((occurrence) => {
      if (occurrence.date !== date || !occurrence.bookable || occurrence.seatsLeft < guests) return false;
      const limit = limits.get(occurrence.offerId);
      return limit === undefined ? offers.length === 0 : limit >= guests;
    }) ?? null
  );
}

/** With no date chosen, the party size alone narrows the list (some options are small). */
export function fitsPartySize(offers: readonly CardOffer[], guests: number): boolean {
  return offers.length === 0 || offers.some((offer) => offer.maxPartySize >= guests);
}

/** Next bookable sessions (one per date and option), soonest first. */
export function nextBookable(occurrences: readonly Occurrence[], limit: number): Occurrence[] {
  return occurrences
    .filter((occurrence) => occurrence.bookable)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, limit);
}
