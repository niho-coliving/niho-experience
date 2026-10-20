import { describe, expect, it } from "vitest";
import { browseHref, readBrowseContext } from "./browse-context";

describe("public browsing context", () => {
  it("keeps only validated public preferences, never a token, contact data or arbitrary return URL", () => {
    const context = readBrowseContext({ q: "  dinner  with locals ", theme: "FOOD", date: "2026-12-05", guests: "2", token: "private", guestEmail: "guest@example.com", returnTo: "https://other.example" });
    expect(browseHref("/experiences/dinner/book", context, "offer_dinner")).toBe("/experiences/dinner/book?q=dinner+with+locals&theme=FOOD&date=2026-12-05&guests=2&offer=offer_dinner");
  });

  it.each([
    { q: ["a", "b"], theme: ["FOOD", "CRAFT"], date: ["2026-12-05"], guests: ["2", "3"] },
    { q: "  ", theme: "UNKNOWN", date: "2026-02-30", guests: "99" },
    { guests: "2.5", date: "https://other.example" },
  ])("drops ambiguous or invalid preselection instead of inventing a booking", (query) => {
    expect(browseHref("/experiences", readBrowseContext(query))).toBe("/experiences");
  });
});
