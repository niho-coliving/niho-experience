import type { Occurrence } from "@niho-experience/api-client";
import { pluralize } from "./format";
import { EN_STATIC_COPY_V1, type StaticCopyAccessorV1 } from "@niho/experience-presentation/v1";

type SlotAvailability = Pick<Occurrence, "bookable" | "reason" | "seatsLeft">;

export function slotAvailabilityLabel(slot: SlotAvailability, availabilityIsProvisional: boolean, copy: StaticCopyAccessorV1 = EN_STATIC_COPY_V1, locale: "en" | "ja" = "en"): string {
  if (!slot.bookable) return copy.text(slot.reason === "FULL" ? "availability.fullyBooked" : "availability.bookingClosed");
  if (availabilityIsProvisional) return locale === "en" ? "Sample date · availability not confirmed" : copy.text("booking.jstSampleNote");
  return locale === "en" ? `${pluralize(slot.seatsLeft, "place")} currently available` : copy.text("booking.onlyPlaces", { places: `${slot.seatsLeft}名` });
}
