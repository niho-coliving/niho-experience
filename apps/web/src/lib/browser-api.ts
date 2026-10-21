import { createExperienceApiClient } from "@niho-experience/api-client";

const previewAvailabilityFailures = new Set<string>();

/** Browser only: availability and guest checkout use this client directly. */
export async function getBrowserApi(preview: boolean, nihoWebOrigin: string) {
  if (!preview) return createExperienceApiClient({ nihoWebOrigin });
  const { createMockExperienceFetch } = await import("@niho-experience/api-client/mock");
  // Preview-only error states let the booking flow be exercised end to end.
  const requested = new URLSearchParams(window.location.search).get("mock");
  const scenarios = {
    "checkout-full": "checkout-full",
    "checkout-hold-limit": "checkout-hold-limit",
    "checkout-price-changed": "checkout-price-changed",
    "checkout-questions-changed": "checkout-questions-changed",
    "checkout-consent-outdated": "checkout-consent-outdated",
    "checkout-rate-limited": "checkout-rate-limited",
    "checkout-unavailable": "checkout-unavailable",
  } as const;
  const scenario = scenarios[requested as keyof typeof scenarios] ?? "default";
  // "all": the server may render either mock catalog; slugs never overlap.
  const mockFetch = createMockExperienceFetch({ catalog: "all", scenario });
  return createExperienceApiClient({ nihoWebOrigin, fetch: async (input, init) => {
    // Preview-only recovery exercise: fail each availability read once per document.
    const path = new URL(input).pathname;
    if (requested === "availability-retry" && path.endsWith("/availability") && !previewAvailabilityFailures.has(path)) {
      previewAvailabilityFailures.add(path);
      throw new TypeError("Preview availability unavailable");
    }
    return mockFetch(input, init);
  } });
}
