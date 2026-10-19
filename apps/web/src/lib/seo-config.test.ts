import { describe, expect, it } from "vitest";
import { buildFixtureExperiences } from "@niho-experience/api-client/mock";
import { resolveConfig } from "./resolve-config";
import { breadcrumbJsonLd, experienceJsonLd, serializeJsonLd } from "./structured-data";

const SITE = "https://experience.example.com";
const experiences = buildFixtureExperiences({ imageBaseUrl: "https://images.example.com" });
const dinner = { ...experiences[0]!, canonicalUrl: `${SITE}/experiences/home-cooked-dinner-with-locals` };

describe("runtime config", () => {
  it("indexes only when explicitly allowed with the real API", () => {
    expect(resolveConfig({}).indexingAllowed).toBe(false);
    expect(resolveConfig({ SITE_INDEXING: "allow" }).indexingAllowed).toBe(false);
    expect(resolveConfig({ SITE_INDEXING: "allow", EXPERIENCE_API_MODE: "http" }).indexingAllowed).toBe(true);
    expect(resolveConfig({ SITE_INDEXING: "yes", EXPERIENCE_API_MODE: "http" }).indexingAllowed).toBe(false);
  });
  it("shows the pilot catalog only when asked, and never lets it be indexed", () => {
    expect(resolveConfig({}).mockCatalog).toBe("synthetic");
    expect(resolveConfig({ MOCK_CATALOG: "pilot" }).mockCatalog).toBe("pilot");
    expect(resolveConfig({ MOCK_CATALOG: "other" }).mockCatalog).toBe("synthetic");
    expect(resolveConfig({ MOCK_CATALOG: "pilot", SITE_INDEXING: "allow" }).indexingAllowed).toBe(false);
  });
  it("keeps bookings on unless explicitly switched off", () => {
    expect(resolveConfig({}).bookingsEnabled).toBe(true);
    expect(resolveConfig({ BOOKINGS_ENABLED: "false" }).bookingsEnabled).toBe(false);
  });
  it("normalises the site URL and gives the public API a safe default", () => {
    expect(resolveConfig({ SITE_URL: "https://a.example/" }).siteUrl).toBe("https://a.example");
    expect(resolveConfig({}).nihoWebOrigin).toBe("https://niho.life");
    expect(resolveConfig({ NEXT_PUBLIC_NIHO_WEB_ORIGIN: "https://app-stg.niho.life" }).nihoWebOrigin).toBe("https://app-stg.niho.life");
  });
});

describe("structured data", () => {
  it("omits experience data in preview", () => {
    expect(experienceJsonLd(dinner, SITE, true)).toBeNull();
  });

  it("describes public detail facts without inventing availability or ratings", () => {
    const data = experienceJsonLd(dinner, SITE)!;
    const expectedPrice = Math.min(...dinner.offers.map((offer) => offer.pricing.adultPriceYen));
    expect(data).toMatchObject({
      "@type": "TouristTrip",
      name: dinner.title,
      url: dinner.canonicalUrl,
      image: [dinner.cover!.url, ...dinner.photos.map((image) => image.url)],
      inLanguage: "en",
      provider: { name: dinner.provider.name },
      offers: { price: expectedPrice, priceCurrency: "JPY", seller: { name: dinner.seller.displayName } },
    });
    const text = JSON.stringify(data);
    expect(text).not.toMatch(/aggregateRating|review|availability/i);
  });

  it("omits an offer when checkout is paused", () => {
    const paused = experiences.find((experience) => !experience.booking.checkoutAvailable)!;
    expect(experienceJsonLd(paused, SITE)?.offers).toBeUndefined();
  });

  it("builds breadcrumbs and escapes script breakouts", () => {
    const crumbs = breadcrumbJsonLd(SITE, [{ name: "Experiences</script>", path: "/experiences" }]);
    expect(crumbs.itemListElement).toEqual([{ "@type": "ListItem", position: 1, name: "Experiences</script>", item: `${SITE}/experiences` }]);
    expect(serializeJsonLd(crumbs)).not.toContain("</script>");
  });
});
