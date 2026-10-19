import "server-only";

/** Server-side settings. Everything has a safe default so a fresh clone runs with no .env. */
export const config = {
  apiMode: process.env.EXPERIENCE_API_MODE === "http" ? "http" : "mock",
  apiBaseUrl: process.env.EXPERIENCE_API_BASE_URL ?? "",
  mockLatencyMs: Number(process.env.MOCK_LATENCY_MS ?? 0) || 0,
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  indexingAllowed: process.env.SITE_INDEXING === "allow",
  hostSignupMode: process.env.HOST_SIGNUP_MODE === "open" ? "open" : "pilot",
  nihoHostStartUrl: process.env.NIHO_HOST_START_URL ?? "",
  hostPilotContactUrl: process.env.HOST_PILOT_CONTACT_URL ?? "",
  nihoBookingHelpUrl: process.env.NIHO_BOOKING_HELP_URL ?? "",
} as const;

export const isPreview = config.apiMode === "mock";
