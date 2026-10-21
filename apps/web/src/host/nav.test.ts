import { describe, expect, it } from "vitest";
import { HOST_NAV, withProvider, withQuery } from "@/lib/host/routes";
import { hostBackLink, isHostNavActive } from "./nav";

const selected = (location: string) => HOST_NAV.filter((item) => isHostNavActive(location, item.href)).map((item) => item.label);

describe("host navigation", () => {
  it("lists the five destinations in order", () => {
    expect(HOST_NAV.map((item) => item.label)).toEqual(["ホーム", "体験", "予約", "売上", "設定"]);
  });

  it("selects exactly one item on each top page", () => {
    expect(selected("/host/home")).toEqual(["ホーム"]);
    expect(selected("/host/home/")).toEqual(["ホーム"]);
    expect(selected("/host/experiences")).toEqual(["体験"]);
    expect(selected("/host/bookings")).toEqual(["予約"]);
    expect(selected("/host/sales")).toEqual(["売上"]);
    expect(selected("/host/settings/")).toEqual(["設定"]);
  });

  it("ignores ?providerId= and other queries on either side", () => {
    expect(selected("/host/bookings?providerId=sample-provider-studio")).toEqual(["予約"]);
    expect(selected("/host/home?providerId=sample-provider-kitchen#todo")).toEqual(["ホーム"]);
    expect(selected("/host/experiences/coffee?providerId=sample-provider-kitchen")).toEqual(["体験"]);
    expect(isHostNavActive("/host/settings", "/host/settings?providerId=sample-provider-studio")).toBe(true);
  });

  it("keeps the parent selected on sub pages and never matches by bare prefix", () => {
    expect(selected("/host/experiences/community-dinner")).toEqual(["体験"]);
    expect(selected("/host/experiences-archive")).toEqual([]);
    expect(selected("/host/homework")).toEqual([]);
    expect(selected("/host/register")).toEqual([]);
    expect(selected("/host")).toEqual([]);
    expect(selected("/experiences")).toEqual([]);
  });

  it("gives sub pages a back link and top pages none", () => {
    expect(hostBackLink("/host/experiences/community-dinner")).toEqual({ href: "/host/experiences", label: "体験" });
    expect(hostBackLink("/host/experiences/community-dinner/?providerId=sample-provider-kitchen")).toEqual({ href: "/host/experiences", label: "体験" });
    for (const path of ["/host", "/host/home", "/host/experiences", "/host/experiences?providerId=x", "/host/settings", "/host/register"]) expect(hostBackLink(path), path).toBeNull();
  });

  it("gives one booking (?booking=) the way back to 予約, from the location or from the page's query", () => {
    const bookings = { href: "/host/bookings", label: "予約" };
    expect(hostBackLink("/host/bookings?booking=bk-2041")).toEqual(bookings);
    expect(hostBackLink("/host/bookings", "providerId=sample-provider-kitchen&filter=pending&booking=bk-2041")).toEqual(bookings);
    expect(hostBackLink("/host/bookings/", new URLSearchParams({ booking: "bk-2041" }))).toEqual(bookings);
    // The query given wins over the one written in the location.
    expect(hostBackLink("/host/bookings?booking=bk-2041", "")).toBeNull();
    for (const [path, search] of [["/host/bookings", ""], ["/host/bookings", "filter=pending"], ["/host/bookings", "booking="], ["/host/home", "booking=bk-2041"], ["/host/sales", "booking=bk-2041"]] as const) {
      expect(hostBackLink(path, search), `${path}?${search}`).toBeNull();
    }
  });

  it("adds a page's own query and the provider to a link", () => {
    expect(withProvider("/host/home", "sample-provider-studio")).toBe("/host/home?providerId=sample-provider-studio");
    expect(withProvider("/host/home", null)).toBe("/host/home");
    expect(withProvider("/host/bookings?filter=pending", "sample-provider-studio")).toBe("/host/bookings?filter=pending&providerId=sample-provider-studio");
    expect(withQuery("/host/bookings", { filter: null, booking: "bk 1&2" })).toBe("/host/bookings?booking=bk+1%262");
    expect(withQuery("/host/bookings?booking=a", { booking: "b" })).toBe("/host/bookings?booking=b");
  });
});
