import { afterEach, describe, expect, it, vi } from "vitest";
import { doNotTrackEnabled, FUNNEL_EVENTS, sanitize, sanitizeUmamiPayload, setAnalyticsSink, track } from "./analytics";

afterEach(() => setAnalyticsSink(null));

describe("funnel events", () => {
  it("keeps only allowlisted identifier-like values", () => {
    expect(
      sanitize("checkout_start", { experience: "neighborhood-dinner-table", guests: 2, total_jpy: 13600, email: "guest@example.com" }),
    ).toEqual({ event: "checkout_start", props: { experience: "neighborhood-dinner-table", guests: 2, total_jpy: 13600 } });
  });

  it("drops personal or free-text values even in allowed fields", () => {
    const { props } = sanitize("checkout_error", { experience: "guest@example.com", error_code: "Sample Guest" });
    expect(props).toEqual({});
    expect(sanitize("experience_view", { experience: "https://x.example/?token=abc" }).props).toEqual({});
    expect(sanitize("slot_continue", { guests: Number.NaN }).props).toEqual({});
  });

  it("never allows fields that could carry personal data", () => {
    const fields = Object.values(FUNNEL_EVENTS).flat();
    for (const banned of ["email", "name", "phone", "note", "url", "token", "quote", "fullName"]) {
      expect(fields).not.toContain(banned);
    }
  });

  it("sends nothing without a sink and survives a failing sink", () => {
    expect(() => track("list_view", { theme: "all" })).not.toThrow();
    const sink = vi.fn(() => {
      throw new Error("vendor down");
    });
    setAnalyticsSink(sink);
    expect(() => track("list_view", { theme: "all" })).not.toThrow();
    expect(sink).toHaveBeenCalledWith({ event: "list_view", props: { theme: "all" } });
  });
});

describe("Umami privacy filter", () => {
  it("recognizes a browser's Do Not Track signal", () => {
    expect(doNotTrackEnabled("1")).toBe(true);
    expect(doNotTrackEnabled("yes")).toBe(true);
    expect(doNotTrackEnabled("0")).toBe(false);
  });

  it("removes booking queries and opaque result paths", () => {
    const origin = "https://experience.niho.life";
    expect(sanitizeUmamiPayload("pageview", { url: "/experiences/dinner/book?token=secret&guest=Jane" }, origin)).toMatchObject({ url: "/experiences/dinner/book" });
    expect(sanitizeUmamiPayload("pageview", { url: "/booking/opaque-token?guest=Jane" }, origin)).toMatchObject({ url: "/booking" });
  });

  it("keeps only identifier-like UTM values and reduces referrers to their origin", () => {
    const sanitized = sanitizeUmamiPayload("pageview", { url: "/experiences?utm_source=niho&utm_campaign=guest%40example.com&token=secret", referrer: "https://partner.example/path?token=private" }, "https://experience.niho.life");
    expect(sanitized).toMatchObject({ url: "/experiences?utm_source=niho", referrer: "https://partner.example" });
  });

  it("rechecks event data at the final send boundary", () => {
    const origin = "https://experience.niho.life";
    const pageview = sanitizeUmamiPayload("event", { url: "/experiences?token=private", data: { guestName: "Jane" } }, origin);
    expect(pageview).toMatchObject({ url: "/experiences" });
    expect(pageview).not.toHaveProperty("data");
    expect(sanitizeUmamiPayload("event", {
      name: "checkout_start", url: "/experiences/dinner/book?guest=Jane",
      data: { experience: "dinner", guests: 2, guestName: "Jane Doe", email: "guest@example.com", total_jpy: 1000 },
    }, origin)).toMatchObject({ url: "/experiences/dinner/book", data: { experience: "dinner", guests: 2, total_jpy: 1000 } });
    expect(sanitizeUmamiPayload("event", { name: "booking_success", url: "/booking/token" }, origin)).toBe(false);
  });
});
