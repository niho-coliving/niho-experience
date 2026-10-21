import { afterEach, describe, expect, it } from "vitest";

import { createExperienceHostApiClient, type ExperienceHostApiResult, type FetchLike } from "../src/host/index.ts";
import {
  createMockExperienceHostFetch,
  isMockConnectUrl,
  MOCK_HOST_SCENARIOS,
  MOCK_HOST_USER,
  MOCK_PAYMENT_REUSE_CONSENT,
  MOCK_PROVIDER_CONSENT,
  type MockHostScenario,
} from "../src/host/mock.ts";
import { createHostContractValidator, EXPERIENCE_HOST_CONTRACT_DOCUMENT, findSensitiveValues } from "../src/testing/index.ts";

type AnyRecord = Record<string, any>;

const ORIGIN = "https://niho.life";
const NOW = new Date("2026-10-21T01:00:00.000Z");
const validator = createHostContractValidator();

/** 契約の path（`{providerId}` 付き）と method から operationId を引く。 */
const OPERATIONS = Object.entries(EXPERIENCE_HOST_CONTRACT_DOCUMENT.paths as AnyRecord).flatMap(([path, item]) =>
  Object.entries(item as AnyRecord)
    .filter(([method]) => method !== "parameters")
    .map(([method, operation]) => ({
      method: method.toUpperCase(),
      pattern: new RegExp(`^${path.replace(/\{[^}]+\}/g, "[^/]+")}$`),
      operationId: (operation as AnyRecord).operationId as string,
    })),
);

function operationFor(method: string, pathname: string): string | null {
  return OPERATIONS.find((operation) => operation.method === method && operation.pattern.test(pathname))?.operationId ?? null;
}

type Recorded = { operationId: string | null; status: number; body: unknown };
let recorded: Recorded[] = [];

/** mock の応答を全部記録する fetch。test の終わりに、全応答が契約の schema に合うことを確かめる。 */
function recordingFetch(scenario: MockHostScenario): FetchLike {
  const mock = createMockExperienceHostFetch({ scenario, now: () => NOW });
  return async (input, init) => {
    const response = await mock(input, init);
    const text = await response.clone().text();
    recorded.push({ operationId: operationFor((init?.method ?? "GET").toUpperCase(), new URL(input).pathname), status: response.status, body: text ? JSON.parse(text) : null });
    return response;
  };
}

function client(scenario: MockHostScenario, idToken = "sample-id-token") {
  return createExperienceHostApiClient({ nihoWebOrigin: ORIGIN, idToken, fetch: recordingFetch(scenario) });
}

