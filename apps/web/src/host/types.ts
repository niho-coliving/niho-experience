import type { HostProviderKind, HostProviderReviewStatus } from "@/lib/host/providers";

/*
 * What the host console screens show (#84). Hand-written from the screens' needs
 * and what is known of NIHO's provider API; #87 replaces them with the types
 * generated from the agreed contract, and the screens keep reading these shapes.
 */

/** One listing state per experience page: draft → review → live (or paused). */
export type ListingStatus = "draft" | "review" | "live" | "paused";

/** The language a page is written in. The traveler site shows the page in it as it is. */
export type HostPageLanguage = "ja" | "en";

/** 0 = Sunday … 6 = Saturday, as in NIHO's offers. Screens list them from Monday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HostExperiencePhoto {
  /** Stable while editing: NIHO's photo id once #87 is connected, a local one for a photo picked in this browser. */
  id: string;
  /** A public path, or a blob: URL for a photo picked in this browser and not uploaded yet. */
  url: string;
  alt: string;
}

/** One step of 当日の流れ. */
export interface HostTimelineStep {
  /** "18:00" (JST); empty until set. */
  time: string;
  title: string;
  text: string;
}

/** Where guests meet for this experience. */
export interface HostExperienceMeeting {
  /** Shown on the public page. */
  area: string;
  /** Sent only after a booking is confirmed. */
  entrance: string;
  /** The building or its entrance; null until chosen. */
  exteriorPhotoUrl: string | null;
}

/** One bookable offer of an experience (申込の設定). Numbers stay null until the host fills them in. */
export interface HostOffer {
  id: string;
  name: string;
  adultPriceYen: number | null;
  /** Optional. */
  childPriceYen: number | null;
  capacity: number | null;
  /** "18:00" (JST); empty until set. */
  startTime: string;
  durationMinutes: number | null;
  weekdays: readonly Weekday[];
  /** Days it does not run (YYYY-MM-DD, JST), in date order. */
  closedDates: readonly string[];
  /** Asked when a guest books (optional). */
  questions: readonly string[];
}

/** Everything 保存 keeps: the page text in the public order, its photos and its offers (#89). */
export interface HostExperienceContent {
  title: string;
  language: HostPageLanguage;
  /** ひとこと紹介. */
  lead: string;
  /** 当日の言語 ("English and Japanese"). */
  dayLanguage: string;
  highlights: readonly string[];
  description: string;
  included: readonly string[];
  notIncluded: readonly string[];
  notSuitableFor: readonly string[];
  timeline: readonly HostTimelineStep[];
  meeting: HostExperienceMeeting;
  knowBeforeYouGo: readonly string[];
  /** The first photo is the cover. */
  photos: readonly HostExperiencePhoto[];
  offers: readonly HostOffer[];
}

/** The listing's one state. 掲載を申請, 掲載を止める and 申請を取り下げる change it; 保存 does not. */
export interface HostListing {
  status: ListingStatus;
  /** When the listing went live (YYYY-MM-DD, JST). */
  liveSince?: string;
  /** When the listing was submitted for review (YYYY-MM-DD, JST). */
  requestedOn?: string;
}

export interface HostExperience extends HostExperienceContent, HostListing {
  id: string;
  /** The public page's path segment: /experiences/{slug}. */
  slug: string;
  // What the list and the home rows show, derived from the page (editor.ts listingSummary).
  /** Public path under /public; null shows a plain sand thumbnail. */
  cover: string | null;
  schedule: { weekdays: readonly string[]; start: string; durationMinutes: number; capacity: number; priceFromYen: number } | null;
  /** What a draft still needs before it can be submitted ("表紙写真", "料金"). */
  missing: readonly string[];
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
