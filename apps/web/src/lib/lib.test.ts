import { describe, expect, it } from "vitest";
import { computeExpectedTotalYen } from "@niho-experience/api-client";
import { formatDuration, formatTimeRange, formatYen, jstDateKey } from "./format";

describe("public price and time display", () => {
  it("uses the canonical adult and child formula for the displayed total", () => {
    const pricing = { currency: "JPY" as const, taxIncluded: true as const, adultPriceYen: 6500, child: { priceYen: 3000, minAge: 6, maxAge: 12, adultRequired: true } };
    expect(computeExpectedTotalYen(pricing, 2, 1)).toBe(16000);
    expect(formatYen(16000)).toBe("¥16,000");
  });
  it("shows Japan time regardless of the server timezone", () => {
    expect(formatTimeRange("2026-10-23T09:00:00Z", "2026-10-23T11:30:00Z")).toBe("6:00 PM – 8:30 PM JST");
    expect(jstDateKey("2026-10-23T15:30:00Z")).toBe("2026-10-24");
    expect(formatDuration(150)).toBe("2 hr 30 min");
  });
  it("uses Japanese currency, clock, and duration conventions for Japanese pages", () => {
    expect(formatYen(16000, "ja")).toBe("￥16,000");
    expect(formatTimeRange("2026-10-23T09:00:00Z", "2026-10-23T11:30:00Z", "ja")).toBe("18:00 – 20:30 JST");
    expect(formatDuration(150, "ja")).toBe("2時間30分");
  });
});
