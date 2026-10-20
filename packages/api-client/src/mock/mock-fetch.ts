/**
 * 合成データを返す fetch（仮契約の mock adapter）。本物の API と同じ path・status・本文の形を返し、同じ契約検証を通す。
 * 決済・DB・ログインは持たない（Stripe へは遷移しない URL を返す）。旅行者の入力はこの関数の中だけで扱い、記録しない。
 */
import { computeExpectedTotalYen } from "../booking-rules.ts";
import { buildMockOccurrences } from "../fixtures/availability.ts";
import { toExperienceSummary } from "../fixtures/catalog.ts";
import { buildFixtureExperiences, FIXTURE_CONSENT_VERSION } from "../fixtures/experiences.ts";
import { buildPilotExperiences } from "../fixtures/pilot-experiences.ts";
import type { FetchLike } from "../client.ts";
import type { CheckoutErrorCode, ExperienceCheckoutError, ExperienceDetail, ExperienceDetailV11, Occurrence } from "../types.ts";

export const MOCK_SCENARIOS = [
  "default",
  "empty-catalog",
  "sold-out",
  "slow",
  "network-error",
  "checkout-full",
  "checkout-hold-limit",
  "checkout-price-changed",
  "checkout-questions-changed",
  "checkout-consent-outdated",
  "checkout-rate-limited",
  "checkout-unavailable",
] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

/**
 * mock が返す体験の一覧。`synthetic` は架空の合成 fixture、`pilot` は掲載許可のある体験を推奨値で載せた pilot fixture
 * （fixtures/pilot-experiences.ts）、`all` は両方（slug は重ならない）。ブラウザ側は SSR がどちらを出しても動くよう `all` を使う。
 */
export const MOCK_CATALOGS = ["synthetic", "pilot", "all"] as const;
export type MockCatalog = (typeof MOCK_CATALOGS)[number];

export type MockExperienceFetchOptions = {
  scenario?: MockScenario;
  /** 既定は `synthetic`。 */
  catalog?: MockCatalog;
  /** 開催回の基準時刻（既定は呼び出し時の現在時刻）。test で固定する。 */
  now?: () => Date;
  /** `mock-assets/` を配信する URL（省略時は data URI の画像）。 */
  imageBaseUrl?: string;
  /** `slow` のときの遅延（既定 1500ms）。 */
  slowDelayMs?: number;
};

/** mock の checkout が返す遷移先。Stripe の origin だが実在しない。画面はこれを検出して自前の mock 決済画面へ切り替える。 */
const MOCK_CHECKOUT_PREFIX = "https://checkout.stripe.com/c/pay/cs_test_niho_experience_mock_";
const MOCK_CHECKOUT_FRAGMENT = "#niho-mock-checkout";

export function isMockCheckoutUrl(url: string): boolean {
  return url.startsWith(MOCK_CHECKOUT_PREFIX) && url.endsWith(MOCK_CHECKOUT_FRAGMENT);
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
const REGION_PATTERN = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;
const OFFER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const ATTRIBUTION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UTM_PATTERN = /^[a-z0-9_-]{1,64}$/;
const SHARED_CACHE = "public, max-age=60, stale-while-revalidate=300";

function json(status: number, body: unknown, cacheControl: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": cacheControl, ...extraHeaders },
  });
}

function notFound(): Response {
  return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
}

function validationError(message: string): Response {
  return json(400, { error: { code: "VALIDATION_ERROR", message } }, "no-store");
}

const RETRYABLE: ReadonlySet<CheckoutErrorCode> = new Set(["CHECKOUT_UNAVAILABLE", "RATE_LIMITED"]);
const ERROR_STATUS: Record<CheckoutErrorCode, number> = {
  VALIDATION_ERROR: 400,
  INPUT_INVALID: 422,
  CONSENT_OUTDATED: 422,
  OCCURRENCE_INVALID: 422,
  ANSWERS_INVALID: 422,
  UNAVAILABLE: 409,
  FULL: 409,
  HOLD_LIMIT: 409,
  REQUEST_MISMATCH: 409,
  QUESTIONS_CHANGED: 409,
  PRICE_CHANGED: 409,
  RATE_LIMITED: 429,
  CHECKOUT_UNAVAILABLE: 503,
};

function checkoutError(code: CheckoutErrorCode, extra: Partial<Omit<ExperienceCheckoutError, "code" | "message" | "retryable">> = {}): Response {
  const error: ExperienceCheckoutError = {
    code,
    message: `mock: ${code}`,
    retryable: RETRYABLE.has(code),
    field: extra.field ?? null,
    questionId: extra.questionId ?? null,
    seatsLeft: extra.seatsLeft ?? null,
    occurrenceReason: extra.occurrenceReason ?? null,
    currentTotalYen: extra.currentTotalYen ?? null,
  };
  return json(ERROR_STATUS[code], { error }, "no-store", code === "RATE_LIMITED" ? { "retry-after": "120" } : {});
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 500;
}

