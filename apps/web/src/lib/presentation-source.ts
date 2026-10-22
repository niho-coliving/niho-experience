import "server-only";

import { cache } from "react";
import type { PageDocument } from "@niho/web/core";
import type { ExperienceDetailV11, ExperienceSummaryV11, Occurrence } from "@niho-experience/api-client";
import { createPublicSchemaValidator } from "@niho-experience/api-client/server-validation";
import {
  createAssetBindingsV1,
  createStaticCopyV1,
  defaultAssetBindingsV1,
  EN_STATIC_COPY_V1,
  type AssetIdV1,
  type AssetBindingsV1,
  type StaticCopyAccessorV1,
  type StaticCopyValuesV1,
} from "@niho/experience-presentation/v1";
import { config } from "./config";
import { EXPERIENCE_PRESENTATION_IDENTITY, parsePresentationProvenance, type PresentationProvenance } from "./presentation-identity";
import { PAGE_IDS, validatePublishedDocument, type PageId } from "./page-document-contract";
import { readBoundedJson } from "./read-bounded-json";

export type PresentationSourcePage = Readonly<{ pageId: PageId; title: string; meta: { description?: string }; document: PageDocument; provenance: PresentationProvenance }>;
export type PresentationSourceExperience = Readonly<{ listingId: string; campaignPageId: string; summary: ExperienceSummaryV11; detail: ExperienceDetailV11; occurrences: Occurrence[] }>;
export type PresentationSource = Readonly<{
  pages: ReadonlyMap<PageId, PresentationSourcePage>;
  copy: StaticCopyAccessorV1;
  copyValues: StaticCopyValuesV1;
  assets: AssetBindingsV1;
  experiences: readonly PresentationSourceExperience[];
}>;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const same = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (!isObject(left) || !isObject(right)) return false;
  const a = Object.keys(left).sort(), b = Object.keys(right).sort();
  return a.length === b.length && a.every((key, index) => key === b[index] && same(left[key], right[key]));
};
const validatePublicSchema = createPublicSchemaValidator();
const summary = (value: unknown): value is ExperienceSummaryV11 => validatePublicSchema("PublicExperienceSummaryV11", value).ok;
const detail = (value: unknown): value is ExperienceDetailV11 => {
  if (!validatePublicSchema("PublicExperienceDetailV11", value).ok || !isObject(value)) return false;
  return value.meetingPointDisclosure !== "AFTER_BOOKING" || value.meetingPoint === null;
};
const occurrence = (value: unknown): value is Occurrence => validatePublicSchema("PublicExperienceOccurrence", value).ok;

export function parsePresentationSourceExperience(raw: unknown): PresentationSourceExperience {
  if (!isObject(raw) || typeof raw.listingId !== "string" || typeof raw.campaignPageId !== "string" || !summary(raw.summary) || !detail(raw.detail) || raw.summary.slug !== raw.detail.slug || !Array.isArray(raw.occurrences) || !raw.occurrences.every(occurrence)) throw new Error("Invalid presentation experience");
  return { listingId: raw.listingId, campaignPageId: raw.campaignPageId, summary: raw.summary, detail: raw.detail, occurrences: raw.occurrences };
}

