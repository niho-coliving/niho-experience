import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { buildMockOccurrences, MOCK_AVAILABILITY_WINDOW_DAYS } from "../src/fixtures/availability.ts";
import { toExperienceSummary } from "../src/fixtures/catalog.ts";
import { buildFixtureExperiences, FIXTURE_EXPERIENCE_SITE_ORIGIN } from "../src/fixtures/experiences.ts";
import { buildPilotExperiences, PILOT_CONTENT_STATUS } from "../src/fixtures/pilot-experiences.ts";
import { createContractValidator, findSensitiveValues } from "../src/testing/index.ts";
import type { BookingQuestion } from "../src/types.ts";

const validator = createContractValidator();
const experiences = buildPilotExperiences();

function fingerprint(questions: BookingQuestion[]): string {
  const canonical = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    description: question.description,
    inputType: question.inputType,
    required: question.required,
    options: question.options.map((option) => ({ id: option.id, label: option.label })),
  }));
  return createHash("sha256").update(JSON.stringify(canonical), "utf8").digest("hex");
}

describe("pilot fixture（テストサイト用・推奨値）", () => {
  it("推奨値であることを示す状態を持つ", () => {
    expect(PILOT_CONTENT_STATUS).toBe("provisional");
  });

  it("詳細と一覧が契約の schema を満たす", () => {
    for (const experience of experiences) {
      expect(validator.validateSchema("ExperienceDetailResponse", { experience })).toEqual({ ok: true });
    }
    expect(validator.validateSchema("ExperienceCatalogResponse", { experiences: experiences.map(toExperienceSummary) })).toEqual({ ok: true });
  });

  it("開催回の mock が契約の schema を満たす", () => {
    const now = new Date("2026-10-19T00:00:00.000Z");
    for (const experience of experiences) {
      const occurrences = buildMockOccurrences({ experience, now });
      expect(occurrences.length).toBeGreaterThan(0);
      const response = { generatedAt: now.toISOString(), timeZone: "Asia/Tokyo", windowDays: MOCK_AVAILABILITY_WINDOW_DAYS, occurrences };
      expect(validator.validateSchema("ExperienceAvailabilityResponse", response)).toEqual({ ok: true });
    }
  });

  it("個人情報・秘密・内部の保存先らしい値を含まない", () => {
    expect(findSensitiveValues(experiences)).toEqual([]);
  });

  it("slug が一意で、合成 fixture と重ならず、canonical がサイトの体験 URL になっている", () => {
    const slugs = experiences.map((experience) => experience.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const syntheticSlugs = new Set(buildFixtureExperiences().map((experience) => experience.slug));
    for (const experience of experiences) {
      expect(syntheticSlugs.has(experience.slug)).toBe(false);
      expect(experience.canonicalUrl).toBe(`${FIXTURE_EXPERIENCE_SITE_ORIGIN}/experiences/${experience.slug}`);
    }
  });

  it("質問の fingerprint が NIHO と同じ算出で一致する", () => {
    for (const experience of experiences) {
      for (const offer of experience.offers) {
        expect(offer.bookingQuestionsFingerprint).toBe(fingerprint(offer.bookingQuestions));
      }
    }
  });

  it("写真の位置の参照が photos[] の中にある", () => {
    for (const experience of experiences) {
      for (const item of experience.timeline) {
        if (item.photoIndex !== null) expect(item.photoIndex).toBeLessThan(experience.photos.length);
      }
      const exterior = experience.meetingPoint?.exteriorPhotoIndex;
      if (exterior !== undefined && exterior !== null) expect(exterior).toBeLessThan(experience.photos.length);
    }
  });

  it("写真は仮素材だけ（実在の写真の URL を入れていない）", () => {
    for (const experience of experiences) {
      const urls = [experience.cover, ...experience.photos, ...experience.hosts.map((host) => host.avatar), experience.provider.logo]
        .filter((image) => image !== null)
        .map((image) => image.url);
      for (const url of urls) expect(url.startsWith("data:image/svg+xml")).toBe(true);
    }
  });

  it("原稿の約束：伝統的な金継ぎと書かず、特定の人に会えると約束しない", () => {
    for (const experience of experiences) {
      const text = [experience.title, experience.lead, experience.description, ...experience.highlights, ...experience.knowBeforeYouGo].join("\n");
      expect(text).not.toMatch(/traditional kintsugi/i);
      expect(text).not.toMatch(/guaranteed to meet|you will meet the head priest/i);
    }
  });
});
