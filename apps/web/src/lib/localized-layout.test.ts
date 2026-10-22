import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/config", () => ({ config: { siteUrl: "https://experience.example.com", indexingAllowed: true } }));
vi.mock("@/lib/localized-content", () => ({
  getPreparedJapaneseStaticRelease: async () => { throw new Error("incomplete shell"); },
}));

import JapaneseRootLayout from "@/app/(ja)/ja/layout";

describe("Japanese root layout", () => {
  it("renders only the Japanese unavailable state when the prepared shell fails", async () => {
    const html = renderToStaticMarkup(await JapaneseRootLayout({ children: createElement("p", null, "English child leak") }));
    expect(html).toContain("日本語版はまだ公開されていません");
    expect(html).not.toContain("English child leak");
  });
});
