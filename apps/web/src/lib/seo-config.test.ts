import { describe, expect, it } from "vitest";
import { createMockExperienceApi } from "@niho-experience/api-client/mock";
import { fromJst } from "@niho-experience/api-client";
import { resolveConfig } from "./resolve-config";
import { breadcrumbJsonLd, experienceJsonLd, serializeJsonLd } from "./structured-data";

const api = createMockExperienceApi({ now: () => fromJst(2026, 10, 19, 9, 0) });
const SITE = "https://experience.example.com";

async function realCopy(slug: string) {
  const e = (await api.getExperience(slug))!;
  return { ...e, synthetic: false, heroImage: { ...e.heroImage, url: "https://img.example.com/a.jpg", placeholder: false } };
}

describe("indexing guard", () => {
  it("indexes only when explicitly allowed with the real API", () => {
    expect(resolveConfig({}).indexingAllowed).toBe(false);
    expect(resolveConfig({ SITE_INDEXING: "allow" }).indexingAllowed).toBe(false);
    expect(resolveConfig({ SITE_INDEXING: "allow", EXPERIENCE_API_MODE: "http" }).indexingAllowed).toBe(true);
    expect(resolveConfig({ SITE_INDEXING: "yes", EXPERIENCE_API_MODE: "http" }).indexingAllowed).toBe(false);
  });
  it("keeps bookings on unless explicitly switched off", () => {
    expect(resolveConfig({}).bookingsEnabled).toBe(true);
    expect(resolveConfig({ BOOKINGS_ENABLED: "false" }).bookingsEnabled).toBe(false);
  });
  it("normalises the site URL", () => {
    expect(resolveConfig({ SITE_URL: "https://a.example/" }).siteUrl).toBe("https://a.example");
  });
});

describe("structured data", () => {
  it("is not emitted for synthetic listings", async () => {
    expect(experienceJsonLd((await api.getExperience("neighborhood-dinner-table"))!, SITE)).toBeNull();
  });

  it("matches the page facts and never invents ratings", async () => {
    const data = experienceJsonLd(await realCopy("neighborhood-dinner-table"), SITE)!;
    expect(data).toMatchObject({
      "@type": "TouristTrip",
      name: "Home-style dinner at a neighborhood table",
      url: `${SITE}/experiences/neighborhood-dinner-table`,
      image: ["https://img.example.com/a.jpg"],
      offers: { price: 6800, priceCurrency: "JPY", availability: "https://schema.org/InStock" },
    });
    const text = JSON.stringify(data);
    expect(text).not.toMatch(/aggregateRating|review/i);
    expect(text).not.toContain("/placeholders/");
  });

  it("marks sold out and drops the offer while paused", async () => {
    expect(experienceJsonLd(await realCopy("fish-market-breakfast"), SITE)!.offers).toMatchObject({ availability: "https://schema.org/SoldOut" });
    expect(experienceJsonLd(await realCopy("backyard-indigo-dyeing"), SITE)!.offers).toBeUndefined();
  });

  it("builds breadcrumbs and escapes script breakouts", () => {
    const crumbs = breadcrumbJsonLd(SITE, [{ name: "Experiences</script>", path: "/experiences" }]);
    expect(crumbs.itemListElement).toEqual([{ "@type": "ListItem", position: 1, name: "Experiences</script>", item: `${SITE}/experiences` }]);
    expect(serializeJsonLd(crumbs)).not.toContain("</script>");
  });
});
