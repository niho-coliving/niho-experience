import { describe, expect, it } from "vitest";
import { askHostTarget, conditionRows, freeCancellationDeadline, japanTime } from "./journey-ui";

describe("conditionRows", () => {
  it("picks one hand-drawn icon per kind and keeps NIHO's text and order", () => {
    const rows = conditionRows({
      version: "v1",
      items: [
        { kind: "AGE", headline: "Ages 10 and up", detail: "Children must join with an adult", consentText: "Ages 10 and up" },
        { kind: "WEATHER", headline: "Rain or shine", detail: null, consentText: null },
      ],
    });
    expect(rows).toEqual([
      { icon: "people", headline: "Ages 10 and up", detail: "Children must join with an adult" },
      { icon: "umbrella", headline: "Rain or shine" },
    ]);
  });

  it("is empty without conditions", () => {
    expect(conditionRows(null)).toEqual([]);
  });
});

describe("askHostTarget", () => {
  it("keeps a short host name and falls back for an empty or long one", () => {
    expect(askHostTarget("Shiryu")).toBe("Shiryu");
    expect(askHostTarget("  ")).toBe("the host");
    expect(askHostTarget("A very long list of host names that would not fit a button")).toBe("the host");
  });
});

describe("japanTime", () => {
  it("is Japan time with weekday and month, whatever the zone of the machine", () => {
    // Thu 12 Nov 2026 07:00 JST = Wed 11 Nov 2026 22:00 UTC
    expect(japanTime(new Date("2026-11-11T22:00:00.000Z"))).toBe("Thu 12 Nov, 7:00 AM Japan time");
    expect(japanTime(new Date("2026-11-12T03:30:00.000Z"))).toBe("Thu 12 Nov, 12:30 PM Japan time");
    // Midnight is 12:00 AM on the next Japan day.
    expect(japanTime(new Date("2026-11-11T15:00:00.000Z"))).toBe("Thu 12 Nov, 12:00 AM Japan time");
  });
});

describe("freeCancellationDeadline", () => {
  const now = new Date("2026-10-19T01:00:00.000Z");

  it("counts back from the start by the policy's hours", () => {
    // Start Sat 14 Nov 07:00 JST (Fri 13 Nov 22:00 UTC); 48 hours before = Thu 12 Nov 07:00 JST.
    expect(freeCancellationDeadline("2026-11-13T22:00:00.000Z", 48, now)).toEqual({ state: "until", label: "Thu 12 Nov, 7:00 AM Japan time" });
    expect(freeCancellationDeadline("2026-11-13T22:00:00.000Z", 24, now)).toEqual({ state: "until", label: "Fri 13 Nov, 7:00 AM Japan time" });
  });

  it("says nothing for a non-refundable option or an unreadable start", () => {
    expect(freeCancellationDeadline("2026-11-13T22:00:00.000Z", null, now)).toBeNull();
    expect(freeCancellationDeadline("not a date", 48, now)).toBeNull();
  });

  it("reports that free cancellation already ended when the start is inside the window", () => {
    expect(freeCancellationDeadline("2026-10-20T01:00:00.000Z", 48, now)).toEqual({ state: "ended" });
    expect(freeCancellationDeadline("2026-10-20T01:00:01.000Z", 24, now)).toEqual({ state: "until", label: japanTime(new Date("2026-10-19T01:00:01.000Z")) });
  });
});
