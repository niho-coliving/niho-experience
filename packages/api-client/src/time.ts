const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar parts of an instant in Japan Standard Time (no DST). */
export function jstParts(instant: Date) {
  const shifted = new Date(instant.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/** YYYY-MM-DD of the instant in JST. */
export function jstDate(instant: Date): string {
  const p = jstParts(instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Instant for a JST wall-clock time. */
export function fromJst(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - JST_OFFSET_MS);
}

/** ISO 8601 string with the +09:00 offset, as the contract expects. */
export function toJstIso(instant: Date): string {
  const p = jstParts(instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:00+09:00`;
}
