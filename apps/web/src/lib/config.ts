import "server-only";
import { resolveConfig } from "./resolve-config";

/** Server-side settings, read when the server starts. Safe defaults let a fresh clone run with no .env. */
export const config = resolveConfig(process.env);

export const isPreview = config.apiMode === "mock";

/** Label on preview listings: synthetic data is invented, pilot data is real but provisional. */
export const previewListingLabel = config.mockCatalog === "pilot" ? "Details to be confirmed" : "Sample listing";