function publishedAssetBindings(value: unknown, registry: unknown): AssetBindingsV1 {
  if (!isObject(value) || value.schemaVersion !== 1 || value.siteId !== "experience" || value.locale !== "en" || !isObject(value.bindings)) throw new Error("Invalid presentation asset document");
  if (!same(registry, defaultAssetBindingsV1())) throw new Error("Presentation asset registry identity mismatch");
  const frozen = createAssetBindingsV1(registry as AssetBindingsV1);
  const origin = new URL(config.nihoWebOrigin);
  const absolute = (reference: string) => {
    const url = new URL(reference, origin);
    if (url.origin !== origin.origin || url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid presentation asset origin");
    return url.href;
  };
  const assetPathMatches = (reference: string, digest: string) => new RegExp(`^/experience-presentation/v1/assets/${digest}\\.(?:avif|gif|jpe?g|mp4|png|webp)$`).test(new URL(reference, origin).pathname);
  const bindings: Record<string, AssetBindingsV1[AssetIdV1]> = Object.fromEntries(Object.entries(frozen).map(([id, asset]) => {
    if (!assetPathMatches(asset.src, asset.sha256) || (asset.kind === "video" && !assetPathMatches(asset.poster, asset.posterSha256))) throw new Error(`Presentation registry digest mismatch: ${id}`);
    return [id, asset.kind === "image" ? { ...asset, src: absolute(asset.src) } : { ...asset, src: absolute(asset.src), poster: absolute(asset.poster) }];
  }));
  const expectedImages = Object.entries(frozen).filter(([, asset]) => asset.kind === "image").map(([id]) => id).sort();
  if (JSON.stringify(Object.keys(value.bindings).sort()) !== JSON.stringify(expectedImages)) throw new Error("Incomplete presentation asset document");
  for (const [id, candidate] of Object.entries(value.bindings)) {
    if (!isObject(candidate) || candidate.stableAssetId !== id || candidate.kind !== "image" || candidate.reviewed !== true || typeof candidate.src !== "string" || typeof candidate.alt !== "string" || !isObject(candidate.source) || candidate.source.kind !== "corporate-content-hash" || typeof candidate.source.version !== "string" || !/^[a-f0-9]{64}$/.test(candidate.source.version) || candidate.source.sourceAssetId !== `sha256:${candidate.source.version}` || !assetPathMatches(candidate.src, candidate.source.version) || !Array.isArray(candidate.srcSet)) throw new Error(`Unsupported presentation asset: ${id}`);
    const srcset = candidate.srcSet.map((entry) => {
      if (!isObject(entry) || typeof entry.src !== "string" || !Number.isInteger(entry.width) || (entry.width as number) < 1) throw new Error(`Invalid presentation srcset: ${id}`);
      const hash = /^\/experience-presentation\/v1\/assets\/([a-f0-9]{64})\.[A-Za-z0-9]+$/.exec(new URL(entry.src, origin).pathname)?.[1];
      if (!hash) throw new Error(`Invalid presentation srcset: ${id}`);
      return `${absolute(entry.src)} ${entry.width}w`;
    }).join(", ");
    bindings[id] = {
      kind: "image",
      src: absolute(candidate.src),
      alt: candidate.alt,
      sha256: candidate.source.version,
      ...(srcset ? { srcset } : {}),
      ...(typeof candidate.position === "string" ? { position: candidate.position } : {}),
    };
  }
  // The frozen renderer owns the complete stable ID registry and rejects additions,
  // omissions, mutable references, and unsupported business-media identities.
  return createAssetBindingsV1(bindings as AssetBindingsV1);
}

export function parsePresentationSource(value: unknown): PresentationSource {
  if (!isObject(value) || value.schemaVersion !== 1 || value.locale !== "en" || !same(value.presentation, EXPERIENCE_PRESENTATION_IDENTITY) || !Array.isArray(value.pages) || !isObject(value.copy) || !isObject(value.assets) || !Array.isArray(value.experiences)) throw new Error("Invalid presentation source identity");
  if (value.copy.schemaVersion !== 2) throw new Error("Unsupported presentation copy schema");
  const copyValues = value.copy.values as StaticCopyValuesV1;
  const copy = createStaticCopyV1(copyValues);
  if (value.assets.schemaVersion !== 1 || value.assets.ownership !== "NIHO_CORPORATE" || typeof value.assets.digest !== "string" || !/^[a-f0-9]{64}$/.test(value.assets.digest)) throw new Error("Invalid presentation assets");
  const assets = publishedAssetBindings(value.assets.document, value.assets.registry);
  const pages = new Map<PageId, PresentationSourcePage>();
  for (const raw of value.pages) {
    if (!isObject(raw) || !PAGE_IDS.includes(raw.pageId as PageId) || typeof raw.title !== "string" || !isObject(raw.meta)) continue;
    const pageId = raw.pageId as PageId;
    if (pages.has(pageId)) throw new Error("Duplicate presentation page");
    const provenance = parsePresentationProvenance(raw.provenance);
    pages.set(pageId, { pageId, title: raw.title, meta: { ...(typeof raw.meta.description === "string" ? { description: raw.meta.description } : {}) }, document: validatePublishedDocument(raw.document, pageId), provenance });
  }
  if (PAGE_IDS.some((pageId) => !pages.has(pageId))) throw new Error("Incomplete presentation pages");
  const experiences: PresentationSourceExperience[] = [];
  const slugs = new Set<string>();
  for (const raw of value.experiences) {
    const experience = parsePresentationSourceExperience(raw);
    if (slugs.has(experience.detail.slug)) throw new Error("Duplicate presentation experience");
    slugs.add(experience.detail.slug);
    experiences.push(experience);
  }
  return { pages, copy, copyValues, assets, experiences };
}

export const getPresentationSource = cache(async (): Promise<PresentationSource> => {
  if (!config.presentationSourceDisplayEnabled) throw new Error("Presentation source-display disabled");
  const origin = new URL(config.nihoWebOrigin);
  const response = await fetch(new URL("/api/public/experiences/v1.3/presentation/source-display", origin), { method: "GET", headers: { Accept: "application/json" }, credentials: "omit", redirect: "error", next: { revalidate: 60 }, signal: AbortSignal.timeout(5_000) });
  if (response.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) throw new Error("Presentation source unavailable");
  const size = Number(response.headers.get("content-length"));
  if (Number.isFinite(size) && size > 5 * 1024 * 1024) throw new Error("Presentation source oversized");
  return parsePresentationSource(await readBoundedJson(response, 5 * 1024 * 1024));
});

export async function getPresentationPage(pageId: PageId): Promise<PresentationSourcePage> {
  const page = (await getPresentationSource()).pages.get(pageId);
  if (!page) throw new Error("Presentation page missing");
  return page;
}

export async function getEnglishStaticCopy(): Promise<StaticCopyAccessorV1> {
  return config.presentationSourceDisplayEnabled ? (await getPresentationSource()).copy : EN_STATIC_COPY_V1;
}
