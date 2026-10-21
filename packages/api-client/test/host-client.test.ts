import { describe, expect, it, vi } from "vitest";

import { createExperienceHostApiClient, isStripeConnectUrl, type FetchLike } from "../src/host/index.ts";
import { createMockExperienceHostFetch } from "../src/host/mock.ts";

const ORIGIN = "https://niho.life";
const TOKEN = "header.payload.signature";

function respond(status: number, body: unknown): ReturnType<typeof vi.fn<FetchLike>> {
  return vi.fn<FetchLike>(async () => new Response(body === null ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
}

function lastCall(fetchMock: ReturnType<typeof vi.fn<FetchLike>>): [string, RequestInit] {
  return fetchMock.mock.calls.at(-1) as [string, RequestInit];
}

const PROVIDER = {
  id: "cm0provider01",
  ownerUserId: "cm0user01",
  vesselSpotId: "cm0spot01",
  kind: "INDIVIDUAL",
  displayName: "合成の台所",
  bio: "",
  sellerDisclosureUrl: null,
  reviewStatus: "DRAFT",
  consentVersion: "v1",
  consentedAt: "2026-10-01T00:00:00.000Z",
  submittedAt: null,
  approvedAt: null,
  paymentReuseConsentVersion: null,
  paymentReuseConsentedAt: null,
  paymentReuseSourceSpotId: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};
const CONSENT = { version: "v1", text: "同意の文言" };
const LIST = { providers: [{ ...PROVIDER, memberRole: "OWNER" }], platformAdmin: false, consent: CONSENT, paymentReuseConsent: CONSENT };

describe("isStripeConnectUrl", () => {
  it.each([
    ["https://connect.stripe.com/setup/e/acct_x/abc", true],
    ["http://connect.stripe.com/setup/e/acct_x/abc", false],
    ["https://connect.stripe.com.evil.example/setup", false],
    ["https://user:pass@connect.stripe.com/setup", false],
    ["https://connect.stripe.test/setup/x/1#niho-mock-connect", false],
    ["javascript:alert(1)", false],
  ])("%s → %s", (url, expected) => {
    expect(isStripeConnectUrl(url)).toBe(expected);
  });
});

describe("createExperienceHostApiClient", () => {
  it("Bearer を付け、cookie を送らず、リダイレクトに従わず、キャッシュしない", async () => {
    const fetchMock = respond(200, LIST);
    const api = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: fetchMock });
    expect(await api.listExperienceProviders()).toEqual({ ok: true, data: LIST });
    const [url, init] = lastCall(fetchMock);
    expect(url).toBe("https://niho.life/api/experience-providers");
    expect(init).toMatchObject({ method: "GET", credentials: "omit", redirect: "error", cache: "no-store", referrerPolicy: "no-referrer" });
    expect(init.headers).toEqual({ accept: "application/json", authorization: `Bearer ${TOKEN}` });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("本文のある操作は JSON で送り、path の ID を符号化する", async () => {
    const fetchMock = respond(200, { provider: PROVIDER });
    const api = createExperienceHostApiClient({ nihoWebOrigin: `${ORIGIN}/`, idToken: TOKEN, fetch: fetchMock });
    await api.updateExperienceProvider("cm0provider01", { displayName: "新しい名前" });
    const [url, init] = lastCall(fetchMock);
    expect(url).toBe("https://niho.life/api/experience-providers/cm0provider01");
    expect(init.method).toBe("PATCH");
    expect(init.headers).toMatchObject({ "content-type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ displayName: "新しい名前" }));

    await api.submitExperienceProvider("cm0provider01");
    expect(lastCall(fetchMock)[1]).not.toHaveProperty("body");
  });

  it("確かめられない provider ID では NIHO を呼ばない", async () => {
    const fetchMock = respond(200, {});
    const api = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: fetchMock });
    for (const id of ["..", ".", "", "a/b", "x".repeat(201)]) {
      expect(await api.getExperienceProvider(id)).toEqual({ ok: false, kind: "error", status: 404, code: "NOT_FOUND", reason: null, message: "" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("origin と token の規則", () => {
    expect(() => createExperienceHostApiClient({ nihoWebOrigin: "http://niho.life", idToken: TOKEN })).toThrow(/https/);
    expect(() => createExperienceHostApiClient({ nihoWebOrigin: "https://niho.life/api", idToken: TOKEN })).toThrow(/origin/);
    expect(() => createExperienceHostApiClient({ nihoWebOrigin: "http://localhost:3000", idToken: TOKEN })).not.toThrow();
    for (const idToken of ["", "a b", "a\r\nx-evil: 1"]) {
      expect(() => createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken })).toThrow(/idToken/);
    }
  });

  it("NIHO のエラーは status・code・reason で返す", async () => {
    const body = { error: { code: "CONFLICT", message: "処理できませんでした", details: { reason: "PROVIDER_PAYMENT_LOCKED" } } };
    const api = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: respond(409, body) });
    expect(await api.reuseExperienceProviderPayment("cm0provider01", { sourceSpotId: "cm0spot02", consentVersion: "v1" })).toEqual({
      ok: false, kind: "error", status: 409, code: "CONFLICT", reason: "PROVIDER_PAYMENT_LOCKED", message: "処理できませんでした",
    });
    const unauthorized = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: respond(401, { error: { code: "UNAUTHORIZED", message: "認証が必要です", details: {} } }) });
    expect(await unauthorized.getAuthMe()).toMatchObject({ ok: false, kind: "error", status: 401, code: "UNAUTHORIZED", reason: null });
  });

  it("形の違う応答・本文の無いエラーは unexpected_response", async () => {
    const cases: Array<[number, unknown]> = [
      [200, { providers: [{ ...PROVIDER, memberRole: "ADMIN" }], platformAdmin: false, consent: CONSENT, paymentReuseConsent: CONSENT }],
      [200, { providers: [{ ...PROVIDER, kind: "COMPANY", memberRole: null }], platformAdmin: false, consent: CONSENT, paymentReuseConsent: CONSENT }],
      [200, { providers: [], platformAdmin: false, consent: CONSENT }],
      [502, null],
      [404, { error: "not_found" }],
    ];
    for (const [status, body] of cases) {
      const api = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: respond(status, body) });
      expect(await api.listExperienceProviders()).toEqual({ ok: false, kind: "unexpected_response", status });
    }
  });

  it("契約に無い項目は取り出さない（me は表示名と顔写真だけ）", async () => {
    const me = { user: { id: "cm0user01", displayName: "合成 ホスト", handle: "x", email: "someone@example.com" }, userIconImage: null, memberships: [{ spotId: "s" }] };
    const api = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: respond(200, me) });
    expect(await api.getAuthMe()).toEqual({ ok: true, data: { user: { id: "cm0user01", displayName: "合成 ホスト" }, userIconImage: null } });
    const extra = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: respond(200, { ...LIST, providers: [{ ...LIST.providers[0], internalNote: "x" }] }) });
    const result = await extra.listExperienceProviders();
    expect(result.ok && result.data.providers[0]).not.toHaveProperty("internalNote");
  });

  it("接続の URL は https だけを受け取る", async () => {
    const connect = { url: "javascript:alert(1)", expiresAt: null, ready: false, reason: "NOT_CONNECTED" };
    const api = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: respond(200, connect) });
    expect(await api.startExperienceProviderPaymentConnect("cm0provider01")).toEqual({ ok: false, kind: "unexpected_response", status: 200 });
  });

  it("通信の失敗と時間切れは network_error", async () => {
    const failing = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: vi.fn<FetchLike>(async () => { throw new TypeError("fetch failed"); }) });
    expect(await failing.listExperienceProviders()).toEqual({ ok: false, kind: "network_error" });

    const hanging: FetchLike = (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
    const slow = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: hanging, timeoutMs: 20 });
    expect(await slow.getAuthMe()).toEqual({ ok: false, kind: "network_error" });
  });

  it("mock とつないで使える", async () => {
    const api = createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken: TOKEN, fetch: createMockExperienceHostFetch({ scenario: "two-providers" }) });
    const result = await api.listExperienceProviders();
    expect(result.ok && result.data.providers.map((provider) => provider.id)).toEqual(["sample-provider-kitchen", "sample-provider-studio"]);
  });
});
