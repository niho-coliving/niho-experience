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

export type ExperienceApiOperationId = keyof operations;
