import { describe, expect, it } from "vitest";
import { createStaticCopyV1, defaultStaticCopyValuesV1 } from "@niho/experience-presentation/v1";
import { checkoutProblem, fullNameValidationMessage, retryUnit } from "./booking-messages";

const copy = createStaticCopyV1(defaultStaticCopyValuesV1());

describe("localized booking messages", () => {
  it("preserves the established English full-name validation sentence", () => {
    expect(fullNameValidationMessage("en", copy)).toBe("Please enter your full name.");
  });

  it("uses Japanese seconds rather than an English plural noun", () => {
    expect(retryUnit("ja", 1)).toBe("秒");
    expect(retryUnit("ja", 30)).toBe("秒");
    expect(retryUnit("en", 1)).toBe("second");
    expect(retryUnit("en", 2)).toBe("seconds");
  });

  it("keeps recovery actions and input-retention reassurance in English checkout errors", () => {
    expect(checkoutProblem("FULL", "en", copy)).toContain("filled up. Choose another date");
    expect(checkoutProblem("HOLD_LIMIT", "en", copy)).toContain("different date");
    expect(checkoutProblem("CHECKOUT_UNAVAILABLE", "en", copy)).toContain("Your details are still here");
    expect(checkoutProblem("INPUT_INVALID", "en", copy)).toContain("highlighted details");
  });

  it("uses the selected Japanese copy and handles a rate limit without Retry-After", () => {
    const japanese = createStaticCopyV1({ ...defaultStaticCopyValuesV1(), "booking.checkoutError": "入力内容を保持しています。もう一度お試しください。", "booking.checkoutUnexpected": "時間をおいてもう一度お試しください。" });
    expect(checkoutProblem("CHECKOUT_UNAVAILABLE", "ja", japanese)).toBe("入力内容を保持しています。もう一度お試しください。");
    expect(checkoutProblem("RATE_LIMITED", "ja", japanese)).toBe("時間をおいてもう一度お試しください。");
  });
});
