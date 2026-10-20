/**
 * Booking funnel events (#14). Vendor-neutral: nothing leaves the browser until
 * an analytics tool and consent handling are chosen and a sink is registered.
 *
 * Only the properties listed per event are kept, and string values must look
 * like identifiers (slugs, codes). Names, emails, phone numbers, notes, tokens
 * and URLs can therefore never be sent, even by mistake.
 */
export const FUNNEL_EVENTS = {
  list_view: ["theme", "date_filtered", "result_count"],
  experience_view: ["experience", "availability"],
  slot_continue: ["experience", "guests"],
  booking_form_view: ["experience", "guests", "total_jpy"],
  booking_unavailable: ["experience", "error_code"],
  checkout_start: ["experience", "guests", "total_jpy"],
  checkout_error: ["experience", "error_code"],
  host_view: ["signup_mode"],
  host_start: ["signup_mode"],
} as const;

export type FunnelEvent = keyof typeof FUNNEL_EVENTS;
type Value = string | number | boolean;
export type EventProps = Record<string, Value | undefined>;
export interface TrackedEvent {
  event: FunnelEvent;
  props: Record<string, Value>;
}

const SAFE_STRING = /^[a-z0-9_-]{1,64}$/;
const UMAMI_WEBSITE_ID = /^[0-9a-f-]{36}$/i;
const ALLOWED_UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

export function doNotTrackEnabled(value: string | null | undefined): boolean {
  return value === "1" || value === "yes";
}

export function analyticsModeForRuntime(apiMode: "http" | "mock", siteUrl: string, websiteId: string): "debug" | "off" | "umami" {
  if (apiMode === "mock") return "debug";
  return siteUrl === "https://experience.niho.life" && UMAMI_WEBSITE_ID.test(websiteId) ? "umami" : "off";
}

export function shouldStartUmami(websiteId: string, doNotTrack: string | null | undefined): boolean {
  return UMAMI_WEBSITE_ID.test(websiteId) && !doNotTrackEnabled(doNotTrack);
}

/** Removes query values outside the approved UTM set before Umami sees a URL. */
export function sanitizeUmamiPayload(
  type: string,
  payload: Record<string, unknown>,
  currentOrigin: string,
): Record<string, unknown> | false {
  try {
    if (type !== "pageview" && type !== "event") return false;
    // Umami's tracker reports ordinary pageviews as unnamed `event` payloads.
    // Named events must still be one of our allowlisted funnel events.
    if (type === "event" && payload.name !== undefined && (typeof payload.name !== "string" || !Object.hasOwn(FUNNEL_EVENTS, payload.name))) return false;
    const rawUrl = payload.url;
    if (typeof rawUrl !== "string") return false;

    const url = new URL(rawUrl, currentOrigin);
    if (currentOrigin !== "https://experience.niho.life" || url.origin !== currentOrigin || url.username || url.password) return false;

    const isBookingResult = url.pathname === "/booking" || url.pathname.startsWith("/booking/");
    const detail = /^\/experiences\/([a-z0-9][a-z0-9-]{1,62}[a-z0-9])(\/book)?$/.exec(url.pathname);
    const isBookingForm = Boolean(detail?.[2]);
    const pageTitles: Record<string, string> = { "/": "NIHO Experience", "/experiences": "Experiences", "/host": "Host an experience", "/help": "Booking help" };
    if (!isBookingResult && !detail && !Object.hasOwn(pageTitles, url.pathname)) return false;
    url.hash = "";

    if (isBookingResult) {
      // Booking paths may contain opaque result identifiers as well as query tokens.
      url.pathname = "/booking";
      url.search = "";
    } else if (isBookingForm) {
      url.search = "";
    } else {
      const search = new URLSearchParams();
      for (const key of ALLOWED_UTM_PARAMS) {
        const value = url.searchParams.get(key);
        if (value && SAFE_STRING.test(value)) search.set(key, value);
      }
      url.search = search.toString();
    }

    // Rebuild the documented payload. Unknown fields, titles, distinct IDs and tags
    // must not carry booking/customer data across the final send boundary.
    const safePayload: Record<string, unknown> = {
      url: `${url.pathname}${url.search}`,
      hostname: url.hostname,
      title: isBookingResult || isBookingForm ? "Booking" : detail ? "Experience" : pageTitles[url.pathname],
    };
    if (typeof payload.website === "string" && UMAMI_WEBSITE_ID.test(payload.website)) safePayload.website = payload.website;
    if (typeof payload.screen === "string" && /^\d{1,5}x\d{1,5}$/.test(payload.screen)) safePayload.screen = payload.screen;
    if (typeof payload.language === "string" && /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,3}$/i.test(payload.language)) safePayload.language = payload.language;
    if (type === "event" && typeof payload.name === "string") {
      safePayload.name = payload.name;
      const rawData = payload.data;
      const props: EventProps = {};
      if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
        for (const [key, value] of Object.entries(rawData)) {
          if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") props[key] = value;
        }
      }
      safePayload.data = sanitize(payload.name as FunnelEvent, props).props;
    } else if (type === "event") {
      // Unnamed Umami events are pageviews, so they must not carry event data.
      delete safePayload.data;
    }
    if (typeof payload.referrer === "string" && payload.referrer) {
      try {
        const referrer = new URL(payload.referrer, currentOrigin);
        safePayload.referrer = ["https:", "http:"].includes(referrer.protocol) ? referrer.origin : "";
      } catch {
        safePayload.referrer = "";
      }
    }
    return safePayload;
  } catch {
    return false;
  }
}

/** Keeps allowlisted, non-personal values only. */
export function sanitize(event: FunnelEvent, props: EventProps): TrackedEvent {
  const allowed = FUNNEL_EVENTS[event] as readonly string[];
  const clean: Record<string, Value> = {};
  for (const key of allowed) {
    const value = props[key];
    if (typeof value === "boolean") clean[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) clean[key] = value;
    else if (typeof value === "string" && SAFE_STRING.test(value)) clean[key] = value;
  }
  return { event, props: clean };
}

declare global {
  interface Window {
    /** Preview builds only: events kept in memory for review and tests. */
    __nihoEvents?: TrackedEvent[];
  }
}

type Sink = (e: TrackedEvent) => void;
let sink: Sink | null = null;

/** Called once by the analytics integration that #14 selects. */
export function setAnalyticsSink(next: Sink | null) {
  sink = next;
}

/** Fire-and-forget. Never throws and never blocks booking. */
export function track(event: FunnelEvent, props: EventProps = {}) {
  if (!sink) return;
  try {
    sink(sanitize(event, props));
  } catch {
    // Analytics must not affect the guest.
  }
}
