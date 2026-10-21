import type { ExperienceOffer } from "@niho-experience/api-client";
import { formatYen } from "./format";

type ImageCopy = { url?: string; alt?: string | null } | null;
type HostCopy = { avatar?: ImageCopy; displayName?: string; bio?: string | null };

export function imageAlt(image: ImageCopy, fallback: string): string {
  const alt = image?.alt?.trim();
  return alt || fallback;
}

export function hostBio(host: HostCopy): string | null {
  const bio = host.bio?.trim();
  return bio || null;
}
/** Summarize children only when every option shares the same participation rules. */
export function childParticipationCopy(offers: readonly ExperienceOffer[]): { fact: string | null; price: string | null } {
  const children = offers.flatMap((offer) => offer.pricing.child ? [offer.pricing.child] : []);
  const first = children[0];
  if (!first) return { fact: null, price: null };
  if (children.length !== offers.length || children.some((child) => child.minAge !== first.minAge || child.maxAge !== first.maxAge || child.adultRequired !== first.adultRequired)) {
    return { fact: "Children: see options", price: "Child terms vary by option" };
  }
  const ages = first.minAge === first.maxAge ? `age ${first.minAge}` : `ages ${first.minAge}–${first.maxAge}`;
  const prices = [...new Set(children.map((child) => child.priceYen))];
  return {
    fact: `${ages}${first.adultRequired ? " with an adult" : ""}`,
    price: `Children ${first.minAge === first.maxAge ? first.minAge : `${first.minAge}–${first.maxAge}`} ${prices.length > 1 ? "from " : ""}${formatYen(Math.min(...prices))}`,
  };
}
