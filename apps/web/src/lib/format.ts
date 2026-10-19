const TZ = "Asia/Tokyo";
const LOCALE = "en-US";
const yen = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
export const formatYen = (amountYen: number) => yen.format(amountYen);
export const formatDay = (iso: string) => new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
export const formatLongDay = (iso: string) => new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
export const formatTime = (iso: string) => new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
export const formatTimeRange = (startIso: string, endIso: string) => `${formatTime(startIso)} – ${formatTime(endIso)} JST`;
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}
export const jstDateKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
export const pluralize = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
