import { describe, expect, it } from "vitest";
import { MOCK_ADMIN_BOOKINGS } from "./mock";
import { adminBookingActions, applyAdminOperation, filterAdminBookings } from "./bookings";

const actor = { id: "admin-preview", name: "NIHO サポート 山本" };
const empty = { hostId: "", from: "", to: "", status: "" as const, support: "" as const, attention: "" as const, search: "" };

describe("admin booking filters", () => {
  it("combines host, period, state, support, attention and search", () => {
    expect(filterAdminBookings(MOCK_ADMIN_BOOKINGS, { ...empty, hostId: "sample-provider-kitchen", support: "on", attention: "yes" }).map((b) => b.bookingNumber)).toEqual(["EX-202610-2041", "EX-202610-2033"]);
    expect(filterAdminBookings(MOCK_ADMIN_BOOKINGS, { ...empty, from: "2026-11-01", search: "maya" })).toHaveLength(1);
    expect(filterAdminBookings(MOCK_ADMIN_BOOKINGS, { ...empty, search: "2101" })[0]?.hostName).toBe("サンプル工房");
  });
});

describe("admin booking operations", () => {
  it("allows global viewing but refuses operations for support OFF", () => {
    const booking = MOCK_ADMIN_BOOKINGS.find((item) => !item.support.enabled)!;
    expect(adminBookingActions(booking)).toEqual({ approve: false, decline: false, contact: false, cancel: false });
    expect(applyAdminOperation(booking, { action: "approve", reason: "確認済み" }, actor, "2026-10-21T16:00")).toMatchObject({ ok: false, code: "support_off" });
  });

  it("records the admin actor and keeps the booking-time fee snapshot", () => {
    const booking = MOCK_ADMIN_BOOKINGS[0]!;
    const result = applyAdminOperation(booking, { action: "approve", reason: "ホストと受入条件を確認" }, actor, "2026-10-21T16:00");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.booking.support.feePercent).toBe(15);
    expect(result.booking.adminHistory.at(-1)).toMatchObject({ actorId: actor.id, actorName: actor.name, action: "approved" });
  });

  it("refuses a support OFF snapshot even when its operation flag is inconsistent", () => {
    const booking = { ...MOCK_ADMIN_BOOKINGS[0]!, support: { ...MOCK_ADMIN_BOOKINGS[0]!.support, enabled: false, operationsAllowed: true } };
    expect(adminBookingActions(booking).approve).toBe(false);
    expect(applyAdminOperation(booking, { action: "approve", reason: "確認" }, actor, "2026-10-21T16:00")).toMatchObject({ ok: false, code: "support_off" });
  });

  it("prevents a second cancellation and refund", () => {
    const booking = MOCK_ADMIN_BOOKINGS.find((item) => item.status === "refund_needed")!;
    const operation = { action: "cancel" as const, reason: "旅行者の依頼を確認", cancellation: { refund: "full" as const, reason: "guest" as const, message: "Your booking was cancelled." } };
    const first = applyAdminOperation(booking, operation, actor, "2026-10-21T16:00");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = applyAdminOperation(first.booking, operation, actor, "2026-10-21T16:01");
    expect(second).toMatchObject({ ok: false, code: "invalid_state" });
    expect(first.booking.refundedYen).toBe(booking.amountYen);
  });
});
