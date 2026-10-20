import "server-only";
import { resolveConfig } from "./resolve-config";

/** Server-side settings, read when the server starts. Safe defaults let a fresh clone run with no .env. */
export const config = resolveConfig(process.env);

export const isPreview = config.apiMode === "mock";

/** Pilot fixtures and their static editorial/sample assets are only for the mock preview. */
export const isPilotPreview = isPreview && config.mockCatalog === "pilot";
