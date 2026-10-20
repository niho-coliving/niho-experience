import { describe, expect, it } from "vitest";
import { createBookingAttributionStore } from "./booking-attribution";

describe("booking UTM attribution", () => {
  it("keeps only the four safe UTM fields in volatile first-touch state", () => {
    const store = createBookingAttributionStore();
    store.capture("?utm_source=partner_a01&utm_medium=referral&utm_campaign=pilot_2026q4&utm_content=table_card&email=guest%40example.com&token=secret", "0");
    store.capture("?utm_source=second_campaign", "0");

    expect(store.read("0")).toEqual({
      utmSource: "partner_a01",
      utmMedium: "referral",
      utmCampaign: "pilot_2026q4",
      utmContent: "table_card",
    });
  });

  it("does not capture or return attribution when Do Not Track is enabled", () => {
    const store = createBookingAttributionStore();
    store.capture("?utm_source=partner_a01", "1");
    expect(store.read("1")).toEqual({});

    store.capture("?utm_source=partner_a01", "0");
    expect(store.read("yes")).toEqual({});
    expect(store.read("0")).toEqual({});
  });

  it("drops malformed values and does not retain a full URL, referrer, or identifier", () => {
    const store = createBookingAttributionStore();
    store.capture("?utm_source=Guest%40Example.com&utm_campaign=valid_01&utm_id=visitor-1", "0");
    expect(store.read("0")).toEqual({ utmCampaign: "valid_01" });
  });
});
