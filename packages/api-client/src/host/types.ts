// ホスト API の型の別名。正は src/generated/host-openapi.ts（NIHO の書き出したホスト契約から生成）。
// schema 名は NIHO 側の命名（`ExperienceProvider*`）。画面はこの別名だけを使い、契約の名前の変更に追従しない。
import type { components, operations } from "../generated/host-openapi.ts";

type Schemas = components["schemas"];

export type ExperienceHostAuthMe = Schemas["ExperienceHostAuthMe"];
export type ExperienceProvider = Schemas["ExperienceProvider"];
export type ExperienceProviderWithMemberRole = Schemas["ExperienceProviderWithMemberRole"];
export type ExperienceProviderKind = Schemas["ExperienceProviderKind"];
export type ExperienceProviderMemberRole = Schemas["ExperienceProviderMemberRole"];
export type ExperienceProviderReviewStatus = Schemas["ExperienceProviderReviewStatus"];
export type ExperienceProviderConsent = Schemas["ExperienceProviderConsent"];
export type ExperienceProviderListResponse = Schemas["ExperienceProviderListResponse"];
export type ExperienceProviderDetailResponse = Schemas["ExperienceProviderDetailResponse"];
export type ExperienceProviderRegisterRequest = Schemas["ExperienceProviderRegisterRequest"];
export type ExperienceProviderRegisterResponse = Schemas["ExperienceProviderRegisterResponse"];
export type ExperienceProviderUpdateRequest = Schemas["ExperienceProviderUpdateRequest"];
export type ExperienceProviderResponse = Schemas["ExperienceProviderResponse"];
export type ExperienceProviderSubmitResponse = Schemas["ExperienceProviderSubmitResponse"];
export type ExperienceProviderPaymentReadinessReason = Schemas["ExperienceProviderPaymentReadinessReason"];
export type ExperienceProviderPaymentReadinessResponse = Schemas["ExperienceProviderPaymentReadinessResponse"];
export type ExperienceProviderPaymentReuseCandidate = Schemas["ExperienceProviderPaymentReuseCandidate"];
export type ExperienceProviderPaymentReuseCandidatesResponse = Schemas["ExperienceProviderPaymentReuseCandidatesResponse"];
export type ExperienceProviderPaymentReuseRequest = Schemas["ExperienceProviderPaymentReuseRequest"];
export type ExperienceProviderPaymentConnectResponse = Schemas["ExperienceProviderPaymentConnectResponse"];
export type ExperienceHostErrorResponse = Schemas["ErrorResponse"];

export type ExperienceHostOperationId = keyof operations;

export const EXPERIENCE_PROVIDER_KINDS: readonly ExperienceProviderKind[] = ["INDIVIDUAL", "BUSINESS"];
export const EXPERIENCE_PROVIDER_MEMBER_ROLES: readonly ExperienceProviderMemberRole[] = ["OWNER", "EDITOR"];
export const EXPERIENCE_PROVIDER_REVIEW_STATUSES: readonly ExperienceProviderReviewStatus[] = ["DRAFT", "REQUESTED", "APPROVED", "SUSPENDED"];
export const EXPERIENCE_PROVIDER_PAYMENT_READINESS_REASONS: readonly ExperienceProviderPaymentReadinessReason[] = [
  "NOT_CONNECTED",
  "VERIFICATION_REQUIRED",
  "CHARGES_DISABLED",
  "PAYOUTS_DISABLED",
  "RESTRICTED",
  "READY",
];

/**
 * 422 / 409 / 404 の `error.details.reason`（契約の各操作の説明に書かれた値）。schema には無いので、ここで名前を付ける。
 * NIHO が説明に無い理由を返すこともあるので、クライアントは文字列のまま渡す（画面は知っている理由だけで分岐する）。
 */
export const EXPERIENCE_HOST_ERROR_REASONS = [
  "PROVIDER_CONSENT_OUTDATED",
  "PROVIDER_EMAIL_REQUIRED",
  "PROVIDER_REVIEW_STATE_CONFLICT",
  "PROVIDER_PAYMENT_SOURCE_FORBIDDEN",
  "PROVIDER_PAYMENT_LOCKED",
  "PROVIDER_PAYMENT_CONSENT_OUTDATED",
  "PROVIDER_PAYMENT_SOURCE_NOT_READY",
  "PROVIDER_CONNECT_UNAVAILABLE",
  "PROVIDER_PAYMENT_SHARED_ACCOUNT",
  "PROVIDER_PAYMENT_NOT_CONNECTED",
] as const;
export type ExperienceHostErrorReason = (typeof EXPERIENCE_HOST_ERROR_REASONS)[number];
