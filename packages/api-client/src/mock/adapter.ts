import type { ExperienceApi } from "../client";
import { ExperienceApiUnavailableError } from "../client";
import {
  SITE_TIMEZONE,
  type ApiError,
  type ApiErrorCode,
  type AvailabilityStatus,
  type Catalog,
  type CheckoutResult,
  type ExperienceDetail,
  type ExperienceSummary,
  type QuoteResult,
  type Slot,
} from "../contract";
import { fromJst, jstDate, jstParts, toJstIso } from "../time";
import { FIXTURES, MOCK_CHECKOUT_TRIGGERS, type Fixture } from "./fixtures";

/** Preview-only switches to show states that synthetic data cannot reach on its own. */
export type MockScenario = "normal" | "empty" | "error";

export interface MockOptions {
  now?: () => Date;
  scenario?: MockScenario;
  /** Artificial latency so loading states are visible in preview. */
  latencyMs?: number;
  /** Where the mock "payment" page lives on the site. */
  checkoutPath?: string;
}

const WEEKS_AHEAD = 6;
const QUOTE_TTL_MS = 15 * 60 * 1000;
const QUOTE_PREFIX = "mockq.";

const err = (code: ApiErrorCode, extra: Partial<ApiError> = {}): ApiError => ({
  code,
  retryable: code === "UNAVAILABLE" || code === "RATE_LIMITED",
  ...extra,
});

export function buildSlots(fixture: Fixture, now: Date): Slot[] {
  const { plan, detail } = fixture;
  const today = jstParts(now);
  const slots: Slot[] = [];
  for (let offset = 0; offset < WEEKS_AHEAD * 7; offset++) {
    const day = fromJst(today.year, today.month, today.day + offset);
    if (!plan.weekdays.includes(jstParts(day).weekday)) continue;
    const p = jstParts(day);
    const start = fromJst(p.year, p.month, p.day, plan.startHour, plan.startMinute);
    if (start.getTime() <= now.getTime()) continue;
    const end = new Date(start.getTime() + detail.durationMinutes * 60_000);
    const index = slots.length;
    const tooSoon = start.getTime() - now.getTime() < plan.cutoffHours * 3_600_000;
    const soldOut = plan.soldOut === "all" || plan.soldOut.includes(index);
    const status: Slot["status"] = tooSoon ? "closed" : soldOut ? "sold_out" : "open";
    const synthBooked = plan.unit === "per_group" ? 0 : (index % 3) * 2;
    const maxGuests = status === "open" ? Math.max(detail.groupSize.min, detail.groupSize.max - synthBooked) : 0;
    slots.push({
      id: `${detail.id}.${jstDate(start).replaceAll("-", "")}.${String(plan.startHour).padStart(2, "0")}${String(plan.startMinute).padStart(2, "0")}`,
      startsAt: toJstIso(start),
      endsAt: toJstIso(end),
      status,
      price: { unitAmount: { amount: plan.unitAmount, currency: "JPY" }, unit: plan.unit },
      maxGuests,
    });
  }
  return plan.paused ? slots.map((s) => ({ ...s, status: "closed", maxGuests: 0 })) : slots;
}

function availabilityOf(fixture: Fixture, slots: Slot[]): { status: AvailabilityStatus; nextStartsAt: string | null } {
  if (fixture.plan.paused) return { status: "paused", nextStartsAt: null };
  const open = slots.find((s) => s.status === "open");
  if (open) return { status: "bookable", nextStartsAt: open.startsAt };
  if (slots.some((s) => s.status === "sold_out")) return { status: "sold_out", nextStartsAt: null };
  return { status: "no_upcoming_dates", nextStartsAt: null };
}

function toDetail(fixture: Fixture, now: Date): ExperienceDetail {
  return { ...fixture.detail, availability: availabilityOf(fixture, buildSlots(fixture, now)) };
}

function toSummary(detail: ExperienceDetail): ExperienceSummary {
  const { id, slug, title, summary, area, themes, durationMinutes, languages, price, heroImage, host, availability, synthetic } = detail;
  return {
    id, slug, title, summary, area, themes, durationMinutes, languages, price, heroImage, availability, synthetic,
    host: { displayName: host.displayName, role: host.role, portrait: host.portrait },
  };
}

const STATUS_ORDER: Record<AvailabilityStatus, number> = { bookable: 0, sold_out: 1, no_upcoming_dates: 2, paused: 3 };

interface QuoteToken {
  e: string;
  s: string;
  g: number;
  t: number;
  x: number;
}

const encodeQuote = (q: QuoteToken) => QUOTE_PREFIX + Buffer.from(JSON.stringify(q)).toString("base64url");
function decodeQuote(id: string): QuoteToken | null {
  if (!id.startsWith(QUOTE_PREFIX)) return null;
  try {
    return JSON.parse(Buffer.from(id.slice(QUOTE_PREFIX.length), "base64url").toString("utf8")) as QuoteToken;
  } catch {
    return null;
  }
}

/**
 * In-memory stand-in for the NIHO public API. It never takes payment and
 * never stores contact details: checkout only returns a link to the site's
 * mock payment page.
 */
