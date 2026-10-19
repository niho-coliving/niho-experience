import type { ExperienceDetail, ExperienceSummary } from "../types.ts";

/** 詳細から一覧の 1 行を作る（NIHO の一覧と同じ項目だけ。残席は入れない）。 */
export function toExperienceSummary(detail: ExperienceDetail): ExperienceSummary {
  const adultPrices = detail.offers.map((offer) => offer.pricing.adultPriceYen);
  const durations = detail.offers.map((offer) => offer.durationMinutes);
  return {
    slug: detail.slug,
    title: detail.title,
    lead: detail.lead,
    contentLanguage: detail.contentLanguage,
    region: { ...detail.region },
    cover: detail.cover ? { ...detail.cover } : null,
    provider: { name: detail.provider.name, kind: detail.provider.kind },
    priceFrom: { amountYen: Math.min(...adultPrices), unit: "PER_ADULT", taxIncluded: true },
    duration: { minMinutes: Math.min(...durations), maxMinutes: Math.max(...durations) },
    updatedAt: detail.updatedAt,
  };
}
