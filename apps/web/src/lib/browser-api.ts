import { createExperienceApiClient } from "@niho-experience/api-client";

/** Browser only: availability and guest checkout use this client directly. */
export async function getBrowserApi(preview: boolean, nihoWebOrigin: string) {
  if (!preview) return createExperienceApiClient({ nihoWebOrigin });
  const { createMockExperienceFetch } = await import("@niho-experience/api-client/mock");
  // "all": the server may render either mock catalog; slugs never overlap.
  return createExperienceApiClient({ nihoWebOrigin, fetch: createMockExperienceFetch({ catalog: "all" }) });
}
