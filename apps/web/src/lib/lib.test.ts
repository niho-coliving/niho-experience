import { describe, expect, it } from "vitest";
import { ruleLabel } from "@/components/Policy";
import { bookingHref, isAllowedCheckoutUrl, parseSelection } from "./checkout";
import { filtersHref, parseFilters } from "./filters";
import { formatDuration, formatLanguages, formatTimeRange, formatYen, jstDateKey } from "./format";

describe("format", () => {
  it("shows yen without decimals", () => {
    expect(formatYen({ amount: 13600, currency: "JPY" })).toBe("¥13,600");
  });
  it("shows times in JST regardless of the server timezone", () => {
    expect(formatTimeRange("2026-10-23T18:00:00+09:00", "2026-10-23T20:30:00+09:00")).toBe("6:00 PM – 8:30 PM JST");
    expect(jstDateKey("2026-10-23T23:30:00+09:00")).toBe("2026-10-23");
    expect(jstDateKey("2026-10-23T15:30:00Z")).toBe("2026-10-24");
  });
  it("formats duration and languages", () => {
    expect(formatDuration(150)).toBe("2 hr 30 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatLanguages(["en", "ja"])).toBe("English, Japanese");
  });
});

describe("filters", () => {
  it("keeps valid filters and drops malformed ones", () => {
    expect(parseFilters({ theme: "craft", date: "2026-10-23" })).toEqual({ theme: "craft", date: "2026-10-23" });
    expect(parseFilters({ theme: "<script>", date: "tomorrow" })).toEqual({});
    expect(parseFilters({ theme: ["food", "craft"] })).toEqual({ theme: "food" });
  });
  it("builds shareable URLs and removes filters", () => {
    expect(filtersHref({ theme: "food" }, { date: "2026-10-23" })).toBe("/experiences?theme=food&date=2026-10-23");
    expect(filtersHref({ theme: "food", date: "2026-10-23" }, { theme: null })).toBe("/experiences?date=2026-10-23");
    expect(filtersHref({})).toBe("/experiences");
  });
});

describe("checkout redirect allowlist", () => {
  it("allows only Stripe Checkout in http mode", () => {
    expect(isAllowedCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_123", "http")).toBe(true);
    expect(isAllowedCheckoutUrl("https://checkout.stripe.com.evil.example/pay", "http")).toBe(false);
    expect(isAllowedCheckoutUrl("http://checkout.stripe.com/pay", "http")).toBe(false);
    expect(isAllowedCheckoutUrl("https://user:pw@checkout.stripe.com/pay", "http")).toBe(false);
    expect(isAllowedCheckoutUrl("/preview/checkout?quote=x", "http")).toBe(false);
  });
  it("allows only the local mock page in mock mode", () => {
    expect(isAllowedCheckoutUrl("/preview/checkout?quote=x", "mock")).toBe(true);
    expect(isAllowedCheckoutUrl("//evil.example/preview/checkout?", "mock")).toBe(false);
    expect(isAllowedCheckoutUrl("https://checkout.stripe.com/c/pay", "mock")).toBe(false);
  });
});

describe("booking selection", () => {
  it("parses slot and guests from the URL", () => {
    expect(parseSelection({ slot: "exp_a.20261023.1800", guests: "2" })).toEqual({ slotId: "exp_a.20261023.1800", guests: 2 });
    expect(parseSelection({ slot: "../../x", guests: "2" })).toBeNull();
    expect(parseSelection({ slot: "a", guests: "0" })).toBeNull();
    expect(parseSelection({ slot: "a", guests: "2.5" })).toBeNull();
    expect(bookingHref("dinner", "a.b", 3)).toBe("/experiences/dinner/book?slot=a.b&guests=3");
  });
});

describe("cancellation labels", () => {
  it("describes each window from the rules", () => {
    const rules = [
      { hoursBefore: 72, refundPercent: 100 },
      { hoursBefore: 24, refundPercent: 50 },
      { hoursBefore: 0, refundPercent: 0 },
    ];
    expect(rules.map((_, i) => ruleLabel(rules, i))).toEqual([
      "3 days or more before",
      "24 hours or more before",
      "Less than 24 hours before, or no-show",
    ]);
  });
});
