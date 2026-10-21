import type { Occurrence } from "@niho-experience/api-client";
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

export function readAvailability(slug: string, preview: boolean, nihoWebOrigin: string): Promise<AvailabilityRead> {
  const key = `${preview ? "mock" : "http"}|${nihoWebOrigin}|${slug}`;
  const now = Date.now();
  const shared = inflight.get(key);
  if (shared && now - shared.at < SHARE_MS) return shared.promise;
  const promise = getBrowserApi(preview, nihoWebOrigin)
    .then((api) => api.getAvailability(slug))
    .then((result): AvailabilityRead => (result.ok ? { ok: true, occurrences: result.data.occurrences } : { ok: false }))
    .catch((): AvailabilityRead => ({ ok: false }));
  inflight.set(key, { at: now, promise });
  // Share concurrent failures, but let an explicit retry reach the API immediately.
  void promise.then((result) => {
    if (!result.ok && inflight.get(key)?.promise === promise) inflight.delete(key);
  });
  return promise;
}
