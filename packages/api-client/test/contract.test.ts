import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { EXPERIENCE_API_CONTRACT } from "../src/contract-meta.ts";
import { buildFixtureExperiences, FIXTURE_IMAGE_SPECS } from "../src/fixtures/experiences.ts";
import { toExperienceSummary } from "../src/fixtures/catalog.ts";
import { placeholderSvg } from "../src/mock/placeholder-image.ts";
import {
  auditContractDocument,
  createContractValidator,
  EXPERIENCE_CONTRACT_DOCUMENT,
  findSensitiveValues,
} from "../src/testing/index.ts";
import type { BookingQuestion } from "../src/types.ts";
import { generateContractTypes } from "../scripts/gen-types.ts";

const validator = createContractValidator();

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

describe("契約の文書", () => {
  it("公開の規則（閉じた形・禁止項目・応答は全項目必須・security: []）を満たす", () => {
    expect(auditContractDocument()).toEqual([]);
  });

  it("版と状態が contract-meta と一致する", () => {
    const info = EXPERIENCE_CONTRACT_DOCUMENT.info as Record<string, unknown>;
    expect(info.version).toBe(EXPERIENCE_API_CONTRACT.version);
    expect(info["x-niho-contract-status"]).toBe(EXPERIENCE_API_CONTRACT.status);
  });

  it("生成した型が契約と一致する（drift が無い）", async () => {
    const committed = await readFile(new URL("../src/generated/openapi.ts", import.meta.url), "utf8");
    expect(committed).toBe(await generateContractTypes());
  });

  it("禁止項目を足すと監査が失敗する（guard の自己検査）", () => {
    const leaked = structuredClone(EXPERIENCE_CONTRACT_DOCUMENT) as Record<string, any>;
    leaked.components.schemas.Host.properties.email = { type: "string" };
    leaked.components.schemas.Host.required.push("email");
    leaked.components.schemas.Provider.properties.stripeAccountId = { type: "string" };
    leaked.components.schemas.Provider.required.push("stripeAccountId");
    leaked.components.schemas.Seller.additionalProperties = true;
    leaked.components.schemas.Region.properties.photoObjectKey = { type: "string" };
    leaked.components.schemas.Region.required.push("photoObjectKey");
    const violations = auditContractDocument(leaked);
    expect(violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Host.email"),
        expect.stringContaining("Provider.stripeAccountId"),
        expect.stringContaining("Seller: additionalProperties"),
        expect.stringContaining("Region.photoObjectKey"),
      ]),
    );
  });

  it("応答の項目を任意にすると監査が失敗する", () => {
    const optional = structuredClone(EXPERIENCE_CONTRACT_DOCUMENT) as Record<string, any>;
    optional.components.schemas.ExperienceSummary.required = ["slug"];
    expect(auditContractDocument(optional).join("\n")).toContain("ExperienceSummary: 応答の項目は常に返す");
  });
});

describe("合成 fixture", () => {
  const experiences = buildFixtureExperiences();

  it("詳細と一覧が契約の schema を満たす", () => {
    for (const experience of experiences) {
      expect(validator.validateSchema("ExperienceDetailResponse", { experience })).toEqual({ ok: true });
    }
    expect(validator.validateSchema("ExperienceCatalogResponse", { experiences: experiences.map(toExperienceSummary) })).toEqual({ ok: true });
  });

  it("検証は余分な項目・null の誤用・欠けた項目を拒否する（validator の自己検査）", () => {
    const [first] = experiences;
    if (!first) throw new Error("fixture missing");
    const extra = { experience: { ...first, internalNote: "x" } };
    const nullTitle = { experience: { ...first, title: null } };
    const { seller: _seller, ...withoutSeller } = first;
    const leakedHost = { experience: { ...first, hosts: [{ displayName: "x", avatar: null, email: "a@example.com" }] } };
    for (const invalid of [extra, nullTitle, { experience: withoutSeller }, leakedHost]) {
      expect(validator.validateSchema("ExperienceDetailResponse", invalid).ok).toBe(false);
    }
    expect(validator.validateSchema("ExperienceDetailResponse", { experience: { ...first, cover: null, meetingPoint: null } })).toEqual({ ok: true });
  });

  it("値の走査はメール・Stripe の ID・objectKey・電話番号を見つける", () => {
    expect(findSensitiveValues({ a: "contact real@gmail.com", b: "acct_1AbCdEfGhIjKlM", c: "article/image/u1/x.jpg", d: "090-1234-5678" })).toHaveLength(4);
    expect(findSensitiveValues({ a: "guest@example.com" })).toEqual([]);
  });

  it("個人情報・秘密・内部の保存先らしい値を含まない", () => {
    expect(findSensitiveValues(experiences)).toEqual([]);
  });

  it("実在と誤認させない（提供者・販売者・迎える人に sample を付け、本文で sample と明示する）", () => {
    for (const experience of experiences) {
      expect(experience.provider.name).toMatch(/sample/i);
      expect(experience.seller.displayName).toMatch(/sample/i);
      experience.hosts.forEach((host) => expect(host.displayName).toMatch(/sample/i));
      expect(experience.description).toMatch(/sample experience/i);
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
      if (experience.meetingPointDisclosure === "AFTER_BOOKING") expect(experience.meetingPoint).toBeNull();
    }
  });

  it("mock-assets の SVG が fixture の画像と一致する", async () => {
    const specs = Object.values(FIXTURE_IMAGE_SPECS).flat();
    const files = (await readdir(new URL("../mock-assets/", import.meta.url))).filter((file) => file.endsWith(".svg")).sort();
    expect(files).toEqual(specs.map((spec) => `${spec.name}.svg`).sort());
    for (const spec of specs) {
      const svg = await readFile(new URL(`../mock-assets/${spec.name}.svg`, import.meta.url), "utf8");
      expect(svg).toBe(placeholderSvg(spec));
    }
  });
});
