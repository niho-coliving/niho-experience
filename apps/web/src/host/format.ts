import type { HostExperience } from "./types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function parts(date: string): { year: number; month: number; day: number } {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return { year, month, day };
}

/** Weekday of a calendar date (YYYY-MM-DD). The date is already in JST, so no time zone math. */
export function weekdayJa(date: string): string {
  const { year, month, day } = parts(date);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]!;
}

/** "10月22日（木）" */
export function dateWithWeekdayJa(date: string): string {
  const { month, day } = parts(date);
  return `${month}月${day}日（${weekdayJa(date)}）`;
}

/** "10月19日" */
export function monthDayJa(date: string): string {
  const { month, day } = parts(date);
  return `${month}月${day}日`;
}

/** "2026年10月12日" */
export function fullDateJa(date: string): string {
  const { year, month, day } = parts(date);
  return `${year}年${month}月${day}日`;
}

export function dayOfMonth(date: string): number {
  return parts(date).day;
}

/** Today's date in Japan (YYYY-MM-DD): bookings and sales are kept in JST. */
export function todayInJapan(now: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}

/** "¥60,000" / "−¥60,000" (a real minus sign, as in the design). */
export function yen(amount: number): string {
  return `${amount < 0 ? "−" : ""}¥${Math.abs(amount).toLocaleString("ja-JP")}`;
}

/** 120 → "2時間", 90 → "1時間30分", 45 → "45分". */
export function durationJa(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}分`;
  return rest ? `${hours}時間${rest}分` : `${hours}時間`;
}

/** "表紙写真と料金" / "A、B、C" */
export function listJa(items: readonly string[]): string {
  return items.length === 2 ? `${items[0]}と${items[1]}` : items.join("、");
}

/** The line under an experience title: "火・木・土 18:00 · 2時間 · 定員8 · ¥30,000〜", or what a draft still needs. */
export function experienceMeta(experience: Pick<HostExperience, "schedule" | "missing">): string {
  if (experience.missing.length > 0) return `${experience.missing.join("・")}が未入力`;
  const schedule = experience.schedule;
  if (!schedule) return "日程と料金が未入力";
  return [`${schedule.weekdays.join("・")} ${schedule.start}`, durationJa(schedule.durationMinutes), `定員${schedule.capacity}`, `${yen(schedule.priceFromYen)}〜`].join(" · ");
}
