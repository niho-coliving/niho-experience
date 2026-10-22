import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  config: {
    apiMode: "mock",
    adminSupportConsoleEnabled: true,
    hostSessionSecret: "a".repeat(40),
    adminSessionSecret: "b".repeat(40),
    adminOrigin: "",
    nihoWebOrigin: "https://niho.example",
    nihoFirebaseWebApiKey: "",
    siteUrl: "http://localhost:3000",
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/config", () => ({ config: state.config }));

import { isAdminHttp, isAdminPreview } from "./server";

describe("Admin mode boundary", () => {
  it("keeps the synthetic preview and real HTTP auth mutually exclusive and explicitly gated", () => {
    expect(isAdminPreview()).toBe(true);
    expect(isAdminHttp()).toBe(false);
    state.config.apiMode = "http";
    expect(isAdminPreview()).toBe(false);
    expect(isAdminHttp()).toBe(true);
    state.config.adminSupportConsoleEnabled = false;
    expect(isAdminPreview()).toBe(false);
    expect(isAdminHttp()).toBe(false);
  });

});
