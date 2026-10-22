import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { createExperienceApiClient } from "@niho-experience/api-client";
import { buildFixtureExperiences, createMockExperienceFetch } from "@niho-experience/api-client/mock";

const state = vi.hoisted(() => ({ refresh: undefined as undefined | (() => Promise<void>) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/SiteLocale", async () => {
  const { EN_STATIC_COPY_V1 } = await import("@niho/experience-presentation/v1");
  return { useSiteLocale: () => ({ locale: "ja", releaseId: "old-release" }), useSiteCopy: () => EN_STATIC_COPY_V1 };
});
vi.mock("@niho/experience-presentation/v1", async (original) => ({
  ...await original<typeof import("@niho/experience-presentation/v1")>(),
  BookingCheckoutViewV1: ({ callbacks }: { callbacks: { onRefresh: () => Promise<void> } }) => { state.refresh = callbacks.onRefresh; return null; },
}));

import { BookingForm } from "./BookingForm";

afterEach(() => vi.unstubAllGlobals());

it("reloads the Japanese shell, copy, and terms together when refreshing a stale booking", async () => {
  const reload = vi.fn();
  vi.stubGlobal("window", { location: { reload } });
  const api = createExperienceApiClient({ nihoWebOrigin: "https://niho.example", fetch: createMockExperienceFetch() });
  const readDetail = vi.spyOn(api, "getJapaneseExperience");
  const experience = buildFixtureExperiences()[0]!;
  const offer = experience.offers[0]!;
  const refreshExperience = vi.fn();
  renderToStaticMarkup(createElement(BookingForm, {
    api, apiUnavailable: false, experience, offer, selection: { offerId: offer.id, date: "2026-11-01", adultCount: 1, childCount: 0 },
    preview: false, attributionEnabled: false, publicApiVersion: "1.2", onExperienceRefresh: refreshExperience,
    draft: { guestName: "", guestEmail: "", note: "", answerSets: {} }, onDraftChange: vi.fn(), attemptRef: { current: null }, onBack: vi.fn(),
  }));
  expect(state.refresh).toBeDefined();
  await state.refresh!();
  expect(reload).toHaveBeenCalledOnce();
  expect(readDetail).not.toHaveBeenCalled();
  expect(refreshExperience).not.toHaveBeenCalled();
});
