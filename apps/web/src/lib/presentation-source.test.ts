import { afterEach, describe, expect, it, vi } from "vitest";
import { createExperienceApiClient } from "@niho-experience/api-client";
import { createMockExperienceFetch } from "@niho-experience/api-client/mock";
import { ResponseBodyTooLarge } from "./read-bounded-json";

vi.mock("server-only", () => ({}));
vi.mock("./config", () => ({ config: { presentationSourceDisplayEnabled: true, nihoWebOrigin: "https://niho.example" } }));

import { getPresentationSource, parsePresentationSourceExperience } from "./presentation-source";

afterEach(() => vi.unstubAllGlobals());

async function sourceFixture() {
  const api = createExperienceApiClient({ nihoWebOrigin: "https://niho.example", fetch: createMockExperienceFetch() });
  const catalog = await api.listExperiencesV11();
  if (!catalog.ok) throw new Error("synthetic catalog failed");
  const summary = catalog.data.experiences[0]!;
  const [detail, availability] = await Promise.all([api.getExperienceV11(summary.slug), api.getAvailability(summary.slug)]);
  if (!detail.ok || !availability.ok) throw new Error("synthetic detail failed");
  return { listingId: "synthetic-listing", campaignPageId: "synthetic-page", summary, detail: detail.data.experience, occurrences: availability.data.occurrences };
}

describe("presentation source boundary", () => {
  it("accepts the synthetic public DTOs using the curated contract", async () => {
    const fixture = await sourceFixture();
    expect(parsePresentationSourceExperience(fixture).detail.description).toBe(fixture.detail.description);
  });

  it("rejects a detail missing any required field before rendering it", async () => {
    const fixture = await sourceFixture();
    for (const field of Object.keys(fixture.detail)) {
      const changed = structuredClone(fixture);
      delete (changed.detail as unknown as Record<string, unknown>)[field];
      expect(() => parsePresentationSourceExperience(changed), field).toThrow("Invalid presentation experience");
    }
  });

  it("rejects malformed nested business fields and incomplete occurrences", async () => {
    const fixture = await sourceFixture();
    const detail = structuredClone(fixture);
    (detail.detail.offers[0] as unknown as Record<string, unknown>).pricing = {};
    expect(() => parsePresentationSourceExperience(detail)).toThrow("Invalid presentation experience");
    const summary = structuredClone(fixture);
    (summary.summary.provider as unknown as Record<string, unknown>).name = null;
    expect(() => parsePresentationSourceExperience(summary)).toThrow("Invalid presentation experience");
    const occurrence = structuredClone(fixture);
    delete (occurrence.occurrences[0] as unknown as Record<string, unknown>).startAt;
    expect(() => parsePresentationSourceExperience(occurrence)).toThrow("Invalid presentation experience");
  });

  it("cancels a chunked response as soon as the 5 MiB cap is exceeded", async () => {
    let chunks = 0;
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) { chunks += 1; controller.enqueue(new Uint8Array(1024 * 1024)); },
      cancel,
    }, { highWaterMark: 0 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream, { headers: { "content-type": "application/json" } })));
    await expect(getPresentationSource()).rejects.toBeInstanceOf(ResponseBodyTooLarge);
    expect(chunks).toBe(6);
    expect(cancel).toHaveBeenCalledOnce();
  });
});
