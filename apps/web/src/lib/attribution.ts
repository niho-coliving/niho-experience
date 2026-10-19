import type { ExperienceCheckoutRequest } from "@niho-experience/api-client";

const STORAGE_KEY = "niho-experience:first-touch:v1";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const UTM_VALUE = /^[a-z0-9_-]{1,64}$/;
const ATTRIBUTION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type UTMKey = (typeof UTM_KEYS)[number];
type UTMField = "utmSource" | "utmMedium" | "utmCampaign" | "utmContent";
type LandingPageType = NonNullable<ExperienceCheckoutRequest["landingPageType"]>;
export type CheckoutAttribution = Pick<ExperienceCheckoutRequest, "attributionId" | UTMField | "landingPageType">;
type StorageLike = Pick<Storage, "getItem" | "setItem">;

function safeValue(value: string | null): string | undefined {
  return value && UTM_VALUE.test(value) ? value : undefined;
}

function validLandingPageType(value: unknown): value is LandingPageType {
  return value === "HOME" || value === "LIST" || value === "DETAIL";
}

function landingPageType(pathname: string): LandingPageType | undefined {
  if (pathname === "/") return "HOME";
  if (pathname === "/experiences") return "LIST";
  if (/^\/experiences\/[^/]+$/.test(pathname)) return "DETAIL";
  return undefined;
}

function parseStored(value: unknown): CheckoutAttribution | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const source = safeValue(typeof record.utmSource === "string" ? record.utmSource : null);
  const medium = safeValue(typeof record.utmMedium === "string" ? record.utmMedium : null);
  const campaign = safeValue(typeof record.utmCampaign === "string" ? record.utmCampaign : null);
  const content = safeValue(typeof record.utmContent === "string" ? record.utmContent : null);
  if (!source && !medium && !campaign && !content) return undefined;

  return {
    ...(typeof record.attributionId === "string" && ATTRIBUTION_ID.test(record.attributionId) ? { attributionId: record.attributionId } : {}),
    ...(source ? { utmSource: source } : {}),
    ...(medium ? { utmMedium: medium } : {}),
    ...(campaign ? { utmCampaign: campaign } : {}),
    ...(content ? { utmContent: content } : {}),
    ...(validLandingPageType(record.landingPageType) ? { landingPageType: record.landingPageType } : {}),
  };
}

function newAttributionId(): string {
  return typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : "";
}

/** Capture only the first valid UTM values in this tab; raw URLs and other query keys are discarded. */
export function captureFirstTouchAttribution(
  href: string,
  storage: StorageLike,
  doNotTrack: boolean,
  createId: () => string = newAttributionId,
): boolean {
  if (doNotTrack) return false;
  try {
    if (parseStored(JSON.parse(storage.getItem(STORAGE_KEY) ?? "null"))) return false;
  } catch {
    // Storage can be blocked by browser privacy settings. Attribution is optional.
  }

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  const values = Object.fromEntries(UTM_KEYS.flatMap((key) => {
    const value = safeValue(url.searchParams.get(key));
    return value ? [[key, value]] : [];
  })) as Partial<Record<UTMKey, string>>;
  if (Object.keys(values).length === 0) return false;

  const id = createId();
  const record = parseStored({
    attributionId: id,
    ...(values.utm_source ? { utmSource: values.utm_source } : {}),
    ...(values.utm_medium ? { utmMedium: values.utm_medium } : {}),
    ...(values.utm_campaign ? { utmCampaign: values.utm_campaign } : {}),
    ...(values.utm_content ? { utmContent: values.utm_content } : {}),
    ...(landingPageType(url.pathname) ? { landingPageType: landingPageType(url.pathname) } : {}),
  });
  if (!record) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** Return only the validated attribution fields; DNT and storage failures never block booking. */
export function getCheckoutAttribution(storage: StorageLike, doNotTrack: boolean): CheckoutAttribution | undefined {
  if (doNotTrack) return undefined;
  try {
    return parseStored(JSON.parse(storage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return undefined;
  }
}
