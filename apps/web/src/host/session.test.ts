import { describe, expect, it } from "vitest";
import { sessionOfBooking } from "./bookings";
import { MOCK_KITCHEN_BOOKINGS, MOCK_NOW } from "./mock/bookings";
import {
  attendanceCounts,
  attendanceLabel,
  attendanceNotice,
  attendanceSummary,
  canCancelSession,
  canRecordAttendance,
  cancelOutcomeText,
  cancelResultText,
  cancelSession,
  cancelSessionBooking,
  countryLabel,
  dietarySummary,
  guestOrigin,
  guestTags,
  guestWords,
  mergeCancelResults,
  peopleShort,
  recordAttendance,
  sessionBookings,
  sessionCancelConfirmLabel,
  sessionCancelMessage,
  sessionCancelPlan,
  sessionCancelSummary,
  sessionCancelTargets,
  sessionCountLines,
  sessionHeading,
  sessionPhase,
  sessionPhaseLine,
  sessionQueryOf,
  sessionSections,
  telHref,
} from "./session";
import type { HostBooking } from "./types";

const byId = (id: string): HostBooking => MOCK_KITCHEN_BOOKINGS.find((booking) => booking.id === id)!;
const sessionOf = (id: string) => sessionBookings(MOCK_KITCHEN_BOOKINGS, sessionOfBooking(byId(id)));
/** Tomorrow's dinner: Lucas & Mia's request and Emma's booking. */
const DINNER = sessionOf("bk-2038");
/** Today's tea time, over by the preview's 15:30: Aiko's and Tom's bookings. */
const TEA = sessionOf("bk-2006");
const AT = MOCK_NOW;

describe("the session", () => {
  it("reads its address, and nothing malformed", () => {
    const query = { date: "2026-10-22", start: "18:00", experience: "community-dinner", offer: "offer-dinner" };
    expect(sessionQueryOf(query)).toEqual(query);
    expect(sessionQueryOf({ ...query, date: ["2026-10-22", "2026-10-24"] })).toEqual(query);
    for (const broken of [{ ...query, date: "22/10/2026" }, { ...query, start: "18" }, { ...query, offer: "" }, { date: query.date, start: query.start, experience: query.experience }]) {
      expect(sessionQueryOf(broken), JSON.stringify(broken)).toBeNull();
    }
  });

  it("has every booking of one offer on one day at one time", () => {
    expect(DINNER.map((booking) => booking.id)).toEqual(["bk-2041", "bk-2038"]);
    expect(TEA.map((booking) => booking.id)).toEqual(["bk-2006", "bk-2003"]);
    expect(sessionHeading({ date: "2026-10-22", title: "Kamakura Community Dinner with Locals" })).toBe("10/22（木）Kamakura Community Dinner with Locals");
  });

  it("is before, during or after, from its start and its end", () => {
    const dinner = { date: "2026-10-22", start: "18:00", end: "20:00" };
    expect(["2026-10-22T17:59", "2026-10-22T18:00", "2026-10-22T19:59", "2026-10-22T20:00"].map((now) => sessionPhase(dinner, now))).toEqual(["before", "during", "during", "after"]);
    expect(sessionPhaseLine(dinner, MOCK_NOW)).toBe("開始まであと 26 時間");
    expect(sessionPhaseLine(dinner, "2026-10-22T15:30")).toBe("開始まであと 2 時間");
    expect(sessionPhaseLine(dinner, "2026-10-22T18:30")).toBe("開催中（20:00 まで）");
    expect(sessionPhaseLine({ date: "2026-10-21", start: "13:00", end: "15:00" }, MOCK_NOW)).toBe("終了しました");
    // One that ends past midnight ends the next day.
    expect(sessionPhase({ date: "2026-10-22", start: "22:00", end: "01:00" }, "2026-10-23T00:30")).toBe("during");
  });

  it("counts the guests of the bookings, the requests apart, and the food wishes of everyone who keeps a seat", () => {
    expect(sessionCountLines(DINNER, 8)).toEqual({ main: "参加 2 名 · 定員 8", pending: "ほかに承認待ち 2 名" });
    expect(sessionCountLines(TEA, null)).toEqual({ main: "参加 4 名", pending: null });
    expect(dietarySummary(DINNER)).toBe("ベジタリアン 1 名");
    expect(dietarySummary([...DINNER, byId("bk-2035"), { status: "confirmed", dietary: ["甲殻類なし", "ベジタリアン"] }])).toBe("ベジタリアン 2 名 · 甲殻類なし 2 名");
    // A cancelled booking keeps no seat and asks for nothing.
    expect(dietarySummary([byId("bk-2012")])).toBe("");
  });

  it("writes each guest the Japanese way: people, country and language, the phone to call", () => {
    expect([peopleShort(byId("bk-2038")), peopleShort(byId("bk-2003"))]).toEqual(["大人 2", "大人 1・子ども 1"]);
    expect([guestOrigin(byId("bk-2038")), guestOrigin(byId("bk-2006")), guestOrigin({ country: null, language: "en" })]).toEqual(["イギリス · 英語", "日本 · 日本語", "英語"]);
    expect([countryLabel("se"), countryLabel("not a code")]).toEqual(["スウェーデン", "not a code"]);
    expect(telHref("+44 7700 900123")).toBe("tel:+447700900123");
  });

  it("tags the food wishes once each, and a booking paid and not refunded", () => {
    const labels = (booking: Parameters<typeof guestTags>[0]) => guestTags(booking).map((tag) => `${tag.tone}:${tag.label}`);
    expect(labels(byId("bk-2038"))).toEqual(["paid:支払い済み"]);
    expect(labels(byId("bk-2041"))).toEqual(["food:ベジタリアン"]);
    expect(labels(byId("bk-2003"))).toEqual(["food:ナッツなし", "paid:支払い済み"]);
    expect(labels(byId("bk-2012"))).toEqual(["food:豚肉なし 2 名"]);
    expect(guestWords({ note: "  ", answers: [{ question: "Q", answer: " " }, { question: "Q2", answer: "A" }] })).toEqual({ note: "", answers: [{ question: "Q2", answer: "A" }] });
  });

  it("keeps the bookings and the requests where they were when the screen opened", () => {
    const cancelled = cancelSession(DINNER, "weather", AT).bookings;
    const sections = sessionSections(DINNER, cancelled);
    expect([sections.participants.map((booking) => [booking.guest, booking.status]), sections.requests.map((booking) => [booking.guest, booking.status])]).toEqual([
      [["Emma Larsson", "cancelled"]],
      [["Lucas & Mia Chen", "cancelled"]],
    ]);
  });
});

