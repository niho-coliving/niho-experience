import type {
  ExperienceDetail,
  ExperienceDetailV11,
  PublicImage,
  PublicImageV11,
  ExperienceSummary,
  ExperienceSummaryV11,
  ExperienceSummaryV12,
} from "@niho-experience/api-client";

export type ExperienceDetailForSite = ExperienceDetail | ExperienceDetailV11;
export type ExperienceSummaryForSite = ExperienceSummary | ExperienceSummaryV11 | ExperienceSummaryV12;
export type PublicImageForSite = PublicImage | PublicImageV11;
