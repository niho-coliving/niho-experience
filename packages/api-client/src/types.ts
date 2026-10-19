// 契約の型の別名。正は src/generated/openapi.ts（契約から生成）。
import type { components, operations } from "./generated/openapi.ts";

type Schemas = components["schemas"];

export type ExperienceSlug = Schemas["ExperienceSlug"];
export type RegionKey = Schemas["RegionKey"];
export type OfferId = Schemas["OfferId"];
export type ProviderKind = Schemas["ProviderKind"];
export type PublicImage = Schemas["PublicImage"];
export type Region = Schemas["Region"];
export type ExperienceSummary = Schemas["ExperienceSummary"];
export type ExperienceCatalogResponse = Schemas["ExperienceCatalogResponse"];
export type ExperienceDetail = Schemas["ExperienceDetail"];
export type ExperienceDetailResponse = Schemas["ExperienceDetailResponse"];
export type ExperienceOffer = Schemas["ExperienceOffer"];
export type OfferPricing = Schemas["OfferPricing"];
export type CancellationPolicy = Schemas["CancellationPolicy"];
export type BookingQuestion = Schemas["BookingQuestion"];
export type BookingTerms = Schemas["BookingTerms"];
export type MeetingPoint = Schemas["MeetingPoint"];
export type Occurrence = Schemas["Occurrence"];
export type ExperienceAvailabilityResponse = Schemas["ExperienceAvailabilityResponse"];
export type CheckoutAnswer = Schemas["CheckoutAnswer"];
export type ExperienceCheckoutRequest = Schemas["ExperienceCheckoutRequest"];
export type ExperienceCheckoutResponse = Schemas["ExperienceCheckoutResponse"];
export type CheckoutErrorCode = Schemas["CheckoutErrorCode"];
export type ExperienceCheckoutError = Schemas["ExperienceCheckoutError"];
export type ExperienceCheckoutErrorResponse = Schemas["ExperienceCheckoutErrorResponse"];
export type PublicErrorResponse = Schemas["PublicErrorResponse"];

export type ExperienceApiOperationId = keyof operations;