export function createMockExperienceApi(options: MockOptions = {}): ExperienceApi {
  const now = options.now ?? (() => new Date());
  const scenario = options.scenario ?? "normal";
  const checkoutPath = options.checkoutPath ?? "/preview/checkout";
  const delay = async () => {
    if (options.latencyMs) await new Promise((r) => setTimeout(r, options.latencyMs));
    if (scenario === "error") throw new ExperienceApiUnavailableError("Mock scenario: API unavailable");
  };
  const find = (pred: (f: Fixture) => boolean) => FIXTURES.find(pred);

  return {
    mode: "mock",

    async getCatalog(query): Promise<Catalog> {
      await delay();
      const at = now();
      const details = scenario === "empty" ? [] : FIXTURES.map((f) => toDetail(f, at));
      const themes = [...new Map(details.flatMap((d) => d.themes).map((t) => [t.slug, t])).values()];
      const items = details
        .filter((d) => !query.area || d.area.slug === query.area)
        .filter((d) => !query.theme || d.themes.some((t) => t.slug === query.theme))
        .filter((d) => {
          if (!query.date) return true;
          const fixture = find((f) => f.detail.id === d.id)!;
          return buildSlots(fixture, at).some((s) => s.status === "open" && s.startsAt.startsWith(query.date!));
        })
        .sort(
          (a, b) =>
            STATUS_ORDER[a.availability.status] - STATUS_ORDER[b.availability.status] ||
            (a.availability.nextStartsAt ?? "").localeCompare(b.availability.nextStartsAt ?? ""),
        )
        .map(toSummary);
      return { items, themes, fetchedAt: toJstIso(at) };
    },

    async getExperience(slug) {
      await delay();
      if (scenario === "empty") return null;
      const fixture = find((f) => f.detail.slug === slug);
      return fixture ? toDetail(fixture, now()) : null;
    },

    async getSlots(experienceId) {
      await delay();
      const fixture = find((f) => f.detail.id === experienceId);
      const at = now();
      return { experienceId, timezone: SITE_TIMEZONE, slots: fixture ? buildSlots(fixture, at) : [], fetchedAt: toJstIso(at) };
    },

    async createQuote({ experienceId, slotId, guests }): Promise<QuoteResult> {
      await delay();
      const fixture = find((f) => f.detail.id === experienceId);
      if (!fixture) return { ok: false, error: err("EXPERIENCE_NOT_FOUND") };
      if (fixture.plan.paused) return { ok: false, error: err("EXPERIENCE_PAUSED") };
      const at = now();
      const slot = buildSlots(fixture, at).find((s) => s.id === slotId);
      if (!slot) return { ok: false, error: err("SLOT_NOT_FOUND") };
      if (slot.status === "sold_out") return { ok: false, error: err("SLOT_SOLD_OUT") };
      if (slot.status === "closed") return { ok: false, error: err("SLOT_CLOSED") };
      const { min } = fixture.detail.groupSize;
      if (guests < min || guests > slot.maxGuests) return { ok: false, error: err("GUESTS_OUT_OF_RANGE") };

      const unit = slot.price.unitAmount;
      const perGroup = slot.price.unit === "per_group";
      const quantity = perGroup ? 1 : guests;
      const total = unit.amount * quantity;
      const expiresAt = new Date(at.getTime() + QUOTE_TTL_MS);
      return {
        ok: true,
        quote: {
          id: encodeQuote({ e: experienceId, s: slotId, g: guests, t: total, x: expiresAt.getTime() }),
          experienceId,
          slotId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          guests,
          lines: [
            {
              label: perGroup ? `Private group (up to ${fixture.detail.groupSize.max} guests)` : "Adult",
              unitAmount: unit,
              quantity,
              amount: { amount: total, currency: "JPY" },
            },
          ],
          total: { amount: total, currency: "JPY" },
          taxIncluded: true,
          seller: fixture.detail.seller,
          cancellation: fixture.detail.cancellation,
          expiresAt: toJstIso(expiresAt),
        },
      };
    },

    async startGuestCheckout({ quoteId, contact, acceptedPolicyVersion }): Promise<CheckoutResult> {
      await delay();
      const token = decodeQuote(quoteId);
      if (!token) return { ok: false, error: err("QUOTE_EXPIRED") };
      const trigger = MOCK_CHECKOUT_TRIGGERS[contact.email.toLowerCase() as keyof typeof MOCK_CHECKOUT_TRIGGERS];
      if (trigger) return { ok: false, error: err(trigger) };
      if (token.x < now().getTime()) return { ok: false, error: err("QUOTE_EXPIRED") };
      const fixture = find((f) => f.detail.id === token.e);
      if (!fixture || fixture.plan.paused) return { ok: false, error: err("EXPERIENCE_PAUSED") };
      if (acceptedPolicyVersion !== fixture.detail.cancellation.version) return { ok: false, error: err("TERMS_CHANGED") };
      const slot = buildSlots(fixture, now()).find((s) => s.id === token.s);
      if (!slot || slot.status !== "open") return { ok: false, error: err("SLOT_SOLD_OUT") };
      const params = new URLSearchParams({ quote: quoteId, experience: fixture.detail.slug });
      return {
        ok: true,
        checkout: { redirectUrl: `${checkoutPath}?${params}`, expiresAt: toJstIso(new Date(token.x)) },
      };
    },
  };
}

/** Reads the non-personal parts of a mock quote id (for the mock payment page). */
export function describeMockQuote(id: string) {
  const token = decodeQuote(id);
  if (!token) return null;
  const fixture = FIXTURES.find((f) => f.detail.id === token.e);
  if (!fixture) return null;
  return { slug: fixture.detail.slug, title: fixture.detail.title, slotId: token.s, guests: token.g, total: token.t };
}
