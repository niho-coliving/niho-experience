import type { ExperienceProviderPaymentReadinessReason } from "@niho-experience/api-client/host";
import type { HostProviderKind, HostProviderReviewStatus } from "@/lib/host/providers";
import type { HostReviewTag } from "./reviews";

/*
 * What the host console screens show (#84). The provider's own values (kind, review
 * status, payout readiness) are the host contract's types (#87). Experiences, bookings,
 * messages, reviews, sales and the meeting and notification defaults are not in the contract yet, so
 * they stay hand-written from the screens' needs; the screens keep reading these shapes.
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

/**
 * 出欠 (#107): 来た / 来なかった, recorded by the host from the session's start (null = 未記録).
 * NIHO sends no thanks and no review request for a booking that did not come.
 */
export type HostAttendance = "attended" | "no_show";

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
  /** The guest's name. NIHO never shows hosts the guest's email address: they write through the thread (#103). */
  guest: string;
  language: HostGuestLanguage;
  /** Where the guest lives (ISO 3166-1 alpha-2, "GB"; the screens write it in Japanese); null when they gave none. */
  country: string | null;
  /**
   * 食べものの希望 in short Japanese words ("ベジタリアン", "甲殻類なし"): NIHO's own field of the
   * booking, apart from the offer's questions. One word per guest who has it: two vegetarians
   * in one booking are written twice.
   */
  dietary: readonly string[];
  /**
   * The phone number the guest chose to give (optional). Only the session's own screen (この回,
   * #107) shows it; 予約, メッセージ and ホーム never carry it (console-data.ts bookingList).
   */
  phone: string | null;
  /** 出欠; null until the host records it. */
  attendance: HostAttendance | null;
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
}

/*
 * メッセージ (#106, Epic #103): one thread per guest and experience. A question before booking
 * and, once the guest books, the booking's messages are the same thread. The host's reply
 * reaches the guest by email and the guest's email answer comes back into the thread; the
 * guest's address stays with NIHO. NIHO translates the guest's words into Japanese, and the
 * host checks the English of a reply before it is sent.
 * TODO(#87): NIHO's questions (niho-app#19319), booking messages (#19238) and notifications
 * (#19315) are not in the host contract yet.
 */

/** Whether NIHO could send the host's reply: 送信済み / 送れませんでした. */
export type HostMessageStatus = "sent" | "failed";

/** What a guest wrote, and NIHO's Japanese translation of it. */
export interface HostGuestMessage {
  id: string;
  from: "guest";
  /** YYYY-MM-DDTHH:MM in Japan. */
  at: string;
  /** The guest's own words. */
  original: string;
  /** The language they are in (BCP 47: "en", "ko"). */
  language: string;
  /** NIHO's Japanese translation; null when NIHO could not translate it (the screen shows the original). Unused for Japanese. */
  translation: string | null;
  /** The guest answered NIHO's email instead of writing on the site. */
  viaEmail: boolean;
}

/** What the host sent: the Japanese they wrote and the English they checked. */
export interface HostReplyMessage {
  id: string;
  from: "host";
  /** YYYY-MM-DDTHH:MM in Japan. */
  at: string;
  /** Empty when the host wrote the English directly. */
  japanese: string;
  /** What reached the guest. */
  english: string;
  status: HostMessageStatus;
}

export type HostThreadMessage = HostGuestMessage | HostReplyMessage;

/** The booking a thread is joined to, as 予約 has it. */
export interface HostThreadBooking {
  id: string;
  /** YYYY-MM-DD and HH:MM in Japan. */
  date: string;
  start: string;
  guests: number;
}

export interface HostThread {
  id: string;
  experienceId: string;
  /** The guest's name as they gave it (never their email). */
  guest: string;
  /** What the question is about ("子ども"); null when NIHO names none. */
  topic: string | null;
  /** Null for a question before booking. */
  booking: HostThreadBooking | null;
  /** In time order. */
  messages: readonly HostThreadMessage[];
}

/*
 * レビュー (#108, Epic #103): only a guest who booked can write one, one per booking: 1–5 stars,
 * their words, the good points (fixed choices), the name and country they show, and a note for
 * the host only. NIHO checks a review before it is published and tells the host first. The host
 * may publish one reply (and correct it later) and report a review to NIHO, but never removes or
 * changes it. NIHO keeps the guest's words as written and its Japanese translation apart; the
 * host writes the reply in Japanese and checks the English that is published.
 * TODO(#87): NIHO's reviews (niho-app#19314) are not in the host contract yet.
 */

