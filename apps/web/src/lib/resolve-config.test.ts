import { describe, expect, it } from "vitest";
import { resolveConfig } from "./resolve-config";

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
