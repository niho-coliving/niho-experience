import { afterEach, describe, expect, it, vi } from "vitest";
import { FUNNEL_EVENTS, sanitize, setAnalyticsSink, track } from "./analytics";

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
