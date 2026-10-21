import { describe, expect, it } from "vitest";
import { nihoIdOrNull, parseProviderDetail, parseProviderList, providerRoleLabel, selectProvider } from "./providers";

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

describe("provider detail (settings)", () => {
  it("reads NIHO's { provider } response with kind, bio, seller page and review status", () => {
    expect(
      parseProviderDetail({
        provider: { id: "p_1", displayName: "合成の台所", memberRole: "OWNER", kind: "BUSINESS", bio: "  合成の紹介です。 ", sellerDisclosureUrl: "https://seller.example.com/tokushoho", reviewStatus: "REQUESTED" },
        platformAdmin: false,
      }),
    ).toEqual({ id: "p_1", displayName: "合成の台所", role: "OWNER", kind: "BUSINESS", bio: "合成の紹介です。", sellerDisclosureUrl: "https://seller.example.com/tokushoho", reviewStatus: "REQUESTED" });
  });

  it("leaves out unknown values and keeps only https seller pages", () => {
    expect(parseProviderDetail({ provider: { id: "p_1", displayName: "A", kind: "SPOT", reviewStatus: "LIVE", sellerDisclosureUrl: "http://seller.example.com", bio: 3 } })).toEqual({
      id: "p_1",
      displayName: "A",
      role: null,
      sellerDisclosureUrl: null,
    });
    expect(parseProviderDetail({ provider: { id: "p_1", displayName: "A", sellerDisclosureUrl: null } })).toEqual({ id: "p_1", displayName: "A", role: null, sellerDisclosureUrl: null });
    expect(parseProviderDetail({ provider: { id: "p_1", displayName: "A" } })).toEqual({ id: "p_1", displayName: "A", role: null });
  });

  it("refuses bodies that are not one provider", () => {
    for (const body of [null, {}, { provider: null }, { provider: { id: "../x", displayName: "A" } }, { providers: [{ id: "p_1", displayName: "A" }] }]) expect(parseProviderDetail(body)).toBeNull();
  });
});
