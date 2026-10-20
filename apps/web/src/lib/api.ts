import "server-only";
import { createExperienceApiClient, type RegionKey } from "@niho-experience/api-client";
import { config } from "./config";

/** SSR reads only public catalog and detail data. Guest input never reaches this module. */
export async function getApi(searchParams?: Record<string, string | string[] | undefined>) {
  if (config.apiMode === "mock") {
    const { createMockExperienceFetch } = await import("@niho-experience/api-client/mock");
    const requested = typeof searchParams?.mock === "string" ? searchParams.mock : "";
    const scenarios = { empty: "empty-catalog", error: "network-error", slow: "slow", soldout: "sold-out" } as const;
    const scenario = scenarios[requested as keyof typeof scenarios] ?? (config.mockLatencyMs > 0 ? "slow" : "default");
    return createExperienceApiClient({
      nihoWebOrigin: config.nihoWebOrigin,
      fetch: createMockExperienceFetch({ scenario, catalog: config.mockCatalog, slowDelayMs: requested === "slow" ? 1500 : config.mockLatencyMs }),
    });
  }
  return createExperienceApiClient({
    nihoWebOrigin: config.nihoWebOrigin,
    cacheableReadInit: { next: { revalidate: 60 } } as RequestInit,
  });
}

/** Read the catalog version selected for this runtime; v1.1 is opt-in until NIHO deploys it. */
export async function listExperiencesForSite(region?: RegionKey, searchParams?: Record<string, string | string[] | undefined>) {
  const client = await getApi(searchParams);
  return config.publicApiVersion === "1.1"
    ? client.listExperiencesV11(region ? { region } : {})
    : client.listExperiences(region ? { region } : {});
}

/** Read the detail version selected for this runtime; older deployments keep using the v1.0 path. */
export async function getExperienceForSite(slug: string, searchParams?: Record<string, string | string[] | undefined>) {
  const client = await getApi(searchParams);
  return config.publicApiVersion === "1.1" ? client.getExperienceV11(slug) : client.getExperience(slug);
}
