import { randomBytes } from "node:crypto";
import type { HostMockScenario } from "./session";

/**
 * Synthetic stand-in for NIHO's provider API in mock mode (#86). Invented data
 * only. H2 (#87) replaces it with a mock generated from the agreed contract.
 */
export const MOCK_USER = { id: "sample-user", displayName: "サンプル ホスト", handle: "sample-host", iconImage: null } as const;

const MOCK_PROVIDERS = [
  { id: "sample-provider-kitchen", kind: "INDIVIDUAL", displayName: "サンプルの台所", bio: "合成データの提供者です。", sellerDisclosureUrl: null, reviewStatus: "APPROVED", memberRole: "OWNER" },
  { id: "sample-provider-studio", kind: "BUSINESS", displayName: "サンプル工房", bio: "合成データの提供者です。", sellerDisclosureUrl: null, reviewStatus: "DRAFT", memberRole: "EDITOR" },
] as const;

export const MOCK_ID_TOKEN_PREFIX = "mock-id-token.";

export function mockToken(prefix: string): string {
  return `${prefix}${randomBytes(16).toString("base64url")}`;
}

export function hostMockScenario(value: unknown): HostMockScenario {
  return value === "empty" ? "empty" : "default";
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A fetch for the mock NIHO origin. Requires the synthetic Bearer token so the relay's header handling is exercised. */
export function createMockHostFetch(scenario: HostMockScenario): typeof fetch {
  const providers = scenario === "empty" ? [] : MOCK_PROVIDERS;
  return async (input, init) => {
    const request = new Request(input, init);
    const path = new URL(request.url).pathname;
    if (!request.headers.get("authorization")?.startsWith(`Bearer ${MOCK_ID_TOKEN_PREFIX}`)) return json(401, { error: "unauthorized" });
    if (path === "/api/auth/me" && request.method === "GET") return json(200, { user: MOCK_USER });
    if (path === "/api/experience-providers" && request.method === "GET") return json(200, { providers, platformAdmin: false });
    const detail = /^\/api\/experience-providers\/([^/]+)$/.exec(path);
    if (detail && request.method === "GET") {
      const provider = providers.find((candidate) => candidate.id === decodeURIComponent(detail[1]!));
      return provider ? json(200, { provider, platformAdmin: false }) : json(404, { error: "not_found" });
    }
    if (path.startsWith("/api/experience-providers/") || path === "/api/experience-providers") return json(501, { error: "mock_not_available" });
    return json(404, { error: "not_found" });
  };
}