function toV11(experience: ExperienceDetail): ExperienceDetailV11 {
  const withAlt = (image: { url: string } | null, alt: string | null) => image ? { url: image.url, alt } : null;
  return {
    ...experience,
    cover: withAlt(experience.cover, experience.title),
    photos: experience.photos.map((image, index) => ({ ...image, alt: `${experience.title} ${index + 1}` })),
    hosts: experience.hosts.map((host) => ({ ...host, avatar: withAlt(host.avatar, null), bio: null })),
    provider: { ...experience.provider, logo: withAlt(experience.provider.logo, null) },
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type HoldRecord = { contentKey: string; url: string; offerId: string; date: string; seats: number };

export function createMockExperienceFetch(options: MockExperienceFetchOptions = {}): FetchLike {
  const scenario = options.scenario ?? "default";
  const now = options.now ?? (() => new Date());
  const catalog = options.catalog ?? "synthetic";
  const synthetic = catalog === "pilot" ? [] : buildFixtureExperiences(options.imageBaseUrl ? { imageBaseUrl: options.imageBaseUrl } : {});
  const pilot = catalog === "synthetic" ? [] : buildPilotExperiences();
  const pilotSlugs = new Set(pilot.map((experience) => experience.slug));
  const experiences = [...pilot, ...synthetic];
  const holds = new Map<string, HoldRecord>();
  let checkoutCounter = 0;

  function heldSeats(): Map<string, number> {
    const seats = new Map<string, number>();
    for (const hold of holds.values()) {
      const key = `${hold.offerId}|${hold.date}`;
      seats.set(key, (seats.get(key) ?? 0) + hold.seats);
    }
    return seats;
  }

  function occurrencesFor(experience: ExperienceDetail): Occurrence[] {
    return buildMockOccurrences({
      experience,
      now: now(),
      seatPolicy: scenario === "sold-out" ? "sold-out" : pilotSlugs.has(experience.slug) ? "open" : "varied",
      heldSeats: heldSeats(),
    });
  }

  function handleCheckout(experience: ExperienceDetail, body: unknown): Response {
    if (!isObject(body)) return checkoutError("VALIDATION_ERROR");
    switch (scenario) {
      case "checkout-rate-limited":
        return checkoutError("RATE_LIMITED");
      case "checkout-unavailable":
        return checkoutError("CHECKOUT_UNAVAILABLE");
      case "checkout-hold-limit":
        return checkoutError("HOLD_LIMIT");
      case "checkout-questions-changed":
        return checkoutError("QUESTIONS_CHANGED");
      case "checkout-consent-outdated":
        return checkoutError("CONSENT_OUTDATED", { field: "consent.agreedVersion" });
      default:
        break;
    }

    const offer = experience.offers.find((candidate) => candidate.id === body.offerId);
    if (!offer) return checkoutError("INPUT_INVALID", { field: "offerId" });
    if (!experience.booking.checkoutAvailable) return checkoutError("UNAVAILABLE");
    if (!isObject(body.consent) || body.consent.agreedVersion !== FIXTURE_CONSENT_VERSION) {
      return checkoutError("CONSENT_OUTDATED", { field: "consent.agreedVersion" });
    }
    if (typeof body.clientRequestKey !== "string" || body.clientRequestKey.length < 8 || body.clientRequestKey.length > 120) {
      return checkoutError("INPUT_INVALID", { field: "clientRequestKey" });
    }
    if (typeof body.guestName !== "string" || body.guestName.trim().length === 0 || body.guestName.length > 100) {
      return checkoutError("INPUT_INVALID", { field: "guestName" });
    }
    if (typeof body.guestEmail !== "string" || !EMAIL_PATTERN.test(body.guestEmail) || body.guestEmail.length > 254) {
      return checkoutError("INPUT_INVALID", { field: "guestEmail" });
    }
    if (body.note !== undefined && body.note !== null && (typeof body.note !== "string" || body.note.length > 500)) {
      return checkoutError("INPUT_INVALID", { field: "note" });
    }
    if (body.attributionId !== undefined && (typeof body.attributionId !== "string" || !ATTRIBUTION_ID_PATTERN.test(body.attributionId))) {
      return checkoutError("INPUT_INVALID", { field: "attributionId" });
    }
    for (const field of ["utmSource", "utmMedium", "utmCampaign", "utmContent"] as const) {
      if (body[field] !== undefined && (typeof body[field] !== "string" || !UTM_PATTERN.test(body[field]))) {
        return checkoutError("INPUT_INVALID", { field });
      }
    }
    if (body.landingPageType !== undefined && !["HOME", "LIST", "DETAIL"].includes(String(body.landingPageType))) {
      return checkoutError("INPUT_INVALID", { field: "landingPageType" });
    }
    if (!isCount(body.adultCount)) return checkoutError("INPUT_INVALID", { field: "adultCount" });
    if (!isCount(body.childCount)) return checkoutError("INPUT_INVALID", { field: "childCount" });
    const headCount = body.adultCount + body.childCount;
    if (headCount < offer.minimumParticipants || headCount > offer.maxPartySize) return checkoutError("INPUT_INVALID", { field: "adultCount" });
    if (body.childCount > 0 && offer.pricing.child?.adultRequired && body.adultCount < 1) {
      return checkoutError("INPUT_INVALID", { field: "adultCount" });
    }
    const total = computeExpectedTotalYen(offer.pricing, body.adultCount, body.childCount);
    if (total === null) return checkoutError("INPUT_INVALID", { field: "childCount" });
    if (scenario === "checkout-price-changed") return checkoutError("PRICE_CHANGED", { currentTotalYen: total + 500 });
    if (body.expectedTotalYen !== total) return checkoutError("PRICE_CHANGED", { currentTotalYen: total });
    if (body.bookingQuestionsFingerprint !== offer.bookingQuestionsFingerprint) return checkoutError("QUESTIONS_CHANGED");

    if (body.answers !== undefined && !Array.isArray(body.answers)) {
      return checkoutError("ANSWERS_INVALID", { field: "answers" });
    }
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const questionById = new Map(offer.bookingQuestions.map((question) => [question.id, question]));
    const seenQuestionIds = new Set<string>();
    for (const candidate of answers) {
      if (!isObject(candidate) || typeof candidate.questionId !== "string") {
        return checkoutError("ANSWERS_INVALID", { field: "questionId" });
      }
      const question = questionById.get(candidate.questionId);
      if (!question || seenQuestionIds.has(candidate.questionId)) {
        return checkoutError("ANSWERS_INVALID", { questionId: candidate.questionId, field: "questionId" });
      }
      seenQuestionIds.add(candidate.questionId);

      const hasText = Object.prototype.hasOwnProperty.call(candidate, "text");
      const hasOptionIds = Object.prototype.hasOwnProperty.call(candidate, "optionIds");
      if (hasText && hasOptionIds) {
        return checkoutError("ANSWERS_INVALID", { questionId: question.id, field: "answer" });
      }
      if (question.inputType === "SHORT_TEXT" || question.inputType === "LONG_TEXT") {
        if (hasOptionIds || (hasText && typeof candidate.text !== "string")) {
          return checkoutError("ANSWERS_INVALID", { questionId: question.id, field: hasOptionIds ? "optionIds" : "text" });
        }
        if (typeof candidate.text === "string" && candidate.text.length > (question.inputType === "SHORT_TEXT" ? 200 : 1000)) {
          return checkoutError("ANSWERS_INVALID", { questionId: question.id, field: "text" });
        }
      } else {
        if (hasText || (hasOptionIds && !Array.isArray(candidate.optionIds))) {
          return checkoutError("ANSWERS_INVALID", { questionId: question.id, field: hasText ? "text" : "optionIds" });
        }
        if (Array.isArray(candidate.optionIds)) {
          const optionIds = candidate.optionIds;
          const distinctOptionIds = new Set(optionIds);
          const expectedCount = question.inputType === "SINGLE_SELECT" ? 1 : optionIds.length;
          const validOptions = optionIds.every((optionId) =>
            typeof optionId === "string" && question.options.some((option) => option.id === optionId),
          );
          if (
            optionIds.length !== expectedCount || distinctOptionIds.size !== optionIds.length || !validOptions ||
            optionIds.length > question.options.length || optionIds.length > 8
          ) {
            return checkoutError("ANSWERS_INVALID", { questionId: question.id, field: "optionIds" });
          }
        }
      }
    }
    for (const question of offer.bookingQuestions) {
      const answer = answers.find((candidate) => isObject(candidate) && candidate.questionId === question.id);
      const answered = isObject(answer) &&
        ((typeof answer.text === "string" && answer.text.trim().length > 0) || (Array.isArray(answer.optionIds) && answer.optionIds.length > 0));
      if (question.required && !answered) return checkoutError("QUESTIONS_CHANGED", { questionId: question.id });
    }

    const contentKey = JSON.stringify([body.offerId, body.occurrenceDate, body.adultCount, body.childCount, body.guestName, body.guestEmail, body.note ?? null, answers,
      body.attributionId ?? null, body.utmSource ?? null, body.utmMedium ?? null, body.utmCampaign ?? null, body.utmContent ?? null, body.landingPageType ?? null]);
    const existing = holds.get(body.clientRequestKey);
    if (existing) {
      return existing.contentKey === contentKey ? json(201, { checkoutUrl: existing.url }, "no-store") : checkoutError("REQUEST_MISMATCH");
    }

    const occurrence = occurrencesFor(experience).find(
      (candidate) => candidate.offerId === offer.id && candidate.date === body.occurrenceDate,
    );
    if (!occurrence) return checkoutError("OCCURRENCE_INVALID", { occurrenceReason: "NOT_SCHEDULED" });
    if (occurrence.reason === "CUTOFF") return checkoutError("OCCURRENCE_INVALID", { occurrenceReason: "CUTOFF" });
    if (occurrence.reason === "UNAVAILABLE") return checkoutError("OCCURRENCE_INVALID", { occurrenceReason: "UNAVAILABLE" });
    if (scenario === "checkout-full" || occurrence.seatsLeft < headCount) {
      return checkoutError("FULL", { seatsLeft: scenario === "checkout-full" ? Math.max(0, headCount - 1) : occurrence.seatsLeft });
    }

    checkoutCounter += 1;
    const url = `${MOCK_CHECKOUT_PREFIX}${checkoutCounter}${MOCK_CHECKOUT_FRAGMENT}`;
    holds.set(body.clientRequestKey, { contentKey, url, offerId: offer.id, date: occurrence.date, seats: headCount });
    return json(201, { checkoutUrl: url }, "no-store");
  }

  async function route(url: URL, init: RequestInit | undefined): Promise<Response> {
    const method = (init?.method ?? "GET").toUpperCase();
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] !== "api" || segments[1] !== "public" || segments[2] !== "experiences") return notFound();
    const slug = segments[3];
    const tail = segments.slice(4).join("/");

    if (slug === "v1.1" && method === "GET") {
      if (tail === "catalog") {
        const region = url.searchParams.get("region");
        if (region !== null && !REGION_PATTERN.test(region)) return validationError("region is invalid");
        const listed = scenario === "empty-catalog" ? [] : experiences.filter((experience) => region === null || experience.region.key === region);
        return json(200, { experiences: listed.map((experience) => toExperienceSummary(toV11(experience))) }, SHARED_CACHE);
      }
      if (!SLUG_PATTERN.test(tail)) return validationError("experienceSlug is invalid");
      const experience = scenario === "empty-catalog" ? undefined : experiences.find((candidate) => candidate.slug === tail);
      return experience ? json(200, { experience: toV11(experience) }, SHARED_CACHE) : notFound();
    }

    if (slug === undefined) {
      if (method !== "GET") return notFound();
      const region = url.searchParams.get("region");
      if (region !== null && !REGION_PATTERN.test(region)) return validationError("region is invalid");
      const listed = scenario === "empty-catalog" ? [] : experiences.filter((experience) => region === null || experience.region.key === region);
      return json(200, { experiences: listed.map(toExperienceSummary) }, SHARED_CACHE);
    }

    if (!SLUG_PATTERN.test(slug)) return validationError("experienceSlug is invalid");
    const experience = scenario === "empty-catalog" ? undefined : experiences.find((candidate) => candidate.slug === slug);

    if (tail === "" && method === "GET") {
      return experience ? json(200, { experience }, SHARED_CACHE) : notFound();
    }
    if (tail === "availability" && method === "GET") {
      const offerId = url.searchParams.get("offerId");
      if (offerId !== null && !OFFER_ID_PATTERN.test(offerId)) return validationError("offerId is invalid");
      if (!experience) return notFound();
      const occurrences = occurrencesFor(experience).filter((occurrence) => offerId === null || occurrence.offerId === offerId);
      return json(200, { generatedAt: now().toISOString(), timeZone: "Asia/Tokyo", windowDays: 90, occurrences }, "no-store");
    }
    if (tail === "checkout" && method === "POST") {
      if (!experience) return notFound();
      let body: unknown;
      try {
        body = JSON.parse(typeof init?.body === "string" ? init.body : "");
      } catch {
        return checkoutError("VALIDATION_ERROR");
      }
      return handleCheckout(experience, body);
    }
    return notFound();
  }

  return async (input, init) => {
    if (scenario === "network-error") throw new TypeError("mock network error");
    if (scenario === "slow") await new Promise((resolve) => setTimeout(resolve, options.slowDelayMs ?? 1500));
    if (init?.signal?.aborted) throw new DOMException("aborted", "AbortError");
    return route(new URL(input), init);
  };
}
