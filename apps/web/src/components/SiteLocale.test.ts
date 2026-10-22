import { describe, expect, it } from "vitest";
import { localeHref } from "./SiteLocale";
import { languageSwitchTarget } from "@/lib/locale-links";

describe("localeHref", () => {
  it("keeps English URLs and prefixes Japanese public-site navigation", () => {
    expect(localeHref("/experiences/example?date=2026-10-24", "en")).toBe("/experiences/example?date=2026-10-24");
    expect(localeHref("/", "ja")).toBe("/ja");
    expect(localeHref("/experiences/example/book?date=2026-10-24", "ja")).toBe("/ja/experiences/example/book?date=2026-10-24");
    expect(localeHref("/host", "ja")).toBe("/ja/host");
  });

  it("does not localize the separate host console or external links", () => {
    expect(localeHref("/host/login", "ja")).toBe("/host/login");
    expect(localeHref("/host/home", "ja")).toBe("/host/home");
    expect(localeHref("https://niho.life/help", "ja")).toBe("https://niho.life/help");
    expect(localeHref("/api/public/experiences", "ja")).toBe("/api/public/experiences");
    expect(localeHref("/unknown?token=secret", "ja")).toBe("/unknown?token=secret");
    expect(localeHref("#details", "ja")).toBe("#details");
  });

  it("language switch carries only browse-safe fields for the destination page", () => {
    const counterparts = { "/": "/ja", "/experiences": "/ja/experiences", "/host": "/ja/host" };
    expect(languageSwitchTarget("/experiences", "q=coffee&theme=food&date=2026-10-24&guests=2&token=secret&contact=user%40example.com", counterparts))
      .toBe("/ja/experiences?q=coffee&theme=food&date=2026-10-24&guests=2");
    expect(languageSwitchTarget("/ja/experiences", "q=coffee&offer=private&token=secret", counterparts)).toBe("/experiences?q=coffee");
    expect(languageSwitchTarget("/host", "providerId=private&token=secret", counterparts)).toBe("/ja/host");
    expect(languageSwitchTarget("/experiences/tea/book", "date=2026-10-24&guests=2&offer=offer-1&contact=private", { ...counterparts, "/experiences/tea/book": "/ja/experiences/tea/book" }))
      .toBe("/ja/experiences/tea/book?date=2026-10-24&guests=2&offer=offer-1");
  });
});
