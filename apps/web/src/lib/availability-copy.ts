import type { Occurrence } from "@niho-experience/api-client";
import { pluralize } from "./format";

type SlotAvailability = Pick<Occurrence, "bookable" | "reason" | "seatsLeft">;

export function slotAvailabilityLabel(slot: SlotAvailability, availabilityIsProvisional: boolean): string {
  if (!slot.bookable) return slot.reason === "FULL" ? "Fully booked" : "Booking closed";
  if (availabilityIsProvisional) return "Sample date · availability not confirmed";
  return `${pluralize(slot.seatsLeft, "place")} currently available`;
}
