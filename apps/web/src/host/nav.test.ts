import { describe, expect, it } from "vitest";
import { HOST_NAV } from "@/lib/host/routes";
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
});
