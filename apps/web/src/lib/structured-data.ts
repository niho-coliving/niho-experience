import type { ExperienceDetail } from "@niho-experience/api-client";

type JsonLd = Record<string, unknown>;

const AVAILABILITY: Record<ExperienceDetail["availability"]["status"], string | null> = {
  bookable: "https://schema.org/InStock",
  sold_out: "https://schema.org/SoldOut",
  no_upcoming_dates: null,
  paused: null,
};

export function breadcrumbJsonLd(siteUrl: string, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: `${siteUrl}${item.path}` })),
  };
}

/**
 * Describes only what the page shows. Returns null for synthetic listings.
 * Never adds ratings, reviews or sales counts (#12).
 */
export function experienceJsonLd(e: ExperienceDetail, siteUrl: string): JsonLd | null {
  if (e.synthetic) return null;
  const url = `${siteUrl}/experiences/${e.slug}`;
  const images = [e.heroImage, ...e.gallery].filter((img) => !img.placeholder).map((img) => img.url);
  const availability = AVAILABILITY[e.availability.status];
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: e.title,
    description: e.summary,
    url,
    ...(images.length ? { image: images } : {}),
    inLanguage: e.languages,
    touristType: e.themes.map((t) => t.label),
    provider: { "@type": "Organization", name: e.seller.displayName },
    ...(availability
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: e.price.from.amount,
            priceCurrency: e.price.from.currency,
            availability,
            ...(e.availability.nextStartsAt ? { validFrom: e.availability.nextStartsAt } : {}),
          },
        }
      : {}),
  };
}

/** Serialises for a <script type="application/ld+json"> without allowing "</script>" breakouts. */
export const serializeJsonLd = (data: JsonLd) => JSON.stringify(data).replace(/</g, "\\u003c");
