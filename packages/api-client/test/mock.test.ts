import { describe, expect, it } from "vitest";

import { computeExpectedTotalYen } from "../src/booking-rules.ts";
import { createExperienceApiClient } from "../src/client.ts";
import { createMockExperienceFetch, isMockCheckoutUrl, MOCK_SCENARIOS, type MockScenario } from "../src/mock/index.ts";
import { createContractValidator, findSensitiveValues } from "../src/testing/index.ts";
import type { ExperienceCheckoutRequest, ExperienceDetail, Occurrence } from "../src/types.ts";

const validator = createContractValidator();
// 2026-10-19（月）10:00 JST
const NOW = new Date("2026-10-19T01:00:00.000Z");
const ORIGIN = "https://niho.life";

async function call(scenario: MockScenario, path: string, init?: RequestInit) {
  const fetchMock = createMockExperienceFetch({ scenario, now: () => NOW });
  const response = await fetchMock(`${ORIGIN}${path}`, init);
  const text = await response.text();
  return { response, body: text ? (JSON.parse(text) as unknown) : null };
}

async function detail(slug: string): Promise<ExperienceDetail> {
  const { body } = await call("default", `/api/public/experiences/${slug}`);
  return (body as { experience: ExperienceDetail }).experience;
}

async function firstBookable(slug: string, offerId: string): Promise<Occurrence> {
  const { body } = await call("default", `/api/public/experiences/${slug}/availability?offerId=${offerId}`);
  const occurrence = (body as { occurrences: Occurrence[] }).occurrences.find((candidate) => candidate.bookable && candidate.seatsLeft >= 2);
  if (!occurrence) throw new Error("no bookable occurrence");
  return occurrence;
}

async function checkoutBody(slug: string, overrides: Partial<ExperienceCheckoutRequest> = {}): Promise<ExperienceCheckoutRequest> {
  const experience = await detail(slug);
  const offer = experience.offers[0]!;
  const occurrence = await firstBookable(slug, offer.id);
  return {
    offerId: offer.id,
    occurrenceDate: occurrence.date,
    adultCount: 2,
    childCount: 0,
    expectedTotalYen: computeExpectedTotalYen(offer.pricing, 2, 0)!,
    guestName: "Sample Guest",
    guestEmail: "guest@example.com",
    note: null,
    answers: offer.bookingQuestions
      .filter((question) => question.required)
      .map((question) => ({ questionId: question.id, optionIds: [question.options[0]!.id] })),
    bookingQuestionsFingerprint: offer.bookingQuestionsFingerprint,
    consent: { agreedVersion: experience.booking.consentVersion },
    clientRequestKey: "11111111-2222-4333-8444-555555555555",
    ...overrides,
  };
}

