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
