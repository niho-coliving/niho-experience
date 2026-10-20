import { parseGuestsParam } from "./date-filter";
import { normalizeExperienceDate, normalizeExperienceQuery, normalizeExperienceTheme, type SearchParams } from "./filters";

/** Public browsing preferences only. Contact details, tokens and return URLs are never forwarded. */
export function readBrowseContext(query: SearchParams) {
  return {
    q: normalizeExperienceQuery(query.q) || undefined,
    theme: normalizeExperienceTheme(query.theme),
    date: normalizeExperienceDate(query.date),
    guests: parseGuestsParam(query.guests) ?? undefined,
  };
}

export type BrowseContext = ReturnType<typeof readBrowseContext>;

export function browseHref(path: string, context: Partial<BrowseContext>, offerId?: string): string {
  const params = new URLSearchParams();
  for (const key of ["q", "theme", "date", "guests"] as const) {
    const value = context[key];
    if (value !== undefined) params.set(key, String(value));
  }
  if (offerId) params.set("offer", offerId);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
