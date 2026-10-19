import type { AvailabilityStatus } from "@niho-experience/api-client";
import { Pill } from "./ui";

export const availabilityText: Record<Exclude<AvailabilityStatus, "bookable">, string> = {
  sold_out: "Fully booked",
  paused: "Bookings paused",
  no_upcoming_dates: "New dates soon",
};

/** Nothing for bookable experiences: we never invent "popular" or "few left" badges. */
export function AvailabilityPill({ status }: { status: AvailabilityStatus }) {
  if (status === "bookable") return null;
  return <Pill tone={status === "paused" ? "muted" : "warn"}>{availabilityText[status]}</Pill>;
}
