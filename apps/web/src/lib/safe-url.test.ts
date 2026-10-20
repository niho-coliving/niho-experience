import { describe, expect, it } from "vitest";
import { safeNihoHelpUrl } from "./safe-url";

describe("NIHO support destination", () => {
  it("accepts an operator-configured destination on the NIHO origin", () => {
    expect(safeNihoHelpUrl("https://niho.life/contact", "https://niho.life/")).toBe("https://niho.life/contact");
  });
  it.each(["", "javascript:alert(1)", "https://other.example/contact", "https://niho.life.other.example/contact", "https://user:password@niho.life/contact", "https://niho.life/contact?token=private", "https://niho.life/contact#private"])("rejects an unsafe or personalized destination: %s", (url) => {
    expect(safeNihoHelpUrl(url, "https://niho.life")).toBeNull();
  });
  it("handles an invalid NIHO origin by using the existing support fallback", () => {
    expect(safeNihoHelpUrl("https://niho.life/contact", "invalid")).toBeNull();
  });
});
