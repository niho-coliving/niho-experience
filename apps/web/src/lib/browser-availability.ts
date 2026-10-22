import type { ExperienceApiClient, Occurrence, OfferId } from "@niho-experience/api-client";
import { getBrowserApi } from "./browser-api";

/**
 * Browser-only availability reads for display (next dates, list filtering).
 * Requests made at the same moment for the same experience share one fetch (the
 * detail page's booking card and mobile bar both need it); nothing is kept longer
 * than a few seconds because availability is never cached.
 */

export type AvailabilityRead = { ok: true; occurrences: Occurrence[] } | { ok: false };

const SHARE_MS = 5_000;
const inflight = new Map<string, { at: number; promise: Promise<AvailabilityRead> }>();

export async function readAvailabilityFromApi(api: ExperienceApiClient, slug: string, locale: "en" | "ja", releaseId: string | null, offerId?: OfferId): Promise<Occurrence[] | null> {
  if (locale === "ja") {
    const result = await api.getJapaneseAvailability(slug, offerId ? { offerId } : {});
    return result.ok && result.data.releaseId === releaseId ? result.data.occurrences : null;
  }
  const result = await api.getAvailability(slug, offerId ? { offerId } : {});
  return result.ok ? result.data.occurrences : null;
}

export function readAvailability(slug: string, preview: boolean, nihoWebOrigin: string, locale: "en" | "ja" = "en", releaseId: string | null = null): Promise<AvailabilityRead> {
  const key = `${preview ? "mock" : "http"}|${nihoWebOrigin}|${locale}|${releaseId ?? ""}|${slug}`;
  const now = Date.now();
  const shared = inflight.get(key);
  if (shared && now - shared.at < SHARE_MS) return shared.promise;
  const promise = getBrowserApi(preview, nihoWebOrigin)
    .then((api) => readAvailabilityFromApi(api, slug, locale, releaseId))
    .then((occurrences): AvailabilityRead => occurrences ? { ok: true, occurrences } : { ok: false })
    .catch((): AvailabilityRead => ({ ok: false }));
  inflight.set(key, { at: now, promise });
  // Share concurrent failures, but let an explicit retry reach the API immediately.
  void promise.then((result) => {
    if (!result.ok && inflight.get(key)?.promise === promise) inflight.delete(key);
  });
  return promise;
}