function post(body: unknown): RequestInit {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

describe("mock の読み取りが契約を満たす", () => {
  it.each(MOCK_SCENARIOS.filter((scenario) => scenario !== "network-error" && scenario !== "slow"))("%s: 一覧・詳細・残席", async (scenario) => {
    const catalog = await call(scenario, "/api/public/experiences?region=kamakura");
    expect(validator.validateResponse("listExperiences", catalog.response.status, catalog.body)).toEqual({ ok: true });
    expect(catalog.response.headers.get("cache-control")).toMatch(/^public, max-age=60/);

    const slugs = (catalog.body as { experiences: Array<{ slug: string }> }).experiences.map((item) => item.slug);
    for (const slug of slugs) {
      const found = await call(scenario, `/api/public/experiences/${slug}`);
      expect(validator.validateResponse("getExperience", found.response.status, found.body)).toEqual({ ok: true });
      const availability = await call(scenario, `/api/public/experiences/${slug}/availability`);
      expect(validator.validateResponse("getExperienceAvailability", availability.response.status, availability.body)).toEqual({ ok: true });
      expect(availability.response.headers.get("cache-control")).toBe("no-store");
      expect(findSensitiveValues(availability.body)).toEqual([]);
    }
  });

  it("掲載されていない slug は本文なしの 404・形の誤りは 400", async () => {
    const missing = await call("default", "/api/public/experiences/not-listed-anywhere");
    expect(missing.response.status).toBe(404);
    expect(validator.validateResponse("getExperience", 404, missing.body)).toEqual({ ok: true });
    const invalid = await call("default", "/api/public/experiences/Bad_Slug");
    expect(validator.validateResponse("getExperience", invalid.response.status, invalid.body)).toEqual({ ok: true });
    expect(invalid.response.status).toBe(400);
  });

  it("開催回は JST の 90 日・曜日どおりで、申込停止中の体験は全部 UNAVAILABLE", async () => {
    const { body } = await call("default", "/api/public/experiences/home-cooked-dinner-with-locals/availability");
    const occurrences = (body as { occurrences: Occurrence[] }).occurrences;
    expect(occurrences.length).toBeGreaterThan(20);
    for (const occurrence of occurrences) {
      const weekday = new Date(`${occurrence.date}T00:00:00Z`).getUTCDay();
      expect([5, 6]).toContain(weekday);
      expect(occurrence.startAt.endsWith("Z")).toBe(true);
      expect(new Date(occurrence.startAt).getTime()).toBe(Date.parse(`${occurrence.date}T18:00:00+09:00`));
    }
    expect(occurrences.some((occurrence) => occurrence.reason === "FULL")).toBe(true);
    const paused = await call("default", "/api/public/experiences/evening-pottery-session/availability");
    expect((paused.body as { occurrences: Occurrence[] }).occurrences.every((occurrence) => occurrence.reason === "UNAVAILABLE")).toBe(true);
  });
});

describe("mock の checkout", () => {
  const slug = "home-cooked-dinner-with-locals";

  it("成功は 201・同じ key と同じ内容の再送は同じ URL・内容違いは REQUEST_MISMATCH", async () => {
    const fetchMock = createMockExperienceFetch({ now: () => NOW });
    const body = await checkoutBody(slug);
    const first = await fetchMock(`${ORIGIN}/api/public/experiences/${slug}/checkout`, post(body));
    const firstBody = await first.json();
    expect(validator.validateResponse("startExperienceCheckout", first.status, firstBody)).toEqual({ ok: true });
    expect(first.status).toBe(201);
    expect(isMockCheckoutUrl(firstBody.checkoutUrl)).toBe(true);

    const again = await fetchMock(`${ORIGIN}/api/public/experiences/${slug}/checkout`, post(body));
    expect((await again.json()).checkoutUrl).toBe(firstBody.checkoutUrl);

    const changed = await fetchMock(`${ORIGIN}/api/public/experiences/${slug}/checkout`, post({ ...body, guestName: "Another Name" }));
    const changedBody = await changed.json();
    expect(changed.status).toBe(409);
    expect(changedBody.error.code).toBe("REQUEST_MISMATCH");
    expect(validator.validateResponse("startExperienceCheckout", 409, changedBody)).toEqual({ ok: true });
  });

  it("応答に旅行者の入力（名前・メール・回答）を含めない", async () => {
    const fetchMock = createMockExperienceFetch({ now: () => NOW });
    const body = await checkoutBody(slug, { note: "No pork please" });
    const response = await fetchMock(`${ORIGIN}/api/public/experiences/${slug}/checkout`, post(body));
    const text = await response.text();
    expect(text).not.toContain("guest@example.com");
    expect(text).not.toContain("Sample Guest");
    expect(text).not.toContain("No pork");
  });

  it("画面の合計と違えば PRICE_CHANGED（今の合計を返す）", async () => {
    const body = await checkoutBody(slug, { expectedTotalYen: 1 });
    const { response, body: error } = await call("default", `/api/public/experiences/${slug}/checkout`, post(body));
    expect(response.status).toBe(409);
    expect(error).toMatchObject({ error: { code: "PRICE_CHANGED", currentTotalYen: 13000, retryable: false } });
  });

  it("質問の組が違えば QUESTIONS_CHANGED・必須の回答が無くても QUESTIONS_CHANGED（NIHO と同じ）", async () => {
    const stale = await checkoutBody(slug, { bookingQuestionsFingerprint: "0".repeat(64) });
    expect((await call("default", `/api/public/experiences/${slug}/checkout`, post(stale))).body).toMatchObject({ error: { code: "QUESTIONS_CHANGED" } });
    const indigo = await checkoutBody("indigo-dyeing-with-an-artisan", { answers: [] });
    expect((await call("default", "/api/public/experiences/indigo-dyeing-with-an-artisan/checkout", post(indigo))).body).toMatchObject({
      error: { code: "QUESTIONS_CHANGED", questionId: "q_colour" },
    });
  });

  it("申込質問の入力形式と選択肢 ID が違う回答は ANSWERS_INVALID", async () => {
    const base = await checkoutBody("indigo-dyeing-with-an-artisan");
    const answer = base.answers?.[0];
    if (!answer) throw new Error("required answer missing");
    const invalidAnswers = [
      [{ questionId: answer.questionId, text: "Deep indigo" }],
      [{ questionId: answer.questionId, optionIds: ["unknown-option"] }],
      [{ questionId: answer.questionId, optionIds: [answer.optionIds?.[0], "o_light"] }],
    ];

    for (const answers of invalidAnswers) {
      const { response, body: error } = await call("default", "/api/public/experiences/indigo-dyeing-with-an-artisan/checkout", post({ ...base, answers }));
      expect(response.status).toBe(422);
      expect(error).toMatchObject({ error: { code: "ANSWERS_INVALID", questionId: answer.questionId } });
      expect(validator.validateResponse("startExperienceCheckout", response.status, error)).toEqual({ ok: true });
    }
  });

  it("申込停止中・同意の版違い・子ども料金の無い商品の子どもは受け付けない", async () => {
    const paused = await detail("evening-pottery-session");
    const pausedBody = {
      ...(await checkoutBody(slug)),
      offerId: paused.offers[0]!.id,
      expectedTotalYen: 6000,
      bookingQuestionsFingerprint: paused.offers[0]!.bookingQuestionsFingerprint,
    };
    expect((await call("default", "/api/public/experiences/evening-pottery-session/checkout", post(pausedBody))).body).toMatchObject({ error: { code: "UNAVAILABLE" } });
    const consent = await checkoutBody(slug, { consent: { agreedVersion: "2020-01-01" } });
    expect((await call("default", `/api/public/experiences/${slug}/checkout`, post(consent))).body).toMatchObject({
      error: { code: "CONSENT_OUTDATED", field: "consent.agreedVersion" },
    });
    const indigo = await checkoutBody("indigo-dyeing-with-an-artisan", { adultCount: 1, childCount: 1, expectedTotalYen: 8800 });
    expect((await call("default", "/api/public/experiences/indigo-dyeing-with-an-artisan/checkout", post(indigo))).body).toMatchObject({
      error: { code: "INPUT_INVALID", field: "childCount" },
    });
  });

  it.each([
    ["checkout-full", 409, "FULL"],
    ["checkout-hold-limit", 409, "HOLD_LIMIT"],
    ["checkout-price-changed", 409, "PRICE_CHANGED"],
    ["checkout-questions-changed", 409, "QUESTIONS_CHANGED"],
    ["checkout-consent-outdated", 422, "CONSENT_OUTDATED"],
    ["checkout-rate-limited", 429, "RATE_LIMITED"],
    ["checkout-unavailable", 503, "CHECKOUT_UNAVAILABLE"],
  ] as const)("%s は %d %s を契約どおりに返す", async (scenario, status, code) => {
    const body = await checkoutBody(slug);
    const { response, body: error } = await call(scenario, `/api/public/experiences/${slug}/checkout`, post(body));
    expect(response.status).toBe(status);
    expect(error).toMatchObject({ error: { code } });
    expect(validator.validateResponse("startExperienceCheckout", status, error)).toEqual({ ok: true });
    if (code === "RATE_LIMITED") expect(response.headers.get("retry-after")).toBe("120");
  });

  it("network-error はクライアントで network_error になり、同じ key で再送できる", async () => {
    const client = createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: createMockExperienceFetch({ scenario: "network-error" }) });
    const result = await client.startCheckout(slug, await checkoutBody(slug));
    expect(result).toEqual({ ok: false, kind: "network_error" });
  });
});
