import { describe, expect, it } from "vitest";
import type { Occurrence } from "@niho-experience/api-client";
import { slotAvailabilityLabel } from "./availability-copy";
import { createStaticCopyV1, defaultStaticCopyValuesV1 } from "@niho/experience-presentation/v1";

describe("slotAvailabilityLabel", () => {
  const openSlot = { bookable: true, reason: null, seatsLeft: 8 } satisfies Pick<Occurrence, "bookable" | "reason" | "seatsLeft">;

  it("does not present provisional pilot capacity as a confirmed count", () => {
    expect(slotAvailabilityLabel(openSlot, true)).toBe("Sample date · availability not confirmed");
  });

  it("shows the count for confirmed availability", () => {
    expect(slotAvailabilityLabel(openSlot, false)).toBe("8 places currently available");
  });

  it("keeps full and closed states", () => {
    expect(slotAvailabilityLabel({ ...openSlot, bookable: false, reason: "FULL", seatsLeft: 0 }, true)).toBe("Fully booked");
    expect(slotAvailabilityLabel({ ...openSlot, bookable: false, reason: "CUTOFF", seatsLeft: 0 }, true)).toBe("Booking closed");
  });

  it("uses the released Japanese copy instead of translating availability at runtime", () => {
    const copy = createStaticCopyV1({ ...defaultStaticCopyValuesV1(), "booking.onlyPlaces": "残り{places}", "availability.fullyBooked": "満席", "availability.bookingClosed": "受付終了" });
    expect(slotAvailabilityLabel({ ...openSlot, seatsLeft: 3 }, false, copy, "ja")).toBe("残り3名");
    expect(slotAvailabilityLabel({ ...openSlot, bookable: false, reason: "FULL", seatsLeft: 0 }, false, copy, "ja")).toBe("満席");
  });
});
