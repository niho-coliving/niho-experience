import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
export default defineConfig({
  testDir: "./e2e", testMatch: "page-documents.spec.ts", workers: 1, fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3250", launchOptions: { executablePath }, trace: "retain-on-failure" },
  projects: [
    { name: "published-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "published-mobile", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 780 } } }
  ],
  webServer: [
    { command: "node e2e/support/document-api.mjs", url: "http://127.0.0.1:3251/__test/reset", timeout: 15_000 },
    { command: "sh scripts/start-standalone.sh", url: "http://127.0.0.1:3250", timeout: 60_000, env: {
      PORT: "3250", HOSTNAME: "127.0.0.1", EXPERIENCE_API_MODE: "http", EXPERIENCE_PUBLIC_API_VERSION: "1.2",
      NEXT_PUBLIC_NIHO_WEB_ORIGIN: "http://127.0.0.1:3251", HOST_PILOT_CONTACT_URL: "https://niho.example/contact", SITE_INDEXING: "block", NEXT_TELEMETRY_DISABLED: "1"
    } }
  ]
});
