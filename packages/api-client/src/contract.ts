/**
 * PROVISIONAL public API contract for niho-experience.
 *
 * Status: v0 draft written by the site lane so screens can be built against
 * synthetic data. It is NOT agreed with the NIHO API. The contract lane
 * (issue #7) owns this file and will replace it with the selected export
 * from the NIHO side, which stays the source of truth.
 *
 * Rules that must survive the replacement:
 * - Only fields that are safe to publish appear here (no PII, drafts,
 *   private meeting points, internal storage keys).
 * - Prices, availability, seller and payment account are decided by the API.
 *   The browser may show an estimate but never a final amount of its own.
 * - Times are ISO 8601 with an explicit offset and are shown in JST.
 */
import { z } from "zod";

export const CONTRACT_VERSION = "0.1.0-draft";
export const CONTRACT_STATUS = "provisional" as const;
export const SITE_TIMEZONE = "Asia/Tokyo";

const isoDateTime = z.iso.datetime({ offset: true });
const isoDate = z.iso.date();

/** Public asset path (mock) or HTTPS URL (API). Never a storage object key. */
const assetUrl = z
  .string()
  .refine((v) => v.startsWith("/") || v.startsWith("https://"), "must be a site path or https URL");

export const MoneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.literal("JPY"),
});
export type Money = z.infer<typeof MoneySchema>;

export const PriceUnitSchema = z.enum(["per_person", "per_group"]);
export type PriceUnit = z.infer<typeof PriceUnitSchema>;

export const ImageSchema = z.object({
  url: assetUrl,
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** True for synthetic placeholder art. Real listings must be false and licensed. */
  placeholder: z.boolean(),
  credit: z.string().optional(),
});
export type Image = z.infer<typeof ImageSchema>;

export const ThemeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string(),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const AreaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
});

export const AvailabilityStatusSchema = z.enum([
  "bookable",
  "sold_out",
  "paused",
  "no_upcoming_dates",
]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;

export const HostSummarySchema = z.object({
  displayName: z.string(),
  role: z.string(),
  portrait: ImageSchema.nullable(),
});

export const SellerSchema = z.object({
  /** Seller of record shown before payment. Decided by the API, not the site. */
  displayName: z.string(),
  kind: z.enum(["niho_spot", "individual", "business"]),
  /** Page with the legally required seller disclosure, hosted by NIHO. */
  disclosureUrl: z.string().url().nullable(),
});
export type Seller = z.infer<typeof SellerSchema>;

export const ExperienceSummarySchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  summary: z.string(),
  area: AreaSchema,
  themes: z.array(ThemeSchema).min(1),
  durationMinutes: z.number().int().positive(),
  languages: z.array(z.string().min(2)).min(1),
  price: z.object({ from: MoneySchema, unit: PriceUnitSchema }),
  heroImage: ImageSchema,
  host: HostSummarySchema,
  availability: z.object({
    status: AvailabilityStatusSchema,
    nextStartsAt: isoDateTime.nullable(),
  }),
  /** True for fixtures. The site labels these as samples. */
  synthetic: z.boolean(),
});
export type ExperienceSummary = z.infer<typeof ExperienceSummarySchema>;

export const CancellationRuleSchema = z.object({
  /** Applies when cancelling at least this many hours before the start. */
  hoursBefore: z.number().int().nonnegative(),
  refundPercent: z.number().int().min(0).max(100),
});

export const CancellationPolicySchema = z.object({
  summary: z.string(),
  rules: z.array(CancellationRuleSchema),
  weather: z.string(),
  minimumGuests: z.object({ count: z.number().int().positive(), note: z.string() }).nullable(),
  /** Version the guest agrees to at checkout. */
  version: z.string(),
});
export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>;

export const ExperienceDetailSchema = ExperienceSummarySchema.extend({
  gallery: z.array(ImageSchema),
  /** Plain-text paragraphs. The site never renders HTML from the API. */
  description: z.array(z.string()),
  highlights: z.array(z.string()),
  itinerary: z.array(
    z.object({ title: z.string(), minutes: z.number().int().positive().nullable(), detail: z.string() }),
  ),
  included: z.array(z.string()),
  notIncluded: z.array(z.string()),
  goodToKnow: z.array(z.string()),
  accessibility: z.array(z.string()),
  groupSize: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
  /** Public, area-level meeting info. The exact point is sent after booking by NIHO. */
  meetingArea: z.object({ summary: z.string(), nearestStation: z.string().nullable() }),
  host: HostSummarySchema.extend({ story: z.array(z.string()) }),
  seller: SellerSchema,
  cancellation: CancellationPolicySchema,
});
export type ExperienceDetail = z.infer<typeof ExperienceDetailSchema>;

