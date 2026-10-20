import "server-only";
import type { ExperienceApiClient, ExperienceDetail, ExperienceSummary } from "@niho-experience/api-client";

/**
 * Reads the public detail of every listed experience in parallel, for card data the
 * summary does not carry (hosts, weekdays, capacity). In HTTP mode these reads use the
 * client's shared 60-second cache (lib/api.ts). A failed read is left out of the map so
 * the caller can still render that card from its summary.
 */
export async function loadDetails(api: ExperienceApiClient, summaries: ExperienceSummary[]): Promise<Map<string, ExperienceDetail>> {
  const results = await Promise.all(
    summaries.map(async (summary) => {
      try {
        const result = await api.getExperience(summary.slug);
        return result.ok ? result.data.experience : null;
      } catch {
        return null;
      }
    }),
  );
  const details = new Map<string, ExperienceDetail>();
  for (const detail of results) if (detail) details.set(detail.slug, detail);
  return details;
}
