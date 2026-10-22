import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/config", () => ({ config: { siteUrl: "https://experience.example.com", indexingAllowed: true } }));
vi.mock("@/lib/localized-content", () => ({
  getJapaneseDetail: async () => ({ releaseId: "release-1" }),
  getJapaneseSidecar: async () => ({ releaseId: "release-1" }),
  getPreparedJapaneseStaticRelease: async () => { throw new Error("incomplete static shell"); },
  assertSameJapaneseRelease: vi.fn(),
  japaneseRenderableDocument: vi.fn(),
}));

import { japaneseExperienceMetadata } from "@/components/pages/ExperiencePageContent";

describe("Japanese dynamic metadata", () => {
  it("stays unavailable and noindex when the whole static shell is incomplete", async () => {
    await expect(japaneseExperienceMetadata({
      params: Promise.resolve({ slug: "translated-experience" }),
      searchParams: Promise.resolve({}),
    })).resolves.toEqual({ title: "Japanese experience unavailable", robots: { index: false, follow: false } });
  });
});
