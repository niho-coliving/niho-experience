import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HostProvider } from "@/lib/host/providers";

/** The console's data entry point against the contract mock (mock) and a stubbed NIHO (http). */
const state = vi.hoisted(() => ({
  config: { apiMode: "mock" as "mock" | "http", nihoWebOrigin: "https://niho.example.test" },
  providers: [] as HostProvider[],
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/config", () => ({ config: state.config, isPreview: true }));
// The real hostApiClient (typed client + contract mock, or the global fetch in http mode); only the session and the list are stubbed.
vi.mock("@/lib/host/server", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/host/server")>();
  const now = Date.now();
  const session = { refreshToken: "r", idToken: "mock-id-token.data-test", idTokenExpiresAt: now + 3_600_000, connectionId: "c", connectionExpiresAt: now + 86_400_000, expiresAt: now + 86_400_000, displayName: "サンプル ホスト", iconUrl: null };
  return {
    ...actual,
    readHostSession: async () => session,
    loadHostProviders: async () => ({ status: "ok", providers: state.providers }),
  };
});

import { hostPageContext, loadHostBookings, loadHostConsoleData } from "./data";

/** A provider as the host contract shapes it (synthetic values). */
const provider = (fields: Pick<HostProvider, "id" | "displayName" | "memberRole"> & Partial<HostProvider>): HostProvider => ({
  ownerUserId: "sample-user",
  vesselSpotId: `${fields.id}-vessel`,
  kind: "INDIVIDUAL",
  bio: "",
  sellerDisclosureUrl: null,
  reviewStatus: "DRAFT",
  consentVersion: "sample-provider-consent-1",
  consentedAt: "2026-10-01T00:00:00.000Z",
  submittedAt: null,
  approvedAt: null,
  paymentReuseConsentVersion: null,
  paymentReuseConsentedAt: null,
  paymentReuseSourceSpotId: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...fields,
});

const KITCHEN = provider({ id: "sample-provider-kitchen", displayName: "サンプルの台所", memberRole: "OWNER", reviewStatus: "APPROVED" });
const STUDIO = provider({ id: "sample-provider-studio", displayName: "サンプル工房", memberRole: "EDITOR", kind: "BUSINESS" });

const consent = { version: "sample-provider-consent-1", text: "合成の同意文" };
const detailBody = (detail: HostProvider) => ({ provider: detail, platformAdmin: false, consent, paymentReuseConsent: consent });

/** http mode: NIHO is the global fetch, recorded here. */
function stubNiho(respond: () => Response) {
  const calls: { url: string; authorization: string | null }[] = [];
  vi.stubGlobal("fetch", (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), authorization: new Headers(init?.headers).get("authorization") });
    return respond();
  }) as typeof fetch);
  return calls;
}

beforeEach(() => {
  state.config.apiMode = "mock";
  state.providers = [KITCHEN, STUDIO];
});
afterEach(() => vi.unstubAllGlobals());

describe("loadHostConsoleData", () => {
  it("mock: the contract mock's provider detail and the kitchen's preview data", async () => {
    const data = await loadHostConsoleData(KITCHEN);
    expect(data.settings).toEqual({
      displayName: "サンプルの台所",
      kind: "INDIVIDUAL",
      bio: "家庭料理を一緒に作る体験の、合成データの提供者です（sample）。",
      sellerDisclosureUrl: "https://example.com/sample-kitchen/legal",
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
    const detail = provider({ id: KITCHEN.id, displayName: "合成の台所", memberRole: "OWNER", kind: "BUSINESS", bio: "合成の紹介", sellerDisclosureUrl: "https://seller.example.com/", reviewStatus: "REQUESTED" });
    const calls = stubNiho(() => Response.json(detailBody(detail)));
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

  it("http: falls back to the list's provider when the detail cannot be read", async () => {
    state.config.apiMode = "http";
    const fromList = { displayName: "サンプルの台所", kind: "INDIVIDUAL", bio: "", sellerDisclosureUrl: "", reviewStatus: "APPROVED" };
    stubNiho(() => new Response("unavailable", { status: 503 }));
    expect((await loadHostConsoleData(KITCHEN)).settings).toMatchObject(fromList);
    // A body outside the contract is not read.
    stubNiho(() => Response.json({ provider: { id: KITCHEN.id, displayName: "形の違う提供者" }, platformAdmin: false }));
    expect((await loadHostConsoleData(KITCHEN)).settings).toMatchObject(fromList);
    // A detail for another provider is not taken for this one.
    stubNiho(() => Response.json(detailBody(provider({ id: "someone-else", displayName: "別の提供者", memberRole: "OWNER", kind: "BUSINESS" }))));
    expect((await loadHostConsoleData(KITCHEN)).settings).toMatchObject(fromList);
  });
});

describe("loadHostBookings", () => {
  it("mock: the kitchen's bookings, the one ?booking= names, and the experiences without their pages", async () => {
    const data = await loadHostBookings(KITCHEN, "bk-2041");
    expect([data.today, data.now]).toEqual(["2026-10-21", "2026-10-21T15:30"]);
    expect(data.list.status === "ready" && data.list.bookings).toHaveLength(10);
    expect(data.requested).toMatchObject({ status: "ready", booking: { id: "bk-2041", guest: "Lucas & Mia Chen" } });
    expect(data.experiences[0]).toEqual({
      id: "community-dinner",
      title: "Kamakura Community Dinner with Locals",
      offers: [
        { id: "offer-dinner", capacity: 8, durationMinutes: 120 },
        { id: "offer-tea", capacity: 8, durationMinutes: 120 },
      ],
    });
    expect((await loadHostBookings(KITCHEN, null)).requested).toBeNull();
    // The studio has no bookings, and the kitchen's are not its own.
    const studio = await loadHostBookings(STUDIO, "bk-2041");
    expect([studio.list, studio.requested]).toEqual([{ status: "ready", bookings: [] }, { status: "missing" }]);
  });

  it("http: nothing to read until the provider API has bookings (#87)", async () => {
    state.config.apiMode = "http";
    const calls = stubNiho(() => new Response("unexpected", { status: 500 }));
    const data = await loadHostBookings(KITCHEN, "bk-2041");
    expect([data.list, data.requested, data.now]).toEqual([{ status: "unavailable" }, { status: "unavailable" }, null]);
    expect(calls).toEqual([]);
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
