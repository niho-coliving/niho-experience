import { createExperienceApiClient } from "@niho-experience/api-client";

/** Browser only: availability and guest checkout use this client directly. */
export async function getBrowserApi(preview: boolean, nihoWebOrigin: string) {
  if (!preview) return createExperienceApiClient({ nihoWebOrigin });
  const { createMockExperienceFetch } = await import("@niho-experience/api-client/mock");
  // Preview-only error states let the booking flow be exercised end to end.
  const requested = new URLSearchParams(window.location.search).get("mock");
  const scenarios = {
    "checkout-full": "checkout-full",
    "checkout-price-changed": "checkout-price-changed",
    "checkout-consent-outdated": "checkout-consent-outdated",
    "checkout-unavailable": "checkout-unavailable",
  } as const;
  const scenario = scenarios[requested as keyof typeof scenarios] ?? "default";
  // "all": the server may render either mock catalog; slugs never overlap.
  return createExperienceApiClient({ nihoWebOrigin, fetch: createMockExperienceFetch({ catalog: "all", scenario }) });
}
