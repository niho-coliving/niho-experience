import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
// A second server with the host console on (#86); the first keeps today's /host (console off).
const HOST_PORT = Number(process.env.E2E_HOST_PORT ?? 3101);
// The console's sign-in and frame (#86) and its screens (#84/#88) run against the second server.
const HOST_CONSOLE_SPEC = /host-(console|screens)\.spec\.ts/;
// Cloud sandboxes ship a pre-installed Chromium; CI installs the matching one.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const serverEnv = { HOSTNAME: "127.0.0.1", EXPERIENCE_API_MODE: "mock", EXPERIENCE_PUBLIC_API_VERSION: "1.2", SITE_INDEXING: "block", NEXT_TELEMETRY_DISABLED: "1", HOST_SIGNUP_MODE: "pilot", NIHO_HOST_START_URL: "https://niho.life/experiences/provider" };
const mobile = { ...devices["Pixel 5"], viewport: { width: 360, height: 780 }, launchOptions: { executablePath } };
const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 }, launchOptions: { executablePath } };
const hostBaseURL = `http://127.0.0.1:${HOST_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "mobile-360", testIgnore: HOST_CONSOLE_SPEC, use: mobile },
    { name: "desktop", testIgnore: HOST_CONSOLE_SPEC, use: desktop },
    { name: "host-mobile-360", testMatch: HOST_CONSOLE_SPEC, use: { ...mobile, baseURL: hostBaseURL } },
    { name: "host-desktop", testMatch: HOST_CONSOLE_SPEC, use: { ...desktop, baseURL: hostBaseURL } },
  ],
  webServer: [
    {
      command: "sh scripts/start-standalone.sh",
      url: `http://127.0.0.1:${PORT}/experiences`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { ...serverEnv, PORT: String(PORT) },
    },
    {
      command: "sh scripts/start-standalone.sh",
      url: `${hostBaseURL}/host`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      // SITE_URL is this server's origin: the console's same-origin check compares against it.
      env: { ...serverEnv, PORT: String(HOST_PORT), HOST_CONSOLE_ENABLED: "true", SITE_URL: hostBaseURL },
    },
  ],
});
