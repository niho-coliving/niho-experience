import type { Money, PriceUnit } from "@niho-experience/api-client";

const TZ = "Asia/Tokyo";
const LOCALE = "en-US";

const yen = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

/** "¥6,800" */
export const formatYen = (money: Money) => yen.format(money.amount);

export const unitLabel = (unit: PriceUnit) => (unit === "per_person" ? "per person" : "per group");

/** "Fri, Oct 23" */
export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));

/** "Friday, October 23, 2026" */
export const formatLongDay = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );

/** "6:00 PM" */
export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/** "6:00 PM – 8:30 PM JST" */
export const formatTimeRange = (startIso: string, endIso: string) => `${formatTime(startIso)} – ${formatTime(endIso)} JST`;

/** "2 hr 30 min" */
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

const languageNames = new Intl.DisplayNames([LOCALE], { type: "language" });
/** ["en","ja"] → "English, Japanese" */
export const formatLanguages = (codes: string[]) => codes.map((c) => languageNames.of(c) ?? c).join(", ");

/** JST calendar date (YYYY-MM-DD) of an ISO instant, for grouping slots. */
export const jstDateKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export const pluralize = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
