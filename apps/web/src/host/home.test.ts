import { describe, expect, it } from "vitest";
import { dateWithWeekdayJa, durationJa, experienceMeta, todayInJapan, yen } from "./format";
import { homeMonth, homeTodos, homeUpcoming } from "./home";
import { MOCK_KITCHEN_BOOKINGS, MOCK_TODAY } from "./mock/bookings";
import { MOCK_KITCHEN_EXPERIENCES } from "./mock/experiences";
import { MOCK_KITCHEN_SALES, MOCK_SALES_PERIOD } from "./mock/sales";
import type { HostBooking } from "./types";

describe("host formatting", () => {
  it("writes dates, money and durations the Japanese way", () => {
    expect(dateWithWeekdayJa("2026-10-22")).toBe("10月22日（木）");
    expect(dateWithWeekdayJa("2026-10-27")).toBe("10月27日（火）");
    expect(yen(270000)).toBe("¥270,000");
    expect(yen(-60000)).toBe("−¥60,000");
    expect([45, 90, 120].map(durationJa)).toEqual(["45分", "1時間30分", "2時間"]);
  });

  it("takes today's date in Japan, not in the server's time zone", () => {
    expect(todayInJapan(Date.UTC(2026, 9, 21, 14, 59))).toBe("2026-10-21");
    expect(todayInJapan(Date.UTC(2026, 9, 21, 15, 0))).toBe("2026-10-22");
  });

  it("summarizes a listing, or what a draft still needs", () => {
    expect(experienceMeta(MOCK_KITCHEN_EXPERIENCES[0]!)).toBe("火・木・土 18:00 · 2時間 · 定員8 · ¥30,000〜");
    expect(experienceMeta(MOCK_KITCHEN_EXPERIENCES[2]!)).toBe("表紙写真・料金が未入力");
    expect(experienceMeta({ schedule: null, missing: [] })).toBe("日程と料金が未入力");
  });
});

describe("host home", () => {
  it("puts requests to answer first, then drafts, then listings under review", () => {
    const todos = homeTodos(MOCK_KITCHEN_EXPERIENCES, MOCK_KITCHEN_BOOKINGS, MOCK_TODAY);
    expect(todos.map((todo) => [todo.status.label, todo.title, todo.action?.label ?? null])).toEqual([
      ["承認待ち", "承認待ちの申込が 2 件", "確認する"],
      ["下書き", "Roast Your Own Coffee in a Kamakura Living Room の原稿を仕上げる", "編集する"],
      ["審査待ち", "Mend a Broken Bowl with a Kamakura Restorer", null],
    ]);
    // Two requests or more are one row that opens 承認待ち, with the nearest deadline.
    expect(todos[0]!.detail).toBe("最も早い承認期限 今日 22:00");
    expect(todos[0]!.action).toEqual({ label: "確認する", href: "/host/bookings?filter=pending", primary: true });
    expect(todos[1]!).toMatchObject({ detail: "表紙写真と料金が未入力", action: { href: "/host/experiences/coffee", primary: false } });
    expect(todos[2]!.detail).toBe("10月19日に申請 · NIHO が確認中");
  });

  it("names a single request and opens that booking", () => {
    const one = MOCK_KITCHEN_BOOKINGS.filter((booking) => booking.id !== "bk-2044");
    expect(homeTodos(MOCK_KITCHEN_EXPERIENCES, one, MOCK_TODAY)[0]).toEqual({
      key: "booking-bk-2041",
      status: { label: "承認待ち", tone: "wait" },
      title: "Lucas & Mia Chen の申込を確認する",
      detail: "10月22日（木）18:00 · Kamakura Community Dinner with Locals · 2名 · ¥60,000 · 承認期限 今日 22:00",
      action: { label: "確認する", href: "/host/bookings?booking=bk-2041", primary: true },
    });
  });

  it("names the requests when none has a deadline", () => {
    const requests = MOCK_KITCHEN_BOOKINGS.filter((booking) => booking.status === "pending").map((booking) => ({ ...booking, respondBy: null }));
    expect(homeTodos(MOCK_KITCHEN_EXPERIENCES, requests, MOCK_TODAY)[0]).toMatchObject({ title: "承認待ちの申込が 2 件", detail: "Lucas & Mia Chen、Ana Souza" });
  });

  it("drops requests for past dates and names the deadline day when it is not today", () => {
    const later: HostBooking = { ...MOCK_KITCHEN_BOOKINGS[0]!, id: "later", respondBy: "2026-10-22T09:00" };
    const past: HostBooking = { ...MOCK_KITCHEN_BOOKINGS[0]!, id: "past", date: "2026-10-20" };
    const todos = homeTodos(MOCK_KITCHEN_EXPERIENCES, [later, past], MOCK_TODAY).filter((todo) => todo.key.startsWith("booking-"));
    expect(todos.map((todo) => todo.key)).toEqual(["booking-later"]);
    expect(todos[0]!.detail).toContain("承認期限 10月22日（木）09:00");
  });

  it("groups upcoming sessions by date and counts the guests of the requests and bookings that keep seats", () => {
    const rows = (bookings: readonly HostBooking[], limit?: number) =>
      homeUpcoming(MOCK_KITCHEN_EXPERIENCES, bookings, MOCK_TODAY, limit).map(({ dateLabel, weekday, day, detail, seats, bookings: count }) => [dateLabel, weekday, day, detail, seats, count]);
    expect(rows(MOCK_KITCHEN_BOOKINGS)).toEqual([
      ["10月22日（木）", "木", 22, "18:00 開始 · 2時間", "4 / 8名", "2件"],
      ["10月24日（土）", "土", 24, "18:00 開始 · 2時間", "1 / 8名", "1件"],
      ["10月27日（火）", "火", 27, "18:00 開始 · 2時間", "3 / 8名", "1件"],
    ]);
    // The tea time on the 25th only has a booking the traveler asked to cancel: no session to prepare.
    expect(rows(MOCK_KITCHEN_BOOKINGS, 5).map((row) => row[0])).toEqual(["10月22日（木）", "10月24日（土）", "10月27日（火）", "10月29日（木）"]);
    // Each offer is its own session, with its own time, length and capacity.
    const tea: HostBooking = { ...MOCK_KITCHEN_BOOKINGS.find((booking) => booking.id === "bk-2033")!, id: "tea", status: "confirmed" };
    expect(rows([tea])).toEqual([["10月25日（日）", "日", 25, "13:00 開始 · 2時間", "2 / 8名", "1件"]]);
  });

  it("sums the month as 売上 does: sales, refunds and what is still to be paid out, without counting payouts as sales", () => {
    expect(homeMonth(MOCK_KITCHEN_SALES, MOCK_SALES_PERIOD.current)).toEqual({ label: "10月", sales: "¥390,000", refunds: "−¥60,000", expected: "¥139,500", confirmed: "8件" });
    expect(homeMonth(MOCK_KITCHEN_SALES, { year: 2026, month: 9 })).toEqual({ label: "9月", sales: "¥225,000", refunds: "¥0", expected: "¥0", confirmed: "4件" });
    expect(homeMonth(MOCK_KITCHEN_SALES, { year: 2026, month: 11 })).toEqual({ label: "11月", sales: "¥0", refunds: "¥0", expected: "¥0", confirmed: "0件" });
  });
});
