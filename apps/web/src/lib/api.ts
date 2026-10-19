import "server-only";
import {
  createHttpExperienceApi,
  withContractValidation,
  type ExperienceApi,
} from "@niho-experience/api-client";
import { createMockExperienceApi, type MockScenario } from "@niho-experience/api-client/mock";
import { config } from "./config";

const SCENARIOS: MockScenario[] = ["empty", "error"];

/**
 * The only way pages reach the API. In mock mode a `?mock=` query lets
 * reviewers see empty, error and slow states; it is ignored otherwise.
 */
export function getApi(searchParams?: Record<string, string | string[] | undefined>): ExperienceApi {
  if (config.apiMode === "http") {
    return withContractValidation(createHttpExperienceApi({ baseUrl: config.apiBaseUrl }));
  }
  const requested = typeof searchParams?.mock === "string" ? searchParams.mock : undefined;
  const scenario = SCENARIOS.find((s) => s === requested) ?? "normal";
  const latencyMs = requested === "slow" ? 1500 : config.mockLatencyMs;
  return withContractValidation(createMockExperienceApi({ scenario, latencyMs }));
}
