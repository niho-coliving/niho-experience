import { describe, expect, it } from "vitest";
import { DEV_ONLY_HOST_SESSION_SECRET, resolveConfig } from "./resolve-config";

describe("public API version rollout gate", () => {
  it("keeps v1.0 when the runtime flag is absent", () => {
    expect(resolveConfig({}).publicApiVersion).toBe("1.0");
  });

  it("opts into v1.1 only when explicitly configured", () => {
    expect(resolveConfig({ EXPERIENCE_PUBLIC_API_VERSION: "1.1" }).publicApiVersion).toBe("1.1");
  });

  it("opts into v1.2 filters only when explicitly configured", () => {
    expect(resolveConfig({ EXPERIENCE_PUBLIC_API_VERSION: "1.2" }).publicApiVersion).toBe("1.2");
  });
});

describe("code-owned presentation and Japanese release gate", () => {
  it("ignores the retired visual source flag and gates only the approved Japanese release", () => {
    expect(resolveConfig({})).toMatchObject({ japaneseSiteEnabled: false });
    expect(resolveConfig({ EXPERIENCE_PRESENTATION_SOURCE_DISPLAY_ENABLED: "true", EXPERIENCE_JAPANESE_SITE_ENABLED: "true" })).toMatchObject({ japaneseSiteEnabled: false });
    const config = resolveConfig({ EXPERIENCE_API_MODE: "http", EXPERIENCE_PRESENTATION_SOURCE_DISPLAY_ENABLED: "true", EXPERIENCE_JAPANESE_SITE_ENABLED: "true" });
    expect(config).toMatchObject({ japaneseSiteEnabled: true });
    expect(config.presentationSourceDisplayEnabled).toBe(false);
  });
});

describe("host console settings", () => {
  const http = { EXPERIENCE_API_MODE: "http", HOST_CONSOLE_ENABLED: "true" };
  const secret = "s".repeat(32);

  it("stays off unless HOST_CONSOLE_ENABLED is exactly true", () => {
    expect(resolveConfig({}).hostConsoleEnabled).toBe(false);
    expect(resolveConfig({ HOST_CONSOLE_ENABLED: "1" }).hostConsoleEnabled).toBe(false);
    expect(resolveConfig({ HOST_CONSOLE_ENABLED: "true" }).hostConsoleEnabled).toBe(true);
  });

  it("allows the labelled development key in mock mode only", () => {
    expect(resolveConfig({ HOST_CONSOLE_ENABLED: "true" }).hostSessionSecret).toBe(DEV_ONLY_HOST_SESSION_SECRET);
    expect(resolveConfig({ EXPERIENCE_API_MODE: "http" }).hostSessionSecret).toBe("");
  });

  it("does not need secrets while the console is off in http mode", () => {
    expect(() => resolveConfig({ EXPERIENCE_API_MODE: "http" })).not.toThrow();
  });

  it("fails at start-up when an enabled http console lacks its secret or Firebase key", () => {
    expect(() => resolveConfig({ ...http, NIHO_FIREBASE_WEB_API_KEY: "key" })).toThrow(/HOST_SESSION_SECRET/);
    expect(() => resolveConfig({ ...http, HOST_SESSION_SECRET: "short", NIHO_FIREBASE_WEB_API_KEY: "key" })).toThrow(/HOST_SESSION_SECRET/);
    expect(() => resolveConfig({ ...http, HOST_SESSION_SECRET: DEV_ONLY_HOST_SESSION_SECRET, NIHO_FIREBASE_WEB_API_KEY: "key" })).toThrow(/HOST_SESSION_SECRET/);
    expect(() => resolveConfig({ ...http, HOST_SESSION_SECRET: `${secret},short`, NIHO_FIREBASE_WEB_API_KEY: "key" })).toThrow(/HOST_SESSION_SECRET/);
    expect(() => resolveConfig({ ...http, HOST_SESSION_SECRET: secret })).toThrow(/NIHO_FIREBASE_WEB_API_KEY/);
    const ok = resolveConfig({ ...http, HOST_SESSION_SECRET: ` ${secret} `, NIHO_FIREBASE_WEB_API_KEY: " key " });
    expect(ok).toMatchObject({ hostConsoleEnabled: true, hostSessionSecret: secret, nihoFirebaseWebApiKey: "key" });
  });
});

describe("admin support console settings", () => {
  it("stays off unless its dedicated flag is exactly true", () => {
    expect(resolveConfig({}).adminSupportConsoleEnabled).toBe(false);
    expect(resolveConfig({ ADMIN_SUPPORT_CONSOLE_ENABLED: "1" }).adminSupportConsoleEnabled).toBe(false);
    expect(resolveConfig({ ADMIN_SUPPORT_CONSOLE_ENABLED: "true" }).adminSupportConsoleEnabled).toBe(true);
  });
});
