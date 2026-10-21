import type { ExperienceProviderPaymentReadinessReason } from "@niho-experience/api-client/host";
import type { HostProviderKind, HostProviderReviewStatus } from "@/lib/host/providers";

/*
 * What the host console screens show (#84). The provider's own values (kind, review
 * status, payout readiness) are the host contract's types (#87). Experiences, bookings,
 * sales and the meeting and notification defaults are not in the contract yet, so they
 * stay hand-written from the screens' needs; the screens keep reading these shapes.
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

/**
 * A booking's one state (#90), in the words of NIHO's provider bookings: a request waiting
 * for the host (承認待ち), a booking (確定), one the traveler asked to cancel (要返金), and
 * the ends: 取消済み, お断り (declined by the host) and 期限切れ (not answered in time).
 */
export type HostBookingStatus = "pending" | "confirmed" | "refund_needed" | "cancelled" | "declined" | "expired";

/** The language the guest booked in; the cancellation message starts in it. */
export type HostGuestLanguage = "en" | "ja";

/** 取消理由: 運営者の都合 / 旅行者からの依頼 / その他. */
export type HostCancelReason = "host" | "guest" | "other";

/** 返金: the whole payment, half of it, or nothing. */
export type HostRefundChoice = "full" | "half" | "none";

/** An answer to one of the offer's questions (申込時の質問), as the guest wrote it. */
export interface HostBookingAnswer {
  question: string;
  answer: string;
}

/** One line of 時系列. */
export interface HostBookingEvent {
  /** YYYY-MM-DDTHH:MM in Japan. */
  at: string;
  text: string;
}

export type HostMessageStatus = "sent" | "failed";

/** A message the host sent the guest through NIHO (連絡の履歴). */
export interface HostBookingMessage {
  id: string;
  /** YYYY-MM-DDTHH:MM in Japan. */
  at: string;
  subject: string;
  body: string;
  status: HostMessageStatus;
}

/** The version of the meeting guide (集合案内) the guest has: NIHO sends it with the confirmation. */
export interface HostMeetingGuideCopy {
  version: number;
  /** YYYY-MM-DDTHH:MM in Japan; null until the booking is confirmed. */
  sentAt: string | null;
}

export interface HostBooking {
  id: string;
  experienceId: string;
  offerId: string;
  /** The offer's name when it was booked. */
  offer: string;
  guest: string;
  email: string;
  language: HostGuestLanguage;
  /** Local date and times in Japan (YYYY-MM-DD, HH:MM). */
  date: string;
  start: string;
  end: string;
  adults: number;
  children: number;
  /** adults + children. */
  guests: number;
  /** The prices when it was booked (yen, tax included). */
  adultPriceYen: number;
  childPriceYen: number | null;
  /** adults × the adult price + children × the child price. */
  amountYen: number;
  status: HostBookingStatus;
  channel: string;
  /** 申込メモ; empty when the guest wrote none. */
  note: string;
  answers: readonly HostBookingAnswer[];
  /** null when no guide goes with it (a request that was declined or expired). */
  meetingGuide: HostMeetingGuideCopy | null;
  // The times below are YYYY-MM-DDTHH:MM in Japan, null until they happen.
  /** 与信: the card hold when the guest booked. */
  authorizedAt: string | null;
  paidAt: string | null;
  /** Requests: by when the host must answer. */
  respondBy: string | null;
  cancelRequestedAt: string | null;
  cancelledAt: string | null;
  cancelReason: HostCancelReason | null;
  /** 取消連絡: what the guest was told when it was cancelled. */
  cancelMessage: string | null;
  /** 累計返金. */
  refundedYen: number;
  timeline: readonly HostBookingEvent[];
  messages: readonly HostBookingMessage[];
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

export type PaymentReadinessReason = ExperienceProviderPaymentReadinessReason;

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
