const MOCK_CHECKOUT_PREFIX = "/preview/checkout?";
const STRIPE_CHECKOUT_HOST = "checkout.stripe.com";

/**
 * The site only ever sends guests to Stripe's hosted Checkout (or, in the
 * preview, its own mock payment page). Anything else from the API is refused.
 */
export function isAllowedCheckoutUrl(url: string, mode: "mock" | "http"): boolean {
  if (mode === "mock") return url.startsWith(MOCK_CHECKOUT_PREFIX) && !url.includes("//");
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === STRIPE_CHECKOUT_HOST && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

/** Reads `?slot=&guests=` from the booking URL. Returns null when malformed. */
export function parseSelection(params: Record<string, string | string[] | undefined>) {
  const slot = typeof params.slot === "string" ? params.slot : "";
  const guests = Number(typeof params.guests === "string" ? params.guests : NaN);
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(slot)) return null;
  if (!Number.isInteger(guests) || guests < 1 || guests > 50) return null;
  return { slotId: slot, guests };
}

export const bookingHref = (slug: string, slotId: string, guests: number) =>
  `/experiences/${slug}/book?${new URLSearchParams({ slot: slotId, guests: String(guests) })}`;
