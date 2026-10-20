import type { ExperienceOffer } from "@niho-experience/api-client";

/**
 * Display summaries of when an experience runs. Offer weekdays are a summary only
 * (contract: the real dates come from availability), so these never promise a date.
 */

const WEEKDAY_SHORT: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Travelers read a week from Monday; Sunday goes last.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

type ScheduleOffer = Pick<ExperienceOffer, "weekdays" | "startTime">;

/** "18:00" (JST local time) → "6:00 PM". */
export function formatClock(hhmm: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return hhmm;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/** "18:00" + 120 minutes → "20:00" (same JST day or wrapping past midnight). */
export function addMinutesToClock(hhmm: string, minutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return hhmm;
  const total = (Number(match[1]) * 60 + Number(match[2]) + minutes) % (24 * 60);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function sortedWeekdays(offers: ScheduleOffer[]): number[] {
  const days = new Set(offers.flatMap((offer) => offer.weekdays));
  return WEEK_ORDER.filter((day) => days.has(day));
}

function sortedTimes(offers: ScheduleOffer[]): string[] {
  return [...new Set(offers.map((offer) => offer.startTime))].sort().map(formatClock);
}

/** "Tue · Thu · Sat · 6:00 PM" for cards and compact rows. Null when nothing is scheduled. */
export function scheduleSummary(offers: ScheduleOffer[]): string | null {
  const days = sortedWeekdays(offers);
  const times = sortedTimes(offers);
  if (!days.length) return null;
  const dayPart = days.length === 7 ? "Every day" : days.map((day) => WEEKDAY_SHORT[day] ?? "").join(" · ");
  return times.length ? `${dayPart} · ${times.join(" / ")}` : dayPart;
}

/** "Tue, Thu & Sat · 6:00 PM" for the short hand-written line above a heading. */
export function scheduleLine(offers: ScheduleOffer[]): string | null {
  const days = sortedWeekdays(offers);
  const times = sortedTimes(offers);
  if (!days.length) return null;
  const names = days.map((day) => WEEKDAY_SHORT[day] ?? "");
  const dayPart = days.length === 7 ? "Every day" : joinAnd(names);
  return times.length ? `${dayPart} · ${times.join(" & ")}` : dayPart;
}

/** "A", "A & B", "A, B & C". */
export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
}
