import type { CatalogQuery } from "@niho-experience/api-client";

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const SLUG = /^[a-z0-9-]{1,40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads list filters from the URL, dropping anything malformed instead of failing. */
export function parseFilters(params: SearchParams): CatalogQuery {
  const theme = first(params.theme);
  const date = first(params.date);
  return {
    ...(theme && SLUG.test(theme) ? { theme } : {}),
    ...(date && DATE.test(date) && !Number.isNaN(Date.parse(date)) ? { date } : {}),
  };
}

/** Builds a shareable /experiences URL. `null` removes a filter. */
export function filtersHref(current: CatalogQuery, change: Partial<Record<keyof CatalogQuery, string | null>> = {}) {
  const next = new URLSearchParams();
  const merged = { ...current, ...change };
  if (merged.theme) next.set("theme", merged.theme);
  if (merged.date) next.set("date", merged.date);
  const qs = next.toString();
  return qs ? `/experiences?${qs}` : "/experiences";
}

export const hasFilters = (q: CatalogQuery) => Boolean(q.theme || q.date);
