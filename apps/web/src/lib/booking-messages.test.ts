import { describe, expect, it } from "vitest";
import { createStaticCopyV1, defaultStaticCopyValuesV1 } from "@niho/experience-presentation/v1";
import { fullNameValidationMessage, retryUnit } from "./booking-messages";

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
});
