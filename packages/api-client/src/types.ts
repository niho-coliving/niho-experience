// 契約の型の別名。正は src/generated/openapi.ts（NIHO の書き出した契約から生成）。
// 契約の schema 名は NIHO 側の命名（`PublicExperience*`）。画面はこの別名だけを使い、契約の名前の変更に追従しない。
import type { components, operations } from "./generated/openapi.ts";

type Schemas = components["schemas"];

export type ExperienceSlug = Schemas["PublicExperienceSlug"];
export type RegionKey = Schemas["PublicExperienceRegionKey"];
export type OfferId = Schemas["PublicExperienceOfferId"];
export type ProviderKind = Schemas["PublicExperienceProviderKind"];
export type PublicImage = Schemas["PublicExperienceImage"];
export type PublicImageV11 = Schemas["PublicExperienceImageV11"];
export type Region = Schemas["PublicExperienceRegion"];
export type ExperienceSummary = Schemas["PublicExperienceSummary"];
export type ExperienceCatalogResponse = Schemas["PublicExperienceCatalogResponse"];
export type ExperienceSummaryV11 = Schemas["PublicExperienceSummaryV11"];
export type ExperienceCatalogResponseV11 = Schemas["PublicExperienceCatalogResponseV11"];
export type ExperienceSiteTheme = Schemas["ExperienceSiteTheme"];
export type ExperienceSummaryV12 = Schemas["PublicExperienceSummaryV12"];
export type ExperienceCatalogResponseV12 = Schemas["PublicExperienceCatalogResponseV12"];
export type ExperienceDetail = Schemas["PublicExperienceDetail"];
export type ExperienceDetailResponse = Schemas["PublicExperienceDetailResponse"];
export type ExperienceDetailV11 = Schemas["PublicExperienceDetailV11"];
export type ExperienceDetailResponseV11 = Schemas["PublicExperienceDetailResponseV11"];
export type ExperienceOffer = Schemas["PublicExperienceOffer"];
export type OfferPricing = Schemas["PublicExperienceOfferPricing"];
export type CancellationPolicy = Schemas["PublicExperienceCancellationPolicy"];
export type BookingQuestion = Schemas["PublicExperienceBookingQuestion"];
export type BookingTerms = Schemas["PublicExperienceBookingTerms"];
export type MeetingPoint = Schemas["PublicExperienceMeetingPoint"];
export type Occurrence = Schemas["PublicExperienceOccurrence"];
export type ExperienceAvailabilityResponse = Schemas["PublicExperienceAvailabilityResponse"];
export type CheckoutAnswer = Schemas["PublicExperienceCheckoutAnswer"];
export type ExperienceCheckoutRequest = Schemas["PublicExperienceCheckoutRequest"];
export type ExperienceCheckoutResponse = Schemas["PublicExperienceCheckoutResponse"];
export type CheckoutErrorCode = Schemas["PublicExperienceCheckoutErrorCode"];
export type ExperienceCheckoutError = Schemas["PublicExperienceCheckoutError"];
export type ExperienceCheckoutErrorResponse = Schemas["PublicExperienceCheckoutErrorResponse"];
export type PublicErrorResponse = Schemas["PublicProjectionErrorResponse"];

/**
 * v1.2 の選択済み日本語 release。生成済み契約へ取り込まれるまでの選別型で、
 * NIHO の public contract a532a456 の同名 schema だけを写す。
 */
export type ExperienceLocale = "ja";
export type ExperienceInterfaceCopyResponse = {
  schemaVersion: 2;
  releaseId: string;
  locale: ExperienceLocale;
  values: Readonly<Record<string, string>>;
};
export type SelectedExperienceCatalogResponse = {
  releaseId: string;
  locale: ExperienceLocale;
  displayLocale: ExperienceLocale;
  copySchemaVersion: 1 | 2;
  experiences: ExperienceSummaryV11[];
};
export type SelectedExperienceDetailResponse = {
  releaseId: string;
  locale: ExperienceLocale;
  displayLocale: ExperienceLocale;
  copySchemaVersion: 1 | 2;
  localization: {
    termsFingerprint: string;
    bookingReady: boolean;
    unavailableCopyKey: "booking.unavailableJa" | null;
  };
  experience: ExperienceDetailV11;
};
export type SelectedExperienceAvailabilityResponse = {
  releaseId: string;
  locale: ExperienceLocale;
  generatedAt: string;
  timeZone: "Asia/Tokyo";
  windowDays: 90;
  occurrences: Occurrence[];
};
export type LocalizedCheckoutOutdatedError = {
  code: "LOCALIZATION_OUTDATED";
  message: string;
};

export type ExperienceApiOperationId = keyof operations;
