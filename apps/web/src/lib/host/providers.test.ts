import { describe, expect, it } from "vitest";
import { nihoIdOrNull, parseProviderList, providerRoleLabel, selectProvider } from "./providers";

describe("provider list", () => {
  it("reads NIHO's { providers } response and keeps id, name and role", () => {
    expect(parseProviderList({ providers: [{ id: "p_1", displayName: " 合成の台所 ", memberRole: "OWNER", kind: "INDIVIDUAL" }, { id: "p_2", displayName: "合成工房", memberRole: null }], platformAdmin: false })).toEqual([
      { id: "p_1", displayName: "合成の台所", role: "OWNER" },
      { id: "p_2", displayName: "合成工房", role: null },
    ]);
    expect(parseProviderList([{ id: "p_1", displayName: "A", memberRole: "EDITOR" }])).toEqual([{ id: "p_1", displayName: "A", role: "EDITOR" }]);
  });

  it("leaves out entries without a valid id or name, and refuses non-lists", () => {
    expect(parseProviderList({ providers: [{ id: "../x", displayName: "A" }, { id: "p_2", displayName: "" }, null, { id: "p_3", displayName: "B", memberRole: "ADMIN" }] })).toEqual([{ id: "p_3", displayName: "B", role: null }]);
    expect(parseProviderList({ error: "x" })).toBeNull();
    expect(parseProviderList(null)).toBeNull();
  });

  it("opens the requested provider when the account has it, else the first", () => {
    const providers = [{ id: "a", displayName: "A", role: null }, { id: "b", displayName: "B", role: null }];
    expect(selectProvider(providers, "b")).toEqual({ provider: providers[1], requestedMissing: false });
    expect(selectProvider(providers, "z")).toEqual({ provider: providers[0], requestedMissing: true });
    expect(selectProvider(providers, null)).toEqual({ provider: providers[0], requestedMissing: false });
    expect(selectProvider([], null)).toEqual({ provider: null, requestedMissing: false });
  });

  it("accepts only url-safe ids for ?providerId=", () => {
    expect(nihoIdOrNull("cm1abc_DEF-2")).toBe("cm1abc_DEF-2");
    for (const bad of ["", "a/b", "a b", "<x>", "x".repeat(65), ["a"], 1, null]) expect(nihoIdOrNull(bad)).toBeNull();
  });

  it("labels roles in Japanese", () => {
    expect(providerRoleLabel("OWNER")).toBe("オーナー");
    expect(providerRoleLabel("EDITOR")).toBe("編集者");
    expect(providerRoleLabel(null)).toBeNull();
  });
});
