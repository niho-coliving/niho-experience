import { describe, expect, it } from "vitest";
import { EXPERIENCE_PRESENTATION_IDENTITY, parsePresentationProvenance } from "./presentation-identity";
import { PRESENTATION_MANIFEST_V1 } from "@niho/experience-presentation/v1";

describe("frozen presentation identity", () => {
  it("accepts authored pages and the one pinned code-default renderer", () => {
    expect(EXPERIENCE_PRESENTATION_IDENTITY).toMatchObject({ renderer: PRESENTATION_MANIFEST_V1.renderer, copy: PRESENTATION_MANIFEST_V1.staticCopy, legacyCopy: PRESENTATION_MANIFEST_V1.copy, assets: PRESENTATION_MANIFEST_V1.assets, style: { id: PRESENTATION_MANIFEST_V1.style.id, sha256: PRESENTATION_MANIFEST_V1.style.sha256 } });
    expect(parsePresentationProvenance({ schemaVersion: 1, renderingMode: "authored", presentation: null }).renderingMode).toBe("authored");
    expect(parsePresentationProvenance({ schemaVersion: 1, renderingMode: "code-default", presentation: EXPERIENCE_PRESENTATION_IDENTITY }).renderingMode).toBe("code-default");
  });

  it("fails closed for an unknown renderer, changed digest, or extra identity field", () => {
    const changed = { ...EXPERIENCE_PRESENTATION_IDENTITY, renderer: "niho-experience-presentation/v2" };
    const digest = { ...EXPERIENCE_PRESENTATION_IDENTITY, tgzSha256: "f".repeat(64) };
    for (const presentation of [changed, digest]) expect(() => parsePresentationProvenance({ schemaVersion: 1, renderingMode: "code-default", presentation })).toThrow(/Unknown presentation identity/);
    expect(() => parsePresentationProvenance({ schemaVersion: 1, renderingMode: "authored", presentation: null, future: true })).toThrow(/Invalid presentation provenance/);
  });
});
