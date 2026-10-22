type Env = Record<string, string | undefined>;

/**
 * Development-only key for the host console cookies in mock mode. Never accepted
 * in http mode: deployments pass HOST_SESSION_SECRET from Secret Manager.
 */
export const DEV_ONLY_HOST_SESSION_SECRET = "dev-only/niho-experience/host-session/not-a-secret-never-deploy";

const MIN_HOST_SESSION_SECRET_LENGTH = 32;

/** Pure so it can be unit-tested; see config.ts for the server instance. */
export function resolveConfig(env: Env) {
  const apiMode = env.EXPERIENCE_API_MODE === "http" ? "http" : "mock";
  // The host console (/host/home and below, #86) stays off unless explicitly enabled.
  const hostConsoleEnabled = env.HOST_CONSOLE_ENABLED === "true";
  const hostSessionSecret = env.HOST_SESSION_SECRET?.trim() || (apiMode === "mock" ? DEV_ONLY_HOST_SESSION_SECRET : "");
  const nihoFirebaseWebApiKey = env.NIHO_FIREBASE_WEB_API_KEY?.trim() ?? "";
  if (apiMode === "http" && hostConsoleEnabled) assertHostConsoleSecrets(hostSessionSecret, nihoFirebaseWebApiKey);

  return {
    apiMode,
    // v1.2 is opt-in after NIHO deploys the approved catalog and checkout contract.
    publicApiVersion: env.EXPERIENCE_PUBLIC_API_VERSION === "1.2" ? "1.2" : env.EXPERIENCE_PUBLIC_API_VERSION === "1.1" ? "1.1" : "1.0",
    // Japanese routes remain an explicit deployment gate. Visual presentation
    // source-display is intentionally not configurable: public layout is code-owned.
    presentationSourceDisplayEnabled: false,
    japaneseSiteEnabled: apiMode === "http" && env.EXPERIENCE_JAPANESE_SITE_ENABLED === "true",
    nihoWebOrigin: env.NEXT_PUBLIC_NIHO_WEB_ORIGIN ?? "https://niho.life",
    mockLatencyMs: Number(env.MOCK_LATENCY_MS ?? 0) || 0,
    // "pilot" shows the permitted first experiences with provisional details (docs/content/README.md).
    mockCatalog: env.MOCK_CATALOG === "pilot" ? "pilot" : "synthetic",
    siteUrl: (env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    // Synthetic data must never be indexed, even if SITE_INDEXING is set by mistake.
    indexingAllowed: env.SITE_INDEXING === "allow" && apiMode === "http",
    // Incident switch (#15): "false" stops new bookings on the site. NIHO's API remains the authority.
    bookingsEnabled: env.BOOKINGS_ENABLED !== "false",
    hostSignupMode: env.HOST_SIGNUP_MODE === "open" ? "open" : "pilot",
    nihoHostStartUrl: env.NIHO_HOST_START_URL ?? "",
    hostPilotContactUrl: env.HOST_PILOT_CONTACT_URL ?? "",
    nihoBookingHelpUrl: env.NIHO_BOOKING_HELP_URL ?? "",
    // Only the production runtime receives this public Umami website ID.
    umamiWebsiteId: env.UMAMI_WEBSITE_ID?.trim() ?? "",
    hostConsoleEnabled,
    // Comma-separated keys: the first seals new cookies, the rest still open old ones while keys rotate.
    hostSessionSecret,
    nihoFirebaseWebApiKey,
  } as const;
}

/** Refuses to start a real host console with a missing or guessable cookie key. */
function assertHostConsoleSecrets(secret: string, firebaseWebApiKey: string) {
  const keys = secret.split(",").map((key) => key.trim()).filter(Boolean);
  if (keys.length === 0 || keys.some((key) => key.length < MIN_HOST_SESSION_SECRET_LENGTH || key === DEV_ONLY_HOST_SESSION_SECRET)) {
    throw new Error(`HOST_CONSOLE_ENABLED=true needs HOST_SESSION_SECRET (each key at least ${MIN_HOST_SESSION_SECRET_LENGTH} characters) in http mode`);
  }
  if (!firebaseWebApiKey) throw new Error("HOST_CONSOLE_ENABLED=true needs NIHO_FIREBASE_WEB_API_KEY in http mode");
}
