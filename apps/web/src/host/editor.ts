import { yen } from "./format";
import type { HostExperience, HostExperienceContent, HostListing, HostOffer, Weekday } from "./types";

/*
 * The experience editor's rules (#89), apart from the screen so they can be tested:
 * what a listing still needs, how its one state moves, how offers read in the rail, and
 * the list row's summary of a page. The limits follow NIHO's own page editor; #87's
 * contract replaces them.
 */

export const EDITOR_LIMITS = {
  title: 95,
  lead: 400,
  dayLanguage: 60,
  highlights: { items: 6, length: 120 },
  description: 4000,
  /** 含まれるもの・含まれないもの・向かない人 */
  list: { items: 8, length: 120 },
  knowBeforeYouGo: { items: 8, length: 200 },
  timeline: { items: 6, title: 60, text: 200 },
  meetingArea: 120,
  entrance: 400,
  photos: 20,
  offers: 12,
  offerName: 60,
  questions: { items: 5, length: 200 },
} as const;

/** 掲載までに必要, in the order the rail lists them. */
export const LISTING_REQUIREMENTS = ["題名", "表紙写真", "料金", "定員", "開催曜日", "開始時刻", "所要時間"] as const;
export type ListingRequirement = (typeof LISTING_REQUIREMENTS)[number];

function positive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

/** What one offer still lacks before the page can be listed. */
export function offerGaps(offer: HostOffer): ListingRequirement[] {
  const gaps: ListingRequirement[] = [];
  if (!positive(offer.adultPriceYen)) gaps.push("料金");
  if (!positive(offer.capacity)) gaps.push("定員");
  if (offer.weekdays.length === 0) gaps.push("開催曜日");
  if (!offer.startTime) gaps.push("開始時刻");
  if (!positive(offer.durationMinutes)) gaps.push("所要時間");
  return gaps;
}

/**
 * 掲載までに必要: what the page lacks before it can be submitted, from its text and its
 * offers. A page with no offer asks for 料金, since an offer is where the price goes.
 */
export function listingRequirements(content: Pick<HostExperienceContent, "title" | "photos" | "offers">): ListingRequirement[] {
  const missing = new Set<ListingRequirement>();
  if (!content.title.trim()) missing.add("題名");
  if (content.photos.length === 0) missing.add("表紙写真");
  if (content.offers.length === 0) missing.add("料金");
  for (const offer of content.offers) for (const gap of offerGaps(offer)) missing.add(gap);
  return LISTING_REQUIREMENTS.filter((item) => missing.has(item));
}

/** 掲載を申請: a draft, or a paused listing, goes to NIHO's review, requested today. */
export function submitListing(listing: HostListing, today: string): HostListing {
  if (listing.status !== "draft" && listing.status !== "paused") return listing;
  return { ...listing, status: "review", requestedOn: today };
}

/** 掲載を止める: a live listing leaves the traveler site. */
export function pauseListing(listing: HostListing): HostListing {
  return listing.status === "live" ? { ...listing, status: "paused" } : listing;
}

/** 申請を取り下げる: a listing under review goes back to being a draft. */
export function withdrawListing(listing: HostListing): HostListing {
  return listing.status === "review" ? { status: "draft" } : listing;
}

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** Screens list the days from Monday. */
export const WEEKDAYS_FROM_MONDAY: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function weekdayLabel(day: Weekday): string {
  return WEEKDAY_JA[day];
}

/** [6, 2, 4] → ["火", "木", "土"]; [0, 6] → ["土", "日"]. */
export function weekdayLabels(weekdays: readonly Weekday[]): string[] {
  return WEEKDAYS_FROM_MONDAY.filter((day) => weekdays.includes(day)).map(weekdayLabel);
}

