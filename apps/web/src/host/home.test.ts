import { describe, expect, it } from "vitest";
import { dateWithWeekdayJa, durationJa, experienceMeta, todayInJapan, yen } from "./format";
import { homeMonth, homeTodos, homeUpcoming } from "./home";
import { MOCK_KITCHEN_BOOKINGS, MOCK_TODAY } from "./mock/bookings";
import { MOCK_KITCHEN_EXPERIENCES } from "./mock/experiences";
import { MOCK_KITCHEN_SALES, MOCK_SALES_MONTH } from "./mock/sales";
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
      ["承認待ち", "Lucas & Mia Chen の申込を確認する", "確認する"],
      ["下書き", "Roast Your Own Coffee in a Kamakura Living Room の原稿を仕上げる", "編集する"],
      ["審査待ち", "Mend a Broken Bowl with a Kamakura Restorer", null],
    ]);
    expect(todos[0]!.detail).toBe("10月22日（木）18:00 · Kamakura Community Dinner with Locals · 2名 · ¥60,000 · 承認期限 今日 22:00");
    expect(todos[0]!.action).toEqual({ label: "確認する", href: "/host/bookings", primary: true });
    expect(todos[1]!).toMatchObject({ detail: "表紙写真と料金が未入力", action: { href: "/host/experiences/coffee", primary: false } });
    expect(todos[2]!.detail).toBe("10月19日に申請 · NIHO が確認中");
  });

  it("drops requests for past dates and names the deadline day when it is not today", () => {
    const later: HostBooking = { ...MOCK_KITCHEN_BOOKINGS[0]!, id: "later", respondBy: "2026-10-22T09:00" };
    const past: HostBooking = { ...MOCK_KITCHEN_BOOKINGS[0]!, id: "past", date: "2026-10-20" };
    const todos = homeTodos(MOCK_KITCHEN_EXPERIENCES, [later, past], MOCK_TODAY).filter((todo) => todo.key.startsWith("booking-"));
    expect(todos.map((todo) => todo.key)).toEqual(["booking-later"]);
    expect(todos[0]!.detail).toContain("承認期限 10月22日（木）09:00");
  });

  it("groups upcoming sessions by date and counts guests of every booking that is not cancelled", () => {
    expect(homeUpcoming(MOCK_KITCHEN_EXPERIENCES, MOCK_KITCHEN_BOOKINGS, MOCK_TODAY).map(({ dateLabel, weekday, day, detail, seats, bookings }) => [dateLabel, weekday, day, detail, seats, bookings])).toEqual([
      ["10月22日（木）", "木", 22, "18:00 開始 · 2時間", "4 / 8名", "2件"],
      ["10月24日（土）", "土", 24, "18:00 開始 · 2時間", "1 / 8名", "1件"],
      ["10月27日（火）", "火", 27, "18:00 開始 · 2時間", "3 / 8名", "1件"],
    ]);
  });

  it("sums the month's sales and refunds without counting payouts as sales", () => {
    expect(homeMonth(MOCK_KITCHEN_SALES, MOCK_SALES_MONTH)).toEqual({ label: "10月", sales: "¥270,000", refunds: "−¥60,000", confirmed: "6件" });
    expect(homeMonth(MOCK_KITCHEN_SALES, { year: 2026, month: 9 })).toEqual({ label: "9月", sales: "¥0", refunds: "¥0", confirmed: "0件" });
  });
});
