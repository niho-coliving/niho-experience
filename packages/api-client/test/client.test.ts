import { describe, expect, it, vi } from "vitest";

import { createExperienceApiClient, isAllowedCheckoutRedirect, type FetchLike } from "../src/client.ts";
import type { ExperienceCheckoutRequest } from "../src/types.ts";

const ORIGIN = "https://niho.life";
const BODY: ExperienceCheckoutRequest = {
  offerId: "offer_dinner_seat",
  occurrenceDate: "2026-10-23",
  adultCount: 1,
  childCount: 0,
  expectedTotalYen: 6500,
  guestName: "Sample Guest",
  guestEmail: "guest@example.com",
  bookingQuestionsFingerprint: "a".repeat(64),
  consent: { agreedVersion: "2026-10-01" },
  clientRequestKey: "key-12345678",
};

function respond(status: number, body: unknown, headers: Record<string, string> = {}): FetchLike {
  return vi.fn(async () => new Response(body === null ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } }));
}

describe("isAllowedCheckoutRedirect", () => {
  it.each([
    ["https://checkout.stripe.com/c/pay/cs_test_abc", true],
    ["https://niho.life/living/nihokamakura/pages/community-dinner/bookings/tok.en?checkout=completed", true],
    ["http://checkout.stripe.com/c/pay/cs_test_abc", false],
    ["https://checkout.stripe.com.evil.example/c/pay", false],
    ["https://niho.life/auth/login?returnUrl=/", false],
    ["https://evil.example/living/x/pages/y/bookings/z", false],
    ["javascript:alert(1)", false],
    ["https://user:pass@checkout.stripe.com/c/pay", false],
  ])("%s → %s", (url, expected) => {
    expect(isAllowedCheckoutRedirect(url, ORIGIN)).toBe(expected);
  });
});

describe("createExperienceApiClient", () => {
  it("cookie を送らず、旅行者の入力を URL に載せない", async () => {
    const fetchMock = respond(201, { checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_abc" });
    const client = createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: fetchMock });
    const result = await client.startCheckout("home-cooked-dinner-with-locals", BODY);
    expect(result).toEqual({ ok: true, checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_abc" });
    const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://niho.life/api/public/experiences/home-cooked-dinner-with-locals/checkout");
    expect(url).not.toContain("example.com");
    expect(init.credentials).toBe("omit");
    expect(init.cache).toBe("no-store");
    expect(init.referrerPolicy).toBe("no-referrer");
  });

  it("許可していない遷移先は unexpected_response として扱う", async () => {
    const client = createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: respond(201, { checkoutUrl: "https://evil.example/pay" }) });
    expect(await client.startCheckout("x-y", BODY)).toEqual({ ok: false, kind: "unexpected_response", status: 201 });
  });

  it("契約のエラーは rejected と Retry-After を返す", async () => {
    const error = { code: "RATE_LIMITED", message: "Too many", retryable: true, field: null, questionId: null, seatsLeft: null, occurrenceReason: null, currentTotalYen: null };
    const client = createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: respond(429, { error }, { "retry-after": "60" }) });
    expect(await client.startCheckout("x-y", BODY)).toEqual({ ok: false, kind: "rejected", status: 429, error, retryAfterSeconds: 60 });
  });

  it("404 は not_found・形の違う本文は unexpected_response", async () => {
    expect(await createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: respond(404, null) }).getExperience("x-y")).toEqual({ ok: false, kind: "not_found" });
    expect(await createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: respond(200, [1, 2]) }).listExperiences()).toEqual({
      ok: false,
      kind: "unexpected_response",
      status: 200,
    });
  });

  it("一覧・詳細だけ cacheableReadInit を使い、残席は no-store", async () => {
    const fetchMock = respond(200, { experiences: [] });
    const client = createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: fetchMock, cacheableReadInit: { cache: "force-cache" } });
    await client.listExperiences({ region: "kamakura" });
    await client.getAvailability("x-y", { offerId: "offer_1" });
    const calls = (fetchMock as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;
    expect(calls[0]?.[0]).toBe("https://niho.life/api/public/experiences?region=kamakura");
    expect(calls[0]?.[1].cache).toBe("force-cache");
    expect(calls[1]?.[0]).toBe("https://niho.life/api/public/experiences/x-y/availability?offerId=offer_1");
    expect(calls[1]?.[1].cache).toBe("no-store");
  });

  it("時間切れは network_error（同じ key で再送できる）", async () => {
    const hanging: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    const client = createExperienceApiClient({ nihoWebOrigin: ORIGIN, fetch: hanging, timeoutMs: 10 });
    expect(await client.startCheckout("x-y", BODY)).toEqual({ ok: false, kind: "network_error" });
  });

  it("origin に path や http を渡すと作れない", () => {
    expect(() => createExperienceApiClient({ nihoWebOrigin: "https://niho.life/api" })).toThrow();
    expect(() => createExperienceApiClient({ nihoWebOrigin: "http://niho.life" })).toThrow();
  });
});
