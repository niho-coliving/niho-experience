import "server-only";
import { createExperienceApiClient } from "@niho-experience/api-client";
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
