import { describe, expect, it } from "vitest";
import { addDays, agoJa, dateWithWeekdayJa, durationJa, experienceMeta, minutesBetween, remainingJa, shortDateWithWeekdayJa, todayInJapan, yen } from "./format";
import { homeMonth, homeSessions, homeTodos } from "./home";
import { MOCK_KITCHEN_BOOKINGS, MOCK_NOW, MOCK_TODAY } from "./mock/bookings";
import { MOCK_KITCHEN_EXPERIENCES } from "./mock/experiences";
import { MOCK_KITCHEN_SALES, MOCK_SALES_PERIOD } from "./mock/sales";
import { MOCK_KITCHEN_THREADS } from "./mock/threads";
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
  const todos = (bookings = MOCK_KITCHEN_BOOKINGS, threads = MOCK_KITCHEN_THREADS) => homeTodos(MOCK_KITCHEN_EXPERIENCES, bookings, threads, MOCK_TODAY, MOCK_NOW);

  it("puts each request first, the nearest deadline first, then the threads waiting longest, then drafts and listings under review", () => {
    expect(todos().map((todo) => [todo.key, todo.status.label, todo.aside?.text ?? null, todo.action?.label ?? null])).toEqual([
      ["booking-bk-2041", "承認待ち", "あと 6 時間", "詳しく見る"],
      ["booking-bk-2044", "承認待ち", "あと 44 時間", "詳しく見る"],
      ["thread-th-3010", "返信待ち", "予約前の質問", "返信する"],
      ["thread-th-3004", "返信待ち", "予約者からの連絡", "返信する"],
      ["thread-th-3012", "返信待ち", "予約前の質問", "返信する"],
      ["draft-coffee", "下書き", null, "編集する"],
      ["review-kintsugi", "審査待ち", null, null],
    ]);
  });

  it("names a request with its day, experience, guests and amount, and approves it here", () => {
    expect(todos()[0]).toEqual({
      key: "booking-bk-2041",
      status: { label: "承認待ち", tone: "wait" },
      aside: { text: "あと 6 時間", tone: "warn" },
      title: "Lucas & Mia Chen さん · 10/22（木）18:00 · Kamakura Community Dinner with Locals · 2名 · ¥60,000",
      detail: "期限を過ぎると自動でお断りになります",
      approval: { bookingId: "bk-2041", booking: { guest: "Lucas & Mia Chen", date: "2026-10-22", start: "18:00", end: "20:00", offer: "Dinner", amountYen: 60000 } },
      action: { label: "詳しく見る", href: "/host/bookings?booking=bk-2041", primary: false },
    });
    expect(todos()[1]!.title).toBe("Ana Souza さん · 10/29（木）18:00 · Kamakura Community Dinner with Locals · 3名 · ¥72,000");
  });

  it("drops requests for past dates and puts requests without a deadline after the others", () => {
    const later: HostBooking = { ...MOCK_KITCHEN_BOOKINGS[0]!, id: "later", respondBy: "2026-10-22T09:00" };
    const open: HostBooking = { ...MOCK_KITCHEN_BOOKINGS[0]!, id: "open", respondBy: null };
    const past: HostBooking = { ...MOCK_KITCHEN_BOOKINGS[0]!, id: "past", date: "2026-10-20" };
    const rows = todos([open, later, past], []).filter((todo) => todo.key.startsWith("booking-"));
    expect(rows.map((todo) => [todo.key, todo.aside?.text ?? null, todo.detail])).toEqual([
      ["booking-later", "あと 17 時間", "期限を過ぎると自動でお断りになります"],
      ["booking-open", null, ""],
    ]);
  });

  it("quotes what the guest wrote in Japanese, or the original NIHO could not translate, and opens the thread", () => {
    const threads = Object.fromEntries(todos().map((todo) => [todo.key, todo]));
    expect(threads["thread-th-3012"]).toMatchObject({
      title: "「こんにちは！ 9 歳の娘と一緒にディナーに参加できますか？ 料…」",
      detail: "Emma Wilson さん · 2 時間前 · 英語から翻訳",
      approval: null,
      action: { label: "返信する", href: "/host/messages?thread=th-3012", primary: true },
    });
    expect(threads["thread-th-3004"]).toMatchObject({ detail: "Sofia Rossi さん · 4 時間前 · 英語から翻訳" });
    expect(threads["thread-th-3010"]).toMatchObject({ title: "「안녕하세요. 휠체어로도 참가할 수 있을까요? 엘리베이터가…」", detail: "Jiwoo Han さん · 6 時間前 · 翻訳できませんでした" });
    // The answered question waits for nobody.
    expect(threads["thread-th-3007"]).toBeUndefined();
  });

  it("shows tomorrow's sessions, today's that have not started, and the next ones from the day after tomorrow", () => {
    const rows = (sessions: readonly { dateLabel: string; detail: string; seats: string; bookings: string }[]) => sessions.map(({ dateLabel, detail, seats, bookings }) => [dateLabel, detail, seats, bookings]);
    const sessions = homeSessions(MOCK_KITCHEN_EXPERIENCES, MOCK_KITCHEN_BOOKINGS, MOCK_NOW);
    expect(rows(sessions.today)).toEqual([]);
    expect(rows(sessions.tomorrow)).toEqual([["10月22日（木）", "18:00 開始 · 2時間", "4 / 8名", "2件"]]);
    // The tea time on the 25th only has a booking the traveler asked to cancel: no session to prepare.
    expect(rows(sessions.later)).toEqual([
      ["10月24日（土）", "18:00 開始 · 2時間", "1 / 8名", "1件"],
      ["10月27日（火）", "18:00 開始 · 2時間", "3 / 8名", "1件"],
      ["10月29日（木）", "18:00 開始 · 2時間", "3 / 8名", "1件"],
    ]);
    expect(homeSessions(MOCK_KITCHEN_EXPERIENCES, MOCK_KITCHEN_BOOKINGS, MOCK_NOW, 1).later).toHaveLength(1);
    // Today: only what has not started yet. Each offer is its own session, with its own time, length and capacity.
    const tea: HostBooking = { ...MOCK_KITCHEN_BOOKINGS.find((booking) => booking.id === "bk-2033")!, id: "tea", status: "confirmed", date: MOCK_TODAY };
    const dinner: HostBooking = { ...MOCK_KITCHEN_BOOKINGS.find((booking) => booking.id === "bk-2038")!, id: "dinner", date: MOCK_TODAY };
    const today = homeSessions(MOCK_KITCHEN_EXPERIENCES, [tea, dinner], MOCK_NOW);
    expect(rows(today.today)).toEqual([["10月21日（水）", "18:00 開始 · 2時間", "2 / 8名", "1件"]]);
    expect(homeSessions(MOCK_KITCHEN_EXPERIENCES, [tea, dinner], "2026-10-21T12:59").today.map((row) => row.detail)).toEqual(["13:00 開始 · 2時間", "18:00 開始 · 2時間"]);
    expect([today.tomorrow, today.later]).toEqual([[], []]);
  });

  it("counts the time left and the time since in Japanese, rounded down", () => {
    expect(["2026-10-21T15:31", "2026-10-21T16:10", "2026-10-21T21:59", "2026-10-23T15:29", "2026-10-23T15:30", "2026-10-24T18:00"].map((deadline) => remainingJa(deadline, MOCK_NOW))).toEqual([
      "あと 1 分",
      "あと 40 分",
      "あと 6 時間",
      "あと 47 時間",
      "あと 2 日",
      "あと 3 日",
    ]);
    expect(remainingJa(MOCK_NOW, MOCK_NOW)).toBe("期限を過ぎています");
    expect(["2026-10-21T15:30", "2026-10-21T15:00", "2026-10-21T13:24", "2026-10-20T15:31", "2026-10-18T09:00"].map((at) => agoJa(at, MOCK_NOW))).toEqual(["たった今", "30 分前", "2 時間前", "23 時間前", "3 日前"]);
    // Across a month and a year.
    expect(minutesBetween("2026-12-31T23:30", "2027-01-01T00:10")).toBe(40);
    expect([addDays("2026-10-31", 1), addDays("2026-12-31", 1), shortDateWithWeekdayJa("2026-10-22")]).toEqual(["2026-11-01", "2027-01-01", "10/22（木）"]);
  });

  it("sums the month as 売上 does: sales, refunds and what is still to be paid out, without counting payouts as sales", () => {
    expect(homeMonth(MOCK_KITCHEN_SALES, MOCK_SALES_PERIOD.current)).toEqual({ label: "10月", sales: "¥390,000", refunds: "−¥60,000", expected: "¥139,500", confirmed: "8件" });
    expect(homeMonth(MOCK_KITCHEN_SALES, { year: 2026, month: 9 })).toEqual({ label: "9月", sales: "¥225,000", refunds: "¥0", expected: "¥0", confirmed: "4件" });
    expect(homeMonth(MOCK_KITCHEN_SALES, { year: 2026, month: 11 })).toEqual({ label: "11月", sales: "¥0", refunds: "¥0", expected: "¥0", confirmed: "0件" });
  });
});
