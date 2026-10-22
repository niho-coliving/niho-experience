import type { StaticCopyAccessorV1 } from "@niho/experience-presentation/v1";
import type { SiteLocale } from "./localized-content";

export function fullNameValidationMessage(locale: SiteLocale, copy: StaticCopyAccessorV1): string {
  return locale === "en" ? "Please enter your full name." : `${copy.text("booking.fullName")}: ${copy.text("booking.required")}`;
}

export function retryUnit(locale: SiteLocale, seconds: number): string {
  return locale === "ja" ? "秒" : seconds === 1 ? "second" : "seconds";
}
