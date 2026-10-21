import { resolveConfig } from "./resolve-config";

/** Exits the Node server when the runtime settings are unusable, so the revision never becomes ready. */
export function checkConfigAtStartup(env: Record<string, string | undefined> = process.env) {
  try {
    resolveConfig(env);
  } catch (error) {
    console.error(`[config] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
