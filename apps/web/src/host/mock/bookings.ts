import type { HostBooking } from "../types";

/** The preview's fixed "today" (JST). The synthetic dates below are written around it. */
export const MOCK_TODAY = "2026-10-21";

// Invented guests; nothing here is a real booking.
export const MOCK_KITCHEN_BOOKINGS: readonly HostBooking[] = [
  { id: "bk-2041", experienceId: "community-dinner", guest: "Lucas & Mia Chen", date: "2026-10-22", start: "18:00", end: "20:00", offer: "Dinner", guests: 2, amountYen: 60000, status: "pending", channel: "体験サイト", respondBy: "2026-10-21T22:00" },
  { id: "bk-2038", experienceId: "community-dinner", guest: "Emma Larsson", date: "2026-10-22", start: "18:00", end: "20:00", offer: "Dinner", guests: 2, amountYen: 60000, status: "confirmed", channel: "体験サイト" },
  { id: "bk-2035", experienceId: "community-dinner", guest: "Noah Williams", date: "2026-10-24", start: "18:00", end: "20:00", offer: "Dinner", guests: 1, amountYen: 30000, status: "confirmed", channel: "体験サイト" },
  { id: "bk-2031", experienceId: "community-dinner", guest: "Sofia Rossi", date: "2026-10-27", start: "18:00", end: "20:00", offer: "Dinner", guests: 3, amountYen: 90000, status: "confirmed", channel: "NIHO" },
  { id: "bk-2020", experienceId: "community-dinner", guest: "Oliver Brown", date: "2026-10-18", start: "18:00", end: "20:00", offer: "Dinner", guests: 2, amountYen: 60000, status: "confirmed", channel: "体験サイト" },
  { id: "bk-2012", experienceId: "community-dinner", guest: "Hannah Kim", date: "2026-10-14", start: "18:00", end: "20:00", offer: "Dinner", guests: 2, amountYen: 60000, status: "cancelled", channel: "体験サイト" },
];