export const CatalogQuerySchema = z.object({
  area: z.string().optional(),
  theme: z.string().optional(),
  /** JST calendar date. Matches experiences with an open slot that day. */
  date: isoDate.optional(),
});
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;

export const CatalogSchema = z.object({
  items: z.array(ExperienceSummarySchema),
  /** Themes that have at least one listed experience (no empty categories). */
  themes: z.array(ThemeSchema),
  fetchedAt: isoDateTime,
});
export type Catalog = z.infer<typeof CatalogSchema>;

export const SlotSchema = z.object({
  id: z.string(),
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  status: z.enum(["open", "sold_out", "closed"]),
  price: z.object({ unitAmount: MoneySchema, unit: PriceUnitSchema }),
  /** Largest party the API will currently accept for this slot. Not shown as "seats left". */
  maxGuests: z.number().int().nonnegative(),
});
export type Slot = z.infer<typeof SlotSchema>;

export const SlotListSchema = z.object({
  experienceId: z.string(),
  timezone: z.literal(SITE_TIMEZONE),
  slots: z.array(SlotSchema),
  /** Availability can change after this moment; the quote is authoritative. */
  fetchedAt: isoDateTime,
});
export type SlotList = z.infer<typeof SlotListSchema>;

export const ApiErrorCodeSchema = z.enum([
  "EXPERIENCE_NOT_FOUND",
  "EXPERIENCE_PAUSED",
  "SLOT_NOT_FOUND",
  "SLOT_SOLD_OUT",
  "SLOT_CLOSED",
  "GUESTS_OUT_OF_RANGE",
  "PRICE_CHANGED",
  "TERMS_CHANGED",
  "QUOTE_EXPIRED",
  "INVALID_CONTACT",
  "RATE_LIMITED",
  "UNAVAILABLE",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  code: ApiErrorCodeSchema,
  retryable: z.boolean(),
  /** Field names for INVALID_CONTACT. Never echoes the submitted values. */
  fields: z.array(z.string()).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const QuoteRequestSchema = z.object({
  experienceId: z.string(),
  slotId: z.string(),
  guests: z.number().int().positive(),
});
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export const QuoteSchema = z.object({
  id: z.string(),
  experienceId: z.string(),
  slotId: z.string(),
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  guests: z.number().int().positive(),
  lines: z.array(
    z.object({ label: z.string(), unitAmount: MoneySchema, quantity: z.number().int().positive(), amount: MoneySchema }),
  ),
  total: MoneySchema,
  taxIncluded: z.boolean(),
  seller: SellerSchema,
  cancellation: CancellationPolicySchema,
  expiresAt: isoDateTime,
});
export type Quote = z.infer<typeof QuoteSchema>;

export const QuoteResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), quote: QuoteSchema }),
  z.object({ ok: z.literal(false), error: ApiErrorSchema }),
]);
export type QuoteResult = z.infer<typeof QuoteResultSchema>;

export const GuestContactSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  phone: z.string().trim().max(32).optional(),
  countryOfResidence: z.string().trim().max(56).optional(),
  note: z.string().trim().max(500).optional(),
});
export type GuestContact = z.infer<typeof GuestContactSchema>;

export const CheckoutRequestSchema = z.object({
  quoteId: z.string(),
  contact: GuestContactSchema,
  acceptedPolicyVersion: z.string(),
  /** Sent as the Idempotency-Key header. The API deduplicates, not the browser. */
  idempotencyKey: z.uuid(),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export const CheckoutResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    checkout: z.object({ redirectUrl: z.string(), expiresAt: isoDateTime }),
  }),
  z.object({ ok: z.literal(false), error: ApiErrorSchema }),
]);
export type CheckoutResult = z.infer<typeof CheckoutResultSchema>;