describe("attendance", () => {
  const tom = byId("bk-2003");

  it("is recorded for bookings from the start, and can be corrected after the end", () => {
    expect((["before", "during", "after"] as const).map((phase) => canRecordAttendance(tom, phase))).toEqual([false, true, true]);
    expect(canRecordAttendance(byId("bk-2041"), "during")).toBe(false);
    expect(recordAttendance(tom, "attended", "before")).toBe(tom);
    const came = recordAttendance(tom, "attended", "after");
    expect(came.attendance).toBe("attended");
    expect(recordAttendance(came, "no_show", "after").attendance).toBe("no_show");
    expect(recordAttendance(came, "attended", "after")).toBe(came);
    expect(attendanceNotice(tom, "attended")).toBe("Tom Becker さん: 来た");
    expect([attendanceLabel("no_show"), attendanceLabel(null)]).toEqual(["来なかった", "未記録"]);
  });

  it("counts the bookings by their attendance", () => {
    expect(attendanceSummary(attendanceCounts(TEA))).toBe("来た 0 件 · 来なかった 0 件 · 未記録 2 件");
    const recorded = TEA.map((booking) => recordAttendance(booking, booking.id === "bk-2003" ? "no_show" : "attended", "after"));
    expect(attendanceCounts([...recorded, byId("bk-2041")])).toEqual({ attended: 1, noShow: 1, unrecorded: 0 });
  });
});

