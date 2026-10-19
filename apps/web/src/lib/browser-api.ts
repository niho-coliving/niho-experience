import { createExperienceApiClient } from "@niho-experience/api-client";

/** Browser only: availability and guest checkout use this client directly. */
export async function getBrowserApi(preview: boolean, nihoWebOrigin: string) {
  if (!preview) return createExperienceApiClient({ nihoWebOrigin });
  const { createMockExperienceFetch } = await import("@niho-experience/api-client/mock");
  return createExperienceApiClient({ nihoWebOrigin, fetch: createMockExperienceFetch() });
}
