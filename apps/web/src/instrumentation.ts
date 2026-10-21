/**
 * Runs once when the server starts. A misconfigured deploy (for example
 * HOST_CONSOLE_ENABLED=true without its secrets in http mode) stops here
 * instead of answering requests.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkConfigAtStartup } = await import("./lib/startup-check");
  checkConfigAtStartup();
}
