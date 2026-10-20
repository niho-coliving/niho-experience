import type { ExperienceDetail, ExperienceOffer, ExperienceSummary, PublicImage } from "@niho-experience/api-client";
import { formatDuration, formatYen } from "./format";
import { joinAnd, scheduleSummary } from "./schedule";

/**
 * Card display model. The catalog summary has no hosts, weekdays or capacity, so the
 * server merges each listed experience with its public detail. When a detail could
 * not be read the card falls back to the summary alone instead of disappearing.
 */

export type Face = { name: string; initial: string; image: PublicImage | null };

/** Only what the browser needs to match availability to party size. */
export type CardOffer = Pick<ExperienceOffer, "id" | "maxPartySize">;

export type CardModel = {
  slug: string;
  title: string;
  lead: string;
  cover: PublicImage | null;
  /** "with Takuya, Hasami & わか", or the provider name when no hosts are listed. */
  withLabel: string;
  face: Face;
  /** "Up to 8 guests" / "Private · 2–4 guests". Null without the detail. */
  groupLabel: string | null;
  durationLabel: string;
  language: { short: string; full: string } | null;
  /** "Tue · Thu · Sat · 6:00 PM" (JST). Null without the detail. */
  scheduleLabel: string | null;
  priceLabel: string;
  /** True when options have different adult prices, so the price reads "From ¥X". */
  priceIsFrom: boolean;
  offers: CardOffer[];
};

/** First character (grapheme-safe for kana and emoji), upper-cased for Latin names. */
export function initialOf(name: string): string {
  const trimmed = name.trim();
  const first = Array.from(trimmed)[0] ?? "?";
  return first.toLocaleUpperCase("en-US");
}

export function faceOf(e: Pick<ExperienceDetail, "hosts" | "provider">): Face {
  const host = e.hosts[0];
  if (host) return { name: host.displayName, initial: initialOf(host.displayName), image: host.avatar };
  return { name: e.provider.name, initial: initialOf(e.provider.name), image: e.provider.logo };
}

export function hostNames(e: Pick<ExperienceDetail, "hosts" | "provider">): string {
  return e.hosts.length ? joinAnd(e.hosts.map((host) => host.displayName)) : e.provider.name;
}

/** "Up to 8 guests"; when every option needs more than one guest, "Private · 2–4 guests". */
export function groupSizeLabel(offers: Pick<ExperienceOffer, "capacity" | "maxPartySize" | "minimumParticipants">[]): string | null {
  if (!offers.length) return null;
  if (offers.every((offer) => offer.minimumParticipants > 1)) {
    const min = Math.min(...offers.map((offer) => offer.minimumParticipants));
    const max = Math.max(...offers.map((offer) => offer.maxPartySize));
    return min === max ? `Private · ${max} guests` : `Private · ${min}–${max} guests`;
  }
  const capacity = Math.max(...offers.map((offer) => offer.capacity));
  return capacity === 1 ? "1 guest" : `Up to ${capacity} guests`;
}

const LANGUAGE_CODES: Record<string, string> = { English: "EN", Japanese: "JA" };

/**
 * Shortens the host's language note for cards: "English & Japanese" → "EN · JA",
 * "Japanese & basic English" → "JA · basic EN". The full note stays on the detail page.
 */
export function shortLanguageNote(note: string): string {
  const text = note.trim();
  if (/english-speaking guide/i.test(text)) return "English guide";
  const parts = text
    .replace(/\b(\w+) \(basic\)/gi, "basic $1")
    .split(/\s*(?:&|,|\band\b|\bwith\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return text;
  return parts.map((part) => part.replace(/\b(English|Japanese)\b/g, (word) => LANGUAGE_CODES[word] ?? word)).join(" · ");
}

function durationLabel(summary: ExperienceSummary): string {
  const { minMinutes, maxMinutes } = summary.duration;
  return minMinutes === maxMinutes ? formatDuration(minMinutes) : `${formatDuration(minMinutes)}–${formatDuration(maxMinutes)}`;
}

export function buildCardModel(summary: ExperienceSummary, detail: ExperienceDetail | null): CardModel {
  const base = {
    slug: summary.slug,
    title: summary.title,
    lead: summary.lead,
    cover: summary.cover,
    durationLabel: durationLabel(summary),
    priceLabel: formatYen(summary.priceFrom.amountYen),
  };
  if (!detail) {
    return {
      ...base,
      withLabel: `with ${summary.provider.name}`,
      face: { name: summary.provider.name, initial: initialOf(summary.provider.name), image: null },
      groupLabel: null,
      language: null,
      scheduleLabel: null,
      priceIsFrom: false,
      offers: [],
    };
  }
  return {
    ...base,
    withLabel: `with ${hostNames(detail)}`,
    face: faceOf(detail),
    groupLabel: groupSizeLabel(detail.offers),
    language: { short: shortLanguageNote(detail.languageNote), full: detail.languageNote },
    scheduleLabel: scheduleSummary(detail.offers),
    priceIsFrom: new Set(detail.offers.map((offer) => offer.pricing.adultPriceYen)).size > 1,
    offers: detail.offers.map((offer) => ({ id: offer.id, maxPartySize: offer.maxPartySize })),
  };
}

export function buildCardModels(summaries: ExperienceSummary[], details: ReadonlyMap<string, ExperienceDetail>): CardModel[] {
  return summaries.map((summary) => buildCardModel(summary, details.get(summary.slug) ?? null));
}
