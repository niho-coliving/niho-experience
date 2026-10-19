import { describe, expect, it } from "vitest";

import { checkoutRecoveryFor, computeExpectedTotalYen, freeCancellationDeadline, toJstDateTimeParts } from "../src/booking-rules.ts";
import type { OfferPricing } from "../src/types.ts";

const WITH_CHILD: OfferPricing = { currency: "JPY", taxIncluded: true, adultPriceYen: 6500, child: { priceYen: 3000, minAge: 6, maxAge: 12, adultRequired: true } };
const ADULT_ONLY: OfferPricing = { currency: "JPY", taxIncluded: true, adultPriceYen: 8800, child: null };

describe("booking rules", () => {
  it("合計は大人と子どもの料金の和（追加料金なし）", () => {
    expect(computeExpectedTotalYen(WITH_CHILD, 2, 1)).toBe(16000);
    expect(computeExpectedTotalYen(ADULT_ONLY, 3, 0)).toBe(26400);
    expect(computeExpectedTotalYen(ADULT_ONLY, 1, 1)).toBeNull();
    expect(computeExpectedTotalYen(WITH_CHILD, 0, 0)).toBeNull();
    expect(computeExpectedTotalYen(WITH_CHILD, 1.5, 0)).toBeNull();
  });

  it("無料取消の期限は開始の N 時間前（返金なしは null）", () => {
    expect(freeCancellationDeadline("2026-10-23T09:00:00.000Z", { code: "FREE_UNTIL_24H", freeCancellationHoursBefore: 24 })).toBe("2026-10-22T09:00:00.000Z");
    expect(freeCancellationDeadline("2026-10-23T09:00:00.000Z", { code: "NONE", freeCancellationHoursBefore: null })).toBeNull();
  });

  it("UTC を日本時間の日付と時刻にする（日付をまたぐ）", () => {
    expect(toJstDateTimeParts("2026-10-23T09:00:00.000Z")).toEqual({ date: "2026-10-23", time: "18:00" });
    expect(toJstDateTimeParts("2026-10-23T22:30:00.000Z")).toEqual({ date: "2026-10-24", time: "07:30" });
    expect(toJstDateTimeParts("not a date")).toBeNull();
  });

  it("失敗ごとの復帰の仕方", () => {
    expect(checkoutRecoveryFor("NETWORK_ERROR")).toBe("resend-same-key");
    expect(checkoutRecoveryFor("CHECKOUT_UNAVAILABLE")).toBe("resend-same-key");
    expect(checkoutRecoveryFor("RATE_LIMITED")).toBe("wait");
    expect(checkoutRecoveryFor("REQUEST_MISMATCH")).toBe("new-key-and-confirm");
    expect(checkoutRecoveryFor("FULL")).toBe("reload-and-reselect");
    expect(checkoutRecoveryFor("PRICE_CHANGED")).toBe("reload-and-reselect");
    expect(checkoutRecoveryFor("INPUT_INVALID")).toBe("fix-input");
  });
});