/** 公開前 (NIHO is checking it) / 公開中 (on the experience's page). */
export type HostReviewStatus = "pending" | "published";

/** What a guest wrote (the review, or the note to the host): their own words and NIHO's translation, as a guest's message has them. */
export type HostReviewText = Pick<HostGuestMessage, "original" | "language" | "translation">;

/** The host's one public reply: the Japanese they wrote and the English they checked, which is what the page shows. */
export interface HostReviewReply {
  /** Empty when the host wrote the English directly. */
  japanese: string;
  english: string;
  /** YYYY-MM-DDTHH:MM in Japan. */
  publishedAt: string;
  /** The last correction (返信を直す), YYYY-MM-DDTHH:MM in Japan; null when it was never corrected. */
  editedAt: string | null;
}

/** Why the host reported a review to NIHO: 個人情報が書かれている / 事実と違う / 不適切な内容 / その他. */
export type HostReviewReportReason = "personal" | "untrue" | "inappropriate" | "other";

/** The host's report. NIHO decides what happens to the review; it stays as it is meanwhile. */
export interface HostReviewReport {
  /** YYYY-MM-DDTHH:MM in Japan. */
  at: string;
  reason: HostReviewReportReason;
}

export interface HostReview {
  id: string;
  experienceId: string;
  /** The booking it was written for: one review per booking, never for one the guest did not come to. */
  bookingId: string;
  /** The session's day (YYYY-MM-DD, JST). */
  sessionDate: string;
  /** What the guest shows: their first name and where they live, in Japanese ("イギリス"). */
  reviewer: { name: string; country: string };
  /** 1–5. */
  rating: number;
  /**
   * よかった点: the identifiers of NIHO's fixed choices (REVIEW_TAGS in reviews.ts has the words the host reads).
   * TODO(#87): NIHO の API（niho-coliving/niho-app#19314）が入ったら識別子を合わせる。
   */
  tags: readonly HostReviewTag[];
  body: HostReviewText;
  /** あなただけへのメモ: for the host only, never published; null when the guest wrote none. */
  privateNote: HostReviewText | null;
  /** YYYY-MM-DDTHH:MM in Japan. */
  writtenAt: string;
  status: HostReviewStatus;
  /** YYYY-MM-DDTHH:MM in Japan; null while NIHO checks it. */
  publishedAt: string | null;
  reply: HostReviewReply | null;
  report: HostReviewReport | null;
}

/**
 * A ledger line's state, in the words of NIHO's provider sales: 計上済み (in the ledger),
 * 入金済み (a payout that reached the bank) and 保留 (not settled yet; a payout on its way
 * reads 送金中).
 */
export type HostSaleStatus = "posted" | "paid" | "pending";

interface HostSaleLine {
  id: string;
  /** YYYY-MM-DD (JST): the day the money moved (the charge, the refund, the payout). */
  date: string;
  status: HostSaleStatus;
  /** Yen, tax included, always positive: `kind` says which way it goes. */
  amountYen: number;
}

/** A guest's payment for a booking (売上). */
export interface HostSaleCharge extends HostSaleLine {
  kind: "sale";
  /** The experience as the ledger names it. */
  experience: string;
  guest: string;
  /** 申込経路: NIHO, NIHO 埋め込み or 体験サイト. */
  channel: string;
  offer: string;
  guests: number;
  /** What NIHO and Stripe keep of the payment (手数料). */
  feeYen: number;
  /** The booking it pays for, when 予約 lists it. */
  bookingId?: string;
}

/** Money given back to a guest (返金). */
export interface HostSaleRefund extends HostSaleLine {
  kind: "refund";
  guest: string;
  channel: string;
  bookingId?: string;
}

/** Money sent from the sales to the host's bank account (口座入金). */
export interface HostSalePayout extends HostSaleLine {
  kind: "payout";
  /** The days of sales it covers (YYYY-MM-DD, JST). */
  from: string;
  to: string;
}

export type HostSale = HostSaleCharge | HostSaleRefund | HostSalePayout;
export type HostSaleKind = HostSale["kind"];

export type PaymentReadinessReason = ExperienceProviderPaymentReadinessReason;

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
  /** The provider agreed to the version of NIHO's provider terms in force (審査を申請 needs it). */
  consentCurrent: boolean;
  meetingPoint: HostMeetingDefaults;
  notificationEmail: string;
}
