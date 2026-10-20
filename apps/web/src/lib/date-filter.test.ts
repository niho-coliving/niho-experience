import { describe, expect, it } from "vitest";
import type { Occurrence } from "@niho-experience/api-client";
import { dayOption, fitsPartySize, jstToday, matchingOccurrence, nextBookable, parseDateParam, parseGuestsParam, upcomingDays } from "./date-filter";

const occurrence = (overrides: Partial<Occurrence>): Occurrence => ({
  offerId: "offer_a",
  date: "2026-10-24",
  startAt: "2026-10-24T09:00:00.000Z",
  endAt: "2026-10-24T11:00:00.000Z",
  seatsLeft: 4,
  bookable: true,
  reason: null,
  ...overrides,
});

describe("date chips (JST)", () => {
  it("counts days in Japan time, not the server's time zone", () => {
    // 23:30 UTC on the 20th is already the 21st in Japan.
    expect(jstToday(new Date("2026-10-20T23:30:00Z"))).toBe("2026-10-21");
    const days = upcomingDays(new Date("2026-10-20T23:30:00Z"), 3);
    expect(days.map((day) => day.key)).toEqual(["2026-10-21", "2026-10-22", "2026-10-23"]);
    expect(days[0]).toEqual({ key: "2026-10-21", weekday: "Wed", day: "21", label: "Wed 21 Oct" });
  });

  it("crosses month ends", () => {
    expect(upcomingDays(new Date("2026-10-30T03:00:00Z"), 3).map((day) => day.label)).toEqual(["Fri 30 Oct", "Sat 31 Oct", "Sun 1 Nov"]);
    expect(dayOption("2026-12-31").label).toBe("Thu 31 Dec");
  });

  it("accepts only an offered date and a 1–8 party size from the URL", () => {
    const days = upcomingDays(new Date("2026-10-20T03:00:00Z"), 14);
    expect(parseDateParam("2026-10-24", days)).toBe("2026-10-24");
    expect(parseDateParam("2026-12-24", days)).toBeNull();
    expect(parseDateParam("", days)).toBeNull();
    expect(parseDateParam(["2026-10-24"], days)).toBeNull();
    expect(parseGuestsParam("2")).toBe(2);
    expect(parseGuestsParam("9")).toBe(1);
    expect(parseGuestsParam("0")).toBe(1);
    expect(parseGuestsParam("two")).toBe(1);
    expect(parseGuestsParam(undefined)).toBe(1);
  });
});

describe("matching a party to a day", () => {
  const offers = [{ id: "offer_a", maxPartySize: 4 }];

  it("needs a bookable session that day with enough seats and a large enough party limit", () => {
    expect(matchingOccurrence([occurrence({})], offers, "2026-10-24", 2)).not.toBeNull();
    expect(matchingOccurrence([occurrence({})], offers, "2026-10-25", 2)).toBeNull();
    expect(matchingOccurrence([occurrence({ seatsLeft: 1 })], offers, "2026-10-24", 2)).toBeNull();
    expect(matchingOccurrence([occurrence({ bookable: false, reason: "FULL", seatsLeft: 0 })], offers, "2026-10-24", 1)).toBeNull();
    expect(matchingOccurrence([occurrence({ seatsLeft: 10 })], offers, "2026-10-24", 5)).toBeNull();
  });

  it("judges by seats alone when the card has no option data", () => {
    expect(matchingOccurrence([occurrence({ seatsLeft: 10 })], [], "2026-10-24", 5)).not.toBeNull();
  });

  it("narrows by party size alone when no date is chosen", () => {
    expect(fitsPartySize(offers, 4)).toBe(true);
    expect(fitsPartySize(offers, 5)).toBe(false);
    expect(fitsPartySize([], 8)).toBe(true);
  });

  it("lists the next bookable sessions soonest first", () => {
    const list = [
      occurrence({ date: "2026-10-27", startAt: "2026-10-27T09:00:00.000Z" }),
      occurrence({ date: "2026-10-22", startAt: "2026-10-22T09:00:00.000Z", bookable: false, reason: "CUTOFF" }),
      occurrence({ date: "2026-10-24", startAt: "2026-10-24T09:00:00.000Z" }),
    ];
    expect(nextBookable(list, 3).map((item) => item.date)).toEqual(["2026-10-24", "2026-10-27"]);
  });
});
