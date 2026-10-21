import { ASSET_SCHEMA_VERSION_V1 } from "./assets.js";
import { COPY_SCHEMA_VERSION_V1 } from "./copy.js";
import { STATIC_COPY_SCHEMA_VERSION_V1, STATIC_COPY_REGISTRY_V1 } from "./static-copy.js";
import { GENERATED_ASSET_REGISTRY_SHA256_V1, GENERATED_COPY_REGISTRY_SHA256_V1, GENERATED_FONT_DIGESTS_V1, GENERATED_STATIC_COPY_REGISTRY_SHA256_V1, GENERATED_STYLE_SHA256_V1 } from "./generated.js";

export const RENDERER_VERSION_V1 = "niho-experience-presentation/v1" as const;
export const STYLE_ID_V1 = "niho-experience-presentation/v1/scoped-css" as const;

export const PRESENTATION_MANIFEST_V1 = Object.freeze({
  renderer: RENDERER_VERSION_V1,
  copy: { schemaVersion: COPY_SCHEMA_VERSION_V1, sha256: GENERATED_COPY_REGISTRY_SHA256_V1 },
  staticCopy: { schemaVersion: STATIC_COPY_SCHEMA_VERSION_V1, keyCount: Object.keys(STATIC_COPY_REGISTRY_V1).length, sha256: GENERATED_STATIC_COPY_REGISTRY_SHA256_V1 },
  assets: { schemaVersion: ASSET_SCHEMA_VERSION_V1, sha256: GENERATED_ASSET_REGISTRY_SHA256_V1 },
  style: { id: STYLE_ID_V1, sha256: GENERATED_STYLE_SHA256_V1, fonts: GENERATED_FONT_DIGESTS_V1 },
  reactPeer: "^18.2.0 || ^19.0.0",
} as const);

export type PresentationIdentityV1 = typeof PRESENTATION_MANIFEST_V1;

function sameIdentity(expected: unknown, actual: unknown): boolean {
  if (expected === actual) return true;
  if (!expected || !actual || typeof expected !== "object" || typeof actual !== "object" || Array.isArray(expected) !== Array.isArray(actual)) return false;
  const expectedRecord = expected as Record<string, unknown>;
  const actualRecord = actual as Record<string, unknown>;
  const expectedKeys = Object.keys(expectedRecord).sort();
  const actualKeys = Object.keys(actualRecord).sort();
  return expectedKeys.length === actualKeys.length && expectedKeys.every((key, index) => key === actualKeys[index] && sameIdentity(expectedRecord[key], actualRecord[key]));
}

export function assertPresentationIdentityV1(value: unknown): asserts value is PresentationIdentityV1 {
  if (!sameIdentity(PRESENTATION_MANIFEST_V1, value)) throw new Error("Unknown or tampered NIHO Experience presentation identity");
}
