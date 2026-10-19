import { describe, expect, it } from "vitest";
import type { Occurrence } from "@niho-experience/api-client";
import { slotAvailabilityLabel } from "./availability-copy";

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
});
