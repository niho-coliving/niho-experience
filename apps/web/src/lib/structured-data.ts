import type { ExperienceDetailForSite } from "./experience-types";
import { safeHttpsUrl } from "./safe-url";

type JsonLd = Record<string, unknown>;

export function breadcrumbJsonLd(siteUrl: string, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

/** Public details can be described in production. Preview fixtures are never emitted as real structured data. */
export function experienceJsonLd(e: ExperienceDetailForSite, siteUrl: string, preview = false, bookingsEnabled = true): JsonLd | null {
  if (preview) return null;
  const url = safeHttpsUrl(e.canonicalUrl) ?? `${siteUrl}/experiences/${e.slug}`;
  const images = [e.cover, ...e.photos]
    .filter((image): image is NonNullable<typeof image> => image !== null)
    .map((image) => safeHttpsUrl(image.url))
    .filter((image): image is string => image !== null);
  const lowestAdultPrice = Math.min(...e.offers.map((offer) => offer.pricing.adultPriceYen));

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: e.title,
    description: e.lead,
    url,
    ...(images.length ? { image: images } : {}),
    inLanguage: e.contentLanguage.toLowerCase(),
    provider: { "@type": "Organization", name: e.provider.name },
    ...(bookingsEnabled && e.booking.checkoutAvailable && e.offers.length
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: lowestAdultPrice,
            priceCurrency: "JPY",
            seller: { "@type": "Organization", name: e.seller.displayName },
          },
        }
      : {}),
  };
}

/** Escapes script-breaking characters before embedding JSON in HTML. */
export const serializeJsonLd = (data: JsonLd) => JSON.stringify(data).replace(/</g, "\\u003c");
