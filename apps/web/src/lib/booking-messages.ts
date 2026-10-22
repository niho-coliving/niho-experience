import type { StaticCopyAccessorV1 } from "@niho/experience-presentation/v1";
import type { CheckoutErrorCode } from "@niho-experience/api-client";
import type { SiteLocale } from "./localized-content";

export function fullNameValidationMessage(locale: SiteLocale, copy: StaticCopyAccessorV1): string {
  return locale === "en" ? "Please enter your full name." : `${copy.text("booking.fullName")}: ${copy.text("booking.required")}`;
}

export function retryUnit(locale: SiteLocale, seconds: number): string {
  return locale === "ja" ? "秒" : seconds === 1 ? "second" : "seconds";
}

const checkoutErrorCopy: Record<CheckoutErrorCode, string> = {
  VALIDATION_ERROR: "Please review your details and try again.", INPUT_INVALID: "Please check the highlighted details.", ANSWERS_INVALID: "Please check your answers.", CONSENT_OUTDATED: "The booking terms changed. Return to the experience and review them.", OCCURRENCE_INVALID: "This date is no longer available. Choose another date.", UNAVAILABLE: "Bookings are paused. Nothing has been charged.", FULL: "This date just filled up. Choose another date.", HOLD_LIMIT: "Too many places are being held. Please try a different date.", REQUEST_MISMATCH: "Please review your booking and try again.", QUESTIONS_CHANGED: "The booking questions changed. Return to the experience and review them.", PRICE_CHANGED: "The price changed. Return to the experience and review the total.", RATE_LIMITED: "Too many attempts. Please wait before trying again.", CHECKOUT_UNAVAILABLE: "We couldn't reach checkout. Your details are still here; please try again.",
};

export function checkoutProblem(code: CheckoutErrorCode, locale: SiteLocale, copy: StaticCopyAccessorV1): string {
  if (locale === "en") return checkoutErrorCopy[code];
  if (code === "CONSENT_OUTDATED") return copy.text("booking.termsChanged");
  if (code === "QUESTIONS_CHANGED") return copy.text("booking.questionsChanged");
  if (code === "PRICE_CHANGED") return copy.text("booking.priceChanged");
  if (code === "OCCURRENCE_INVALID" || code === "FULL") return copy.text("availability.fullyBooked");
  if (code === "UNAVAILABLE") return copy.text("booking.paused");
  if (code === "CHECKOUT_UNAVAILABLE") return copy.text("booking.checkoutError");
  // A Retry-After countdown is handled by the caller; do not interpolate unknown seconds.
  return copy.text("booking.checkoutUnexpected");
}