/** An offer row's second line: "18:00 · 120分 · 定員8". What is not set yet is left out. */
export function offerScheduleLabel(offer: HostOffer): string {
  const parts = [offer.startTime, positive(offer.durationMinutes) ? `${offer.durationMinutes}分` : "", positive(offer.capacity) ? `定員${offer.capacity}` : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : "日程が未入力";
}

/** "¥30,000〜": the adult price a booking starts from. */
export function offerPriceLabel(offer: HostOffer): string {
  return positive(offer.adultPriceYen) ? `${yen(offer.adultPriceYen)}〜` : "料金が未入力";
}

/** "子ども ¥12,000", under the adult price, when the offer has a child price. */
export function offerChildPriceLabel(offer: HostOffer): string | null {
  return offer.childPriceYen === null ? null : `子ども ${yen(offer.childPriceYen)}`;
}

/** 表紙にする: the photo at `index` moves to the front; the others keep their order. */
export function makeCover<T>(photos: readonly T[], index: number): T[] {
  const chosen = photos[index];
  if (index <= 0 || chosen === undefined) return [...photos];
  return [chosen, ...photos.slice(0, index), ...photos.slice(index + 1)];
}

/** 並び替え: the item at `index` changes places with the one above (-1) or below (+1). */
export function moveItem<T>(items: readonly T[], index: number, by: -1 | 1): T[] {
  const next = [...items];
  const target = index + by;
  const a = next[index];
  const b = next[target];
  if (a === undefined || b === undefined) return next;
  next[index] = b;
  next[target] = a;
  return next;
}

/**
 * What the experience list and the home rows show for a page: the cover, the first
 * offer's schedule (once it is complete) and, for a draft, what it still needs.
 */
export function listingSummary(page: Pick<HostExperience, "status" | "title" | "photos" | "offers">): Pick<HostExperience, "cover" | "schedule" | "missing"> {
  const first = page.offers[0];
  const schedule =
    first && positive(first.adultPriceYen) && positive(first.capacity) && positive(first.durationMinutes) && first.startTime && first.weekdays.length > 0
      ? { weekdays: weekdayLabels(first.weekdays), start: first.startTime, durationMinutes: first.durationMinutes, capacity: first.capacity, priceFromYen: first.adultPriceYen }
      : null;
  return { cover: page.photos[0]?.url ?? null, schedule, missing: page.status === "draft" ? listingRequirements(page) : [] };
}

/** The part of an experience that 保存 keeps. */
export function experienceContent(experience: HostExperience): HostExperienceContent {
  const { title, language, lead, dayLanguage, highlights, description, included, notIncluded, notSuitableFor, timeline, meeting, knowBeforeYouGo, photos, offers } = experience;
  return { title, language, lead, dayLanguage, highlights, description, included, notIncluded, notSuitableFor, timeline, meeting, knowBeforeYouGo, photos, offers };
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  }
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => sameValue(left[key], right[key]));
}

/** Whether two versions of a page are the same, whatever order their fields were written in. 保存 shows only when they differ. */
export function sameContent(a: HostExperienceContent, b: HostExperienceContent): boolean {
  return sameValue(a, b);
}

/** An offer as the dialog edits it: numbers as typed. */
export interface OfferDraft {
  name: string;
  adultPrice: string;
  childPrice: string;
  capacity: string;
  startTime: string;
  duration: string;
  weekdays: Weekday[];
  closedDates: string[];
  questions: string[];
}

export function emptyOffer(id: string): HostOffer {
  return { id, name: "", adultPriceYen: null, childPriceYen: null, capacity: null, startTime: "", durationMinutes: null, weekdays: [], closedDates: [], questions: [] };
}

const typed = (value: number | null) => (value === null ? "" : String(value));

export function offerDraft(offer: HostOffer): OfferDraft {
  return {
    name: offer.name,
    adultPrice: typed(offer.adultPriceYen),
    childPrice: typed(offer.childPriceYen),
    capacity: typed(offer.capacity),
    startTime: offer.startTime,
    duration: typed(offer.durationMinutes),
    weekdays: [...offer.weekdays],
    closedDates: [...offer.closedDates],
    questions: [...offer.questions],
  };
}

function wholeOrNull(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

/** The dialog's 保存: blank numbers stay unset, the days are sorted, empty questions are dropped. */
export function offerFromDraft(id: string, draft: OfferDraft): HostOffer {
  return {
    id,
    name: draft.name.trim(),
    adultPriceYen: wholeOrNull(draft.adultPrice),
    childPriceYen: wholeOrNull(draft.childPrice),
    capacity: wholeOrNull(draft.capacity),
    startTime: draft.startTime,
    durationMinutes: wholeOrNull(draft.duration),
    weekdays: [...new Set(draft.weekdays)].sort((a, b) => a - b),
    closedDates: [...new Set(draft.closedDates)].sort(),
    questions: draft.questions.map((question) => question.trim()).filter(Boolean),
  };
}
