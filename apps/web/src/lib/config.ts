import "server-only";
import { resolveConfig } from "./resolve-config";

/** Server-side settings, read when the server starts. Safe defaults let a fresh clone run with no .env. */
export const config = resolveConfig(process.env);

export const isPreview = config.apiMode === "mock";
