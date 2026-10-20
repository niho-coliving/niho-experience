import type { ExperienceSummary } from "@niho-experience/api-client";

/** Public listing query parameters only. Booking input never travels in the URL. */
export type SearchParams = Record<string, string | string[] | undefined>;

const MAX_QUERY_LENGTH = 80;

/** Normalize a shareable, public catalog search without forwarding it to the API. */
export function normalizeExperienceQuery(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/gu, " ").slice(0, MAX_QUERY_LENGTH);
}

/** Search only the public summary fields already returned for the listing. */
export function filterExperienceSummaries(items: ExperienceSummary[], query: string): ExperienceSummary[] {
  const terms = normalizeExperienceQuery(query).toLocaleLowerCase("en-US").split(" ").filter(Boolean);
  if (!terms.length) return items;

  return items.filter((item) => {
    const searchable = [item.title, item.lead, item.provider.name, item.region.name].join(" ").toLocaleLowerCase("en-US");
    return terms.every((term) => searchable.includes(term));
  });
}