describe("calling the session off", () => {
  it("is offered before the start only, once, and when there is something to cancel", () => {
    expect(canCancelSession(DINNER, "before", false)).toBe(true);
    expect(canCancelSession(DINNER, "during", false)).toBe(false);
    expect(canCancelSession(DINNER, "before", true)).toBe(false);
    expect(canCancelSession([byId("bk-2033"), byId("bk-2012")], "before", false)).toBe(false);
    expect(sessionCancelTargets([...DINNER, byId("bk-2033")]).map((booking) => booking.id)).toEqual(["bk-2041", "bk-2038"]);
  });

  it("says what it cancels and refunds: a request was never charged, its card hold is released", () => {
    const plan = sessionCancelPlan(sessionCancelTargets(DINNER));
    expect(plan).toEqual({ confirmed: 1, pending: 1, refundYen: 60000 });
    expect(sessionCancelSummary(plan)).toBe("確定 1 件・承認待ち 1 件を取り消し、¥60,000 を全額返金します。承認待ちはカードの仮押さえを解除します。");
    expect(sessionCancelConfirmLabel(plan)).toBe("2 件を取り消して ¥60,000 を返金する");
    expect(sessionCancelSummary({ confirmed: 2, pending: 0, refundYen: 120000 })).toBe("確定 2 件を取り消し、¥120,000 を全額返金します。");
    const requests = sessionCancelPlan([byId("bk-2041")]);
    expect([sessionCancelSummary(requests), sessionCancelConfirmLabel(requests)]).toEqual(["承認待ち 1 件を取り消し、カードの仮押さえを解除します。", "1 件を取り消す"]);
    // What went back before counts toward the full refund.
    expect(sessionCancelPlan([{ status: "confirmed", amountYen: 60000, refundedYen: 30000 }]).refundYen).toBe(30000);
  });

  it("cancels a booking in full for 運営者の都合 and releases a request, both with the fixed reason in the guest's language", () => {
    const emma = cancelSessionBooking(byId("bk-2038"), "weather", AT);
    expect(emma).toMatchObject({ status: "cancelled", cancelledAt: AT, cancelReason: "host", refundedYen: 60000, cancelMessage: sessionCancelMessage("en", "weather") });
    expect(emma.timeline.at(-1)).toEqual({ at: AT, text: "取消 · 返金 ¥60,000" });
    const lucas = cancelSessionBooking(byId("bk-2041"), "illness", AT);
    expect(lucas).toMatchObject({ status: "cancelled", refundedYen: 0, paidAt: null, meetingGuide: null, cancelReason: "host" });
    expect(lucas.cancelMessage).toMatch(/suddenly fallen ill/);
    expect(lucas.timeline.at(-1)).toEqual({ at: AT, text: "取消 · 与信を取り消し" });
    expect(cancelSessionBooking(byId("bk-2006"), "other", AT).cancelMessage).toBe("申し訳ありませんが、主催者の都合により、この回は中止になりました。");
  });

  it("goes on past a booking that fails, and tries again only what is still to cancel: nothing is refunded twice", () => {
    const first = cancelSession(DINNER, "weather", AT, (booking) => (booking.id === "bk-2038" ? "カード会社が応答しませんでした" : null));
    expect(first.results).toEqual([
      { bookingId: "bk-2041", guest: "Lucas & Mia Chen", ok: true, refundYen: 0, released: true },
      { bookingId: "bk-2038", guest: "Emma Larsson", ok: false, error: "カード会社が応答しませんでした" },
    ]);
    expect(first.bookings.map((booking) => booking.status)).toEqual(["cancelled", "confirmed"]);
    expect(cancelOutcomeText(first.results)).toBe("この回を中止しました。1 件を取り消しました。1 件は取り消せませんでした");
    expect(first.results.map(cancelResultText)).toEqual(["取り消してカードの仮押さえを解除", "取り消せませんでした: カード会社が応答しませんでした"]);

    const again = cancelSession(first.bookings, "weather", AT);
    expect(again.results).toEqual([{ bookingId: "bk-2038", guest: "Emma Larsson", ok: true, refundYen: 60000, released: false }]);
    expect(again.bookings[0]).toBe(first.bookings[0]);
    const merged = mergeCancelResults(first.results, again.results);
    expect(merged.map((result) => [result.guest, cancelResultText(result)])).toEqual([
      ["Lucas & Mia Chen", "取り消してカードの仮押さえを解除"],
      ["Emma Larsson", "取り消して ¥60,000 を返金"],
    ]);
    expect(cancelOutcomeText(merged)).toBe("この回を中止しました。2 件を取り消し、¥60,000 を返金しました");
    // Once everything is cancelled, a third try does nothing.
    const third = cancelSession(again.bookings, "weather", AT);
    expect([third.results, third.bookings.map((booking) => booking.refundedYen)]).toEqual([[], [0, 60000]]);
    expect(cancelOutcomeText([{ bookingId: "x", guest: "X", ok: false, error: "e" }])).toBe("この回を中止しました。1 件を取り消せませんでした");
  });
});
