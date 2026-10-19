import { describe, expect, it } from "vitest";
import { captureFirstTouchAttribution, getCheckoutAttribution } from "./attribution";

const ID = "11111111-2222-4333-8444-555555555555";

class MemoryStorage {
  #values = new Map<string, string>();
  getItem(key: string) { return this.#values.get(key) ?? null; }
  setItem(key: string, value: string) { this.#values.set(key, value); }
}

describe("first-touch checkout attribution", () => {
  it("keeps only safe UTM values and the landing page type", () => {
    const storage = new MemoryStorage();
    expect(captureFirstTouchAttribution(
      "https://experience.niho.life/experiences/indigo?utm_source=partner_a01&utm_medium=referral&utm_campaign=pilot_2026q4&utm_content=guest%40example.com&utm_term=private",
      storage,
      false,
      () => ID,
    )).toBe(true);
    expect(getCheckoutAttribution(storage, false)).toEqual({
      attributionId: ID,
      utmSource: "partner_a01",
      utmMedium: "referral",
      utmCampaign: "pilot_2026q4",
      landingPageType: "DETAIL",
    });
    expect(JSON.stringify(getCheckoutAttribution(storage, false))).not.toContain("guest@example.com");
  });

  it("preserves the first valid source when later links have different UTMs", () => {
    const storage = new MemoryStorage();
    captureFirstTouchAttribution("https://experience.niho.life/?utm_source=niho_site", storage, false, () => ID);
    captureFirstTouchAttribution("https://experience.niho.life/experiences?utm_source=partner_a01", storage, false, () => "22222222-2222-4222-8222-222222222222");
    expect(getCheckoutAttribution(storage, false)).toEqual({ attributionId: ID, utmSource: "niho_site", landingPageType: "HOME" });
  });

  it("stores and sends nothing when DNT is enabled", () => {
    const storage = new MemoryStorage();
    expect(captureFirstTouchAttribution("https://experience.niho.life/?utm_source=niho_site", storage, true, () => ID)).toBe(false);
    expect(getCheckoutAttribution(storage, true)).toBeUndefined();
    expect(getCheckoutAttribution(storage, false)).toBeUndefined();
  });

  it("ignores malformed storage and values that could contain personal data", () => {
    const storage = new MemoryStorage();
    storage.setItem("niho-experience:first-touch:v1", JSON.stringify({ attributionId: "not-a-uuid", utmSource: "guest@example.com", utmMedium: "social" }));
    expect(getCheckoutAttribution(storage, false)).toEqual({ utmMedium: "social" });
  });
});
