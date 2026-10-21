import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HostProvider } from "@/lib/host/providers";

/** The console's data entry point against the synthetic NIHO (mock) and a stubbed one (http). */
const state = vi.hoisted(() => ({
  config: { apiMode: "mock" as "mock" | "http", nihoWebOrigin: "https://niho.example.test" },
  httpFetch: (async () => new Response(null, { status: 500 })) as typeof fetch,
  providers: [] as HostProvider[],
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/config", () => ({ config: state.config, isPreview: true }));
vi.mock("@/lib/host/server", async () => {
  const { createMockHostFetch } = await import("@/lib/host/mock-niho");
  const now = Date.now();
  const session = { refreshToken: "r", idToken: "mock-id-token.data-test", idTokenExpiresAt: now + 3_600_000, connectionId: "c", connectionExpiresAt: now + 86_400_000, expiresAt: now + 86_400_000, displayName: "サンプル ホスト", iconUrl: null };
  return {
    isHostMock: () => state.config.apiMode === "mock",
    readHostSession: async () => session,
    loadHostProviders: async () => ({ status: "ok", providers: state.providers }),
    nihoApiFetch: () => (state.config.apiMode === "mock" ? createMockHostFetch("default") : state.httpFetch),
  };
});

import { hostPageContext, loadHostConsoleData } from "./data";

const KITCHEN: HostProvider = { id: "sample-provider-kitchen", displayName: "サンプルの台所", role: "OWNER" };
const STUDIO: HostProvider = { id: "sample-provider-studio", displayName: "サンプル工房", role: "EDITOR" };

beforeEach(() => {
  state.config.apiMode = "mock";
  state.providers = [KITCHEN, STUDIO];
});

describe("loadHostConsoleData", () => {
  it("mock: the synthetic provider detail and the kitchen's preview data", async () => {
    const data = await loadHostConsoleData(KITCHEN);
    expect(data.settings).toEqual({
      displayName: "サンプルの台所",
      kind: "INDIVIDUAL",
      bio: "合成データの提供者です。",
      sellerDisclosureUrl: "",
      reviewStatus: "APPROVED",
      payout: { reason: "READY", label: "サンプルの台所の口座" },
      meetingPoint: expect.objectContaining({ area: "Near Kamakura Station, 5-minute walk" }),
      notificationEmail: "kitchen@example.com",
    });
    expect(data.experiences).toHaveLength(3);
    expect(data.home.todos).toHaveLength(3);
  });

  it("mock: the studio is a business still in draft, with no payout account", async () => {
    const data = await loadHostConsoleData(STUDIO);
    expect(data.settings).toMatchObject({ displayName: "サンプル工房", kind: "BUSINESS", reviewStatus: "DRAFT", payout: { reason: "NOT_CONNECTED", label: null } });
    expect(data.experiences.map((experience) => experience.status)).toEqual(["draft"]);
    expect(data.home.upcoming).toEqual([]);
  });

  it("http: reads the provider detail from NIHO with the session's token and shows nothing else yet", async () => {
    state.config.apiMode = "http";
    const calls: { url: string; authorization: string | null }[] = [];
    state.httpFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), authorization: new Headers(init?.headers).get("authorization") });
      return Response.json({ provider: { id: KITCHEN.id, displayName: "合成の台所", memberRole: "OWNER", kind: "BUSINESS", bio: "合成の紹介", sellerDisclosureUrl: "https://seller.example.com/", reviewStatus: "REQUESTED" } });
    }) as typeof fetch;
    const data = await loadHostConsoleData(KITCHEN);
    expect(calls).toEqual([{ url: "https://niho.example.test/api/experience-providers/sample-provider-kitchen", authorization: "Bearer mock-id-token.data-test" }]);
    expect(data.settings).toEqual({
      displayName: "合成の台所",
      kind: "BUSINESS",
      bio: "合成の紹介",
      sellerDisclosureUrl: "https://seller.example.com/",
      reviewStatus: "REQUESTED",
      payout: null,
      meetingPoint: { area: "", mapUrl: "", entrance: "" },
      notificationEmail: "",
    });
    expect(data.experiences).toEqual([]);
    expect(data.home).toEqual({ todos: [], upcoming: [], month: null });
  });

  it("http: falls back to the list's name when the detail cannot be read", async () => {
    state.config.apiMode = "http";
    state.httpFetch = (async () => new Response("unavailable", { status: 503 })) as typeof fetch;
    expect((await loadHostConsoleData(KITCHEN)).settings).toMatchObject({ displayName: "サンプルの台所", kind: null, bio: "", sellerDisclosureUrl: "", reviewStatus: null });
    // A detail for another provider is not taken for this one.
    state.httpFetch = (async () => Response.json({ provider: { id: "someone-else", displayName: "別の提供者", kind: "BUSINESS" } })) as typeof fetch;
    expect((await loadHostConsoleData(KITCHEN)).settings).toMatchObject({ displayName: "サンプルの台所", kind: null });
  });
});

describe("hostPageContext", () => {
  it("opens the provider named in ?providerId= and carries it on links", async () => {
    expect(await hostPageContext({ providerId: STUDIO.id })).toMatchObject({ provider: STUDIO, providerNotFound: false, linkProviderId: STUDIO.id });
    expect(await hostPageContext({})).toMatchObject({ provider: KITCHEN, providerNotFound: false, linkProviderId: null });
  });

  it("falls back to the first provider, and says so, for ids this account cannot open", async () => {
    expect(await hostPageContext({ providerId: "someone-else" })).toMatchObject({ provider: KITCHEN, providerNotFound: true, linkProviderId: "someone-else" });
    expect(await hostPageContext({ providerId: "../admin" })).toMatchObject({ provider: KITCHEN, providerNotFound: true, linkProviderId: null });
    expect(await hostPageContext({ providerId: [STUDIO.id, KITCHEN.id] })).toMatchObject({ provider: KITCHEN, providerNotFound: false, linkProviderId: null });
  });

  it("has no provider for an account that has not registered one", async () => {
    state.providers = [];
    expect(await hostPageContext({ providerId: STUDIO.id })).toMatchObject({ provider: null, providers: [] });
  });
});