function data<T>(result: ExperienceHostApiResult<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${JSON.stringify(result)}`);
  return result.data;
}

afterEach(() => {
  const invalid = recorded.flatMap(({ operationId, status, body }) => {
    if (!operationId) return [`unknown operation (status ${status})`];
    const result = validator.validateResponse(operationId, status, body);
    return result.ok ? [] : [`${operationId} ${status}: ${result.errors.join("; ")}`];
  });
  const sensitive = findSensitiveValues(recorded.map((entry) => entry.body));
  recorded = [];
  expect(invalid).toEqual([]);
  expect(sensitive).toEqual([]);
});

describe("ホスト API の mock：全 scenario・全操作の応答が契約に合う", () => {
  it.each(MOCK_HOST_SCENARIOS)("%s", async (scenario) => {
    const api = client(scenario);
    const list = data(await api.listExperienceProviders());
    await api.getAuthMe();
    const ids = [...list.providers.map((provider) => provider.id), "someone-elses-provider"];
    for (const id of ids) {
      await api.getExperienceProvider(id);
      await api.updateExperienceProvider(id, { bio: "（sample）紹介を直しました。" });
      await api.getExperienceProviderPaymentReadiness(id);
      await api.listExperienceProviderPaymentReuseCandidates(id);
      await api.reuseExperienceProviderPayment(id, { sourceSpotId: "sample-spot-house", consentVersion: MOCK_PAYMENT_REUSE_CONSENT.version });
      await api.syncExperienceProviderPaymentConnect(id);
      await api.startExperienceProviderPaymentConnect(id);
      await api.resumeExperienceProviderPaymentConnect(id);
      await api.syncExperienceProviderPaymentConnect(id);
      await api.submitExperienceProvider(id);
    }
    await api.registerExperienceProvider({ kind: "BUSINESS", displayName: "（sample）新しい提供者", bio: "", sellerDisclosureUrl: null, consentVersion: MOCK_PROVIDER_CONSENT.version });
    await api.registerExperienceProvider({ kind: "INDIVIDUAL", displayName: " ", bio: "", sellerDisclosureUrl: null, consentVersion: MOCK_PROVIDER_CONSENT.version });
    expect(recorded.length).toBeGreaterThan(5);
  });

  it("Bearer が無ければ 401", async () => {
    const mock = createMockExperienceHostFetch({ scenario: "two-providers", now: () => NOW });
    for (const path of ["/api/auth/me", "/api/experience-providers", "/api/experience-providers/sample-provider-kitchen"]) {
      const response = await mock(`${ORIGIN}${path}`, { headers: { authorization: "Bearer " } });
      recorded.push({ operationId: operationFor("GET", path), status: response.status, body: await response.json() });
      expect(response.status).toBe(401);
    }
  });
});

describe("ホスト API の mock：scenario", () => {
  it("empty は提供者 0 件で、登録すると OWNER の下書きが増える（同じインスタンスの中だけ）", async () => {
    const api = client("empty");
    const before = data(await api.listExperienceProviders());
    expect(before.providers).toEqual([]);
    expect(before.consent).toEqual(MOCK_PROVIDER_CONSENT);

    const outdated = await api.registerExperienceProvider({ kind: "INDIVIDUAL", displayName: "（sample）台所", bio: "", sellerDisclosureUrl: null, consentVersion: "old" });
    expect(outdated).toMatchObject({ ok: false, kind: "error", status: 422, code: "UNPROCESSABLE_ENTITY", reason: "PROVIDER_CONSENT_OUTDATED" });

    const created = data(await api.registerExperienceProvider({ kind: "INDIVIDUAL", displayName: "  （sample）台所  ", bio: "紹介", sellerDisclosureUrl: null, consentVersion: MOCK_PROVIDER_CONSENT.version }));
    expect(created.provider).toMatchObject({ displayName: "（sample）台所", reviewStatus: "DRAFT", ownerUserId: MOCK_HOST_USER.id, createdAt: NOW.toISOString() });
    const after = data(await api.listExperienceProviders());
    expect(after.providers).toEqual([{ ...created.provider, memberRole: "OWNER" }]);
    expect(data(await client("empty").listExperienceProviders()).providers).toEqual([]);
  });

  it("two-providers は OWNER・承認済み・口座準備済みの台所と、EDITOR・下書きの工房", async () => {
    const api = client("two-providers");
    const { providers } = data(await api.listExperienceProviders());
    expect(providers.map(({ id, displayName, memberRole, reviewStatus }) => ({ id, displayName, memberRole, reviewStatus }))).toEqual([
      { id: "sample-provider-kitchen", displayName: "サンプルの台所", memberRole: "OWNER", reviewStatus: "APPROVED" },
      { id: "sample-provider-studio", displayName: "サンプル工房", memberRole: "EDITOR", reviewStatus: "DRAFT" },
    ]);
    expect(data(await api.getExperienceProviderPaymentReadiness("sample-provider-kitchen"))).toMatchObject({ ready: true, reason: "READY" });
    // 申込があるので口座を切り替えられない
    expect(await api.reuseExperienceProviderPayment("sample-provider-kitchen", { sourceSpotId: "x", consentVersion: MOCK_PAYMENT_REUSE_CONSENT.version }))
      .toMatchObject({ ok: false, status: 409, reason: "PROVIDER_PAYMENT_LOCKED" });

    // EDITOR は OWNER だけの操作が 404・販売者表示の変更が 403・紹介は直せる
    expect(await api.getExperienceProviderPaymentReadiness("sample-provider-studio")).toMatchObject({ ok: false, status: 404, code: "NOT_FOUND", reason: null });
    expect(await api.submitExperienceProvider("sample-provider-studio")).toMatchObject({ ok: false, status: 404 });
    expect(await api.updateExperienceProvider("sample-provider-studio", { sellerDisclosureUrl: "https://example.com/legal" })).toMatchObject({ ok: false, status: 403, code: "FORBIDDEN" });
    expect(data(await api.updateExperienceProvider("sample-provider-studio", { displayName: "サンプル工房（改）" })).provider.displayName).toBe("サンプル工房（改）");

    // 承認済みの紹介を直すと再審査（REQUESTED）に戻る
    expect(data(await api.updateExperienceProvider("sample-provider-kitchen", { bio: "直した紹介" })).provider.reviewStatus).toBe("REQUESTED");
    expect(await api.updateExperienceProvider("sample-provider-kitchen", {})).toMatchObject({ ok: false, status: 400, code: "VALIDATION_ERROR" });
    expect(await api.updateExperienceProvider("sample-provider-kitchen", { sellerDisclosureUrl: "http://example.com/legal" })).toMatchObject({ ok: false, status: 400 });
  });

  it("payments-pending は口座が未接続で、準備済みの拠点の口座を再利用できる", async () => {
    const api = client("payments-pending");
    const [garden] = data(await api.listExperienceProviders()).providers;
    expect(garden).toMatchObject({ id: "sample-provider-garden", memberRole: "OWNER", reviewStatus: "DRAFT" });
    const id = garden!.id;
    expect(data(await api.getExperienceProviderPaymentReadiness(id))).toEqual({ ready: false, reason: "NOT_CONNECTED", paymentReuseConsent: MOCK_PAYMENT_REUSE_CONSENT });
    expect(data(await api.listExperienceProviderPaymentReuseCandidates(id)).spots).toEqual([
      { id: "sample-spot-house", name: "サンプルの拠点", ready: true, reason: "READY" },
      { id: "sample-spot-annex", name: "サンプルの別館", ready: false, reason: "VERIFICATION_REQUIRED" },
    ]);
    const consentVersion = MOCK_PAYMENT_REUSE_CONSENT.version;
    expect(await api.reuseExperienceProviderPayment(id, { sourceSpotId: "sample-spot-house", consentVersion: "old" })).toMatchObject({ status: 422, reason: "PROVIDER_PAYMENT_CONSENT_OUTDATED" });
    expect(await api.reuseExperienceProviderPayment(id, { sourceSpotId: "sample-spot-annex", consentVersion })).toMatchObject({ status: 422, reason: "PROVIDER_PAYMENT_SOURCE_NOT_READY" });
    expect(await api.reuseExperienceProviderPayment(id, { sourceSpotId: "someone-elses-spot", consentVersion })).toMatchObject({ status: 404, reason: "PROVIDER_PAYMENT_SOURCE_FORBIDDEN" });

    const reused = data(await api.reuseExperienceProviderPayment(id, { sourceSpotId: "sample-spot-house", consentVersion }));
    expect(reused.provider).toMatchObject({ paymentReuseSourceSpotId: "sample-spot-house", paymentReuseConsentVersion: consentVersion, paymentReuseConsentedAt: NOW.toISOString() });
    expect(data(await api.getExperienceProviderPaymentReadiness(id))).toMatchObject({ ready: true, reason: "READY" });
    expect(await api.startExperienceProviderPaymentConnect(id)).toMatchObject({ ok: false, status: 409, reason: "PROVIDER_PAYMENT_SHARED_ACCOUNT" });
  });

  it("Stripe の接続は合成の URL を返し、sync で準備済みになる", async () => {
    const api = client("payments-pending");
    const id = "sample-provider-garden";
    expect(await api.syncExperienceProviderPaymentConnect(id)).toMatchObject({ ok: false, status: 409, code: "CONFLICT", reason: "PROVIDER_PAYMENT_NOT_CONNECTED" });
    const started = data(await api.startExperienceProviderPaymentConnect(id));
    expect(started).toMatchObject({ ready: false, reason: "VERIFICATION_REQUIRED", expiresAt: "2026-10-21T01:05:00.000Z" });
    expect(new URL(started.url!).origin).toBe("https://connect.stripe.test");
    expect(isMockConnectUrl(started.url!)).toBe(true);
    const resumed = data(await api.resumeExperienceProviderPaymentConnect(id));
    expect(resumed.url).not.toBe(started.url);
    expect(data(await api.syncExperienceProviderPaymentConnect(id))).toEqual({ url: null, expiresAt: null, ready: true, reason: "READY" });
  });

  it("審査の申請は販売者表示と今の同意の版がそろったときだけ", async () => {
    const api = client("two-providers");
    // 承認済みのまま申請はできない
    expect(await api.submitExperienceProvider("sample-provider-kitchen")).toMatchObject({ ok: false, status: 409, reason: "PROVIDER_REVIEW_STATE_CONFLICT" });
    const fresh = client("empty");
    const { provider } = data(await fresh.registerExperienceProvider({ kind: "BUSINESS", displayName: "（sample）工房", bio: "", sellerDisclosureUrl: null, consentVersion: MOCK_PROVIDER_CONSENT.version }));
    expect(await fresh.submitExperienceProvider(provider.id)).toMatchObject({ ok: false, status: 409, reason: "PROVIDER_REVIEW_STATE_CONFLICT" });
    await fresh.updateExperienceProvider(provider.id, { sellerDisclosureUrl: "https://example.com/sample/legal" });
    expect(data(await fresh.submitExperienceProvider(provider.id))).toEqual({ submitted: true });
    expect(data(await fresh.getExperienceProvider(provider.id)).provider).toMatchObject({ reviewStatus: "REQUESTED", submittedAt: NOW.toISOString() });
  });

  it("me は合成の本人だけを返す", async () => {
    expect(data(await client("empty").getAuthMe())).toEqual({ user: { id: MOCK_HOST_USER.id, displayName: MOCK_HOST_USER.displayName }, userIconImage: null });
  });
});
