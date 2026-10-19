import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
// Cloud sandboxes ship a pre-installed Chromium; CI installs the matching one.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

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
    { name: "mobile-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 780 }, launchOptions: { executablePath } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 }, launchOptions: { executablePath } } },
  ],
  webServer: {
    command: `npx next start -p ${PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/experiences`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { EXPERIENCE_API_MODE: "mock", SITE_INDEXING: "block", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
