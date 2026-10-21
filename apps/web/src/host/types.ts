import type { HostProviderKind, HostProviderReviewStatus } from "@/lib/host/providers";

/*
 * What the host console screens show (#84). Hand-written from the screens' needs
 * and what is known of NIHO's provider API; #87 replaces them with the types
 * generated from the agreed contract, and the screens keep reading these shapes.
 */

/** One listing state per experience page: draft → review → live (or paused). */
export type ListingStatus = "draft" | "review" | "live" | "paused";

export interface HostExperience {
  id: string;
  title: string;
  status: ListingStatus;
  /** Public path under /public; null shows a plain sand thumbnail. */
  cover: string | null;
  schedule: { weekdays: readonly string[]; start: string; durationMinutes: number; capacity: number; priceFromYen: number } | null;
  /** What a draft still needs before it can be submitted ("表紙写真", "料金"). */
  missing: readonly string[];
  /** When the listing was submitted for review (YYYY-MM-DD, JST). */
  requestedOn?: string;
}

export type HostBookingStatus = "pending" | "confirmed" | "cancelled";

export interface HostBooking {
  id: string;
  experienceId: string;
  guest: string;
  /** Local date and times in Japan (YYYY-MM-DD, HH:MM). */
  date: string;
  start: string;
  end: string;
  offer: string;
  guests: number;
  amountYen: number;
  status: HostBookingStatus;
  channel: string;
  /** Pending requests only: when the host must answer (YYYY-MM-DDTHH:MM, JST). */
  respondBy?: string;
}

export type HostSaleKind = "sale" | "refund" | "payout";

export interface HostSale {
  id: string;
  /** YYYY-MM-DD (JST). */
  date: string;
  kind: HostSaleKind;
  title: string;
  detail: string;
  amountYen: number;
}

export type PaymentReadinessReason = "NOT_CONNECTED" | "VERIFICATION_REQUIRED" | "CHARGES_DISABLED" | "PAYOUTS_DISABLED" | "RESTRICTED" | "READY";

export interface HostPayoutAccount {
  reason: PaymentReadinessReason;
  /** How the account is named on screen ("サンプルの台所の口座"); null when there is none yet. */
  label: string | null;
}

/** Where guests meet, used by every experience unless it says otherwise. */
export interface HostMeetingDefaults {
  /** Shown on the public page. */
  area: string;
  mapUrl: string;
  /** Sent only after a booking is confirmed. */
  entrance: string;
}

/** The settings screen's starting values. */
export interface HostSettings {
  displayName: string;
  kind: HostProviderKind | null;
  bio: string;
  sellerDisclosureUrl: string;
  reviewStatus: HostProviderReviewStatus | null;
  /** null until the console can read the payout account (#87). */
  payout: HostPayoutAccount | null;
  meetingPoint: HostMeetingDefaults;
  notificationEmail: string;
}
