import { describe, expect, it } from "vitest";
import { seoDescription } from "./seo-description";

describe("seoDescription", () => {
  it("keeps a short lead intact", () => {
    expect(seoDescription("Meet a local host. Share dinner.")).toBe("Meet a local host. Share dinner.");
  });

  it("prefers the last complete sentence within 160 characters", () => {
    const lead = `${"A".repeat(85)}. ${"B".repeat(85)}.`;
    expect(seoDescription(lead)).toBe(`${"A".repeat(85)}.`);
  });

  it("falls back to a word boundary with an ellipsis", () => {
    const result = seoDescription("Kamakura hosts welcome you " + "for a relaxed evening ".repeat(10));
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result).toMatch(/ evening…| relaxed…| a…| for…/);
  });
});
