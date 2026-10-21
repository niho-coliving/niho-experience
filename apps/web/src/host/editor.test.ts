import { describe, expect, it } from "vitest";
import {
  emptyOffer,
  experienceContent,
  listingRequirements,
  listingSummary,
  makeCover,
  moveItem,
  offerChildPriceLabel,
  offerDraft,
  offerFromDraft,
  offerPriceLabel,
  offerScheduleLabel,
  pauseListing,
  sameContent,
  submitListing,
  weekdayLabels,
  withdrawListing,
} from "./editor";
import { MOCK_KITCHEN_EXPERIENCES } from "./mock/experiences";
import type { HostExperience, HostExperiencePhoto, HostOffer, Weekday } from "./types";

const byId = (id: string): HostExperience => MOCK_KITCHEN_EXPERIENCES.find((experience) => experience.id === id)!;
const DINNER: HostOffer = byId("community-dinner").offers[0]!;
const COMPLETE: HostOffer = { ...emptyOffer("offer-x"), name: "Workshop", adultPriceYen: 8800, capacity: 4, startTime: "10:00", durationMinutes: 120, weekdays: [6] };
const PHOTO: HostExperiencePhoto = { id: "p1", url: "/sample/photos/coffee-pour.jpg", alt: "" };

describe("掲載までに必要", () => {
  it("asks a page with no photo and no offer for the cover and a price", () => {
    expect(listingRequirements(byId("coffee"))).toEqual(["表紙写真", "料金"]);
  });

  it("lists what each offer lacks, once, in the rail's order", () => {
    const offers = [emptyOffer("a"), { ...emptyOffer("b"), adultPriceYen: 5000 }];
    expect(listingRequirements({ title: "", photos: [], offers })).toEqual(["題名", "表紙写真", "料金", "定員", "開催曜日", "開始時刻", "所要時間"]);
    expect(listingRequirements({ title: "Roast", photos: [PHOTO], offers: [{ ...COMPLETE, weekdays: [], durationMinutes: null }] })).toEqual(["開催曜日", "所要時間"]);
  });

  it("is empty once the title, a cover and complete offers are there", () => {
    expect(listingRequirements({ title: "Roast", photos: [PHOTO], offers: [COMPLETE] })).toEqual([]);
    expect(listingRequirements(byId("community-dinner"))).toEqual([]);
    // A blank title counts as none; a price of zero is not a price.
    expect(listingRequirements({ title: "   ", photos: [PHOTO], offers: [{ ...COMPLETE, adultPriceYen: 0 }] })).toEqual(["題名", "料金"]);
  });
});

describe("掲載の状態", () => {
  const TODAY = "2026-10-21";

  it("掲載を申請: a draft or a paused listing goes to review, dated today", () => {
    expect(submitListing({ status: "draft" }, TODAY)).toEqual({ status: "review", requestedOn: TODAY });
    expect(submitListing({ status: "paused", liveSince: "2026-10-12" }, TODAY)).toEqual({ status: "review", liveSince: "2026-10-12", requestedOn: TODAY });
  });

  it("掲載を止める: only a live listing stops", () => {
    expect(pauseListing({ status: "live", liveSince: "2026-10-12" })).toEqual({ status: "paused", liveSince: "2026-10-12" });
    for (const status of ["draft", "review", "paused"] as const) expect(pauseListing({ status })).toEqual({ status });
  });

  it("申請を取り下げる: a listing under review goes back to draft", () => {
    expect(withdrawListing({ status: "review", requestedOn: "2026-10-19" })).toEqual({ status: "draft" });
    expect(withdrawListing({ status: "live", liveSince: "2026-10-12" })).toEqual({ status: "live", liveSince: "2026-10-12" });
  });

  it("leaves listings it does not apply to as they are", () => {
    const live = { status: "live" as const, liveSince: "2026-10-12" };
    expect(submitListing(live, TODAY)).toBe(live);
    const review = { status: "review" as const, requestedOn: "2026-10-19" };
    expect(submitListing(review, TODAY)).toBe(review);
  });
});

describe("申込の設定 rows", () => {
  it("reads an offer as its start, length and capacity, and its adult price", () => {
    expect(offerScheduleLabel(DINNER)).toBe("18:00 · 120分 · 定員8");
    expect(offerPriceLabel(DINNER)).toBe("¥30,000〜");
    expect(offerScheduleLabel(byId("community-dinner").offers[1]!)).toBe("13:00 · 120分 · 定員8");
    expect(offerPriceLabel(byId("community-dinner").offers[1]!)).toBe("¥15,000〜");
  });

  it("adds the child price under the adult one when there is one", () => {
    expect(offerChildPriceLabel(DINNER)).toBe("子ども ¥12,000");
    expect(offerChildPriceLabel({ ...DINNER, childPriceYen: 0 })).toBe("子ども ¥0");
    expect(offerChildPriceLabel({ ...DINNER, childPriceYen: null })).toBeNull();
  });

  it("leaves out what is not set yet", () => {
    expect(offerScheduleLabel({ ...emptyOffer("n"), durationMinutes: 90 })).toBe("90分");
    expect(offerScheduleLabel(emptyOffer("n"))).toBe("日程が未入力");
    expect(offerPriceLabel(emptyOffer("n"))).toBe("料金が未入力");
  });

  it("lists the days from Monday", () => {
    expect(weekdayLabels([2, 4, 6])).toEqual(["火", "木", "土"]);
    expect(weekdayLabels([0, 6])).toEqual(["土", "日"]);
  });

  it("moves an offer up or down, and not past either end", () => {
    expect(moveItem(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });

  it("takes the dialog's typed values back as an offer", () => {
    expect(offerFromDraft(DINNER.id, offerDraft(DINNER))).toEqual(DINNER);
    const draft = { ...offerDraft(emptyOffer("new")), name: "  Roasting  ", adultPrice: "9800", childPrice: "", capacity: "6", duration: "90", startTime: "14:00", weekdays: [0, 6, 0] as Weekday[], closedDates: ["2026-12-31", "2026-11-03"], questions: [" How strong do you like it? ", ""] };
    expect(offerFromDraft("new", draft)).toEqual({ id: "new", name: "Roasting", adultPriceYen: 9800, childPriceYen: null, capacity: 6, startTime: "14:00", durationMinutes: 90, weekdays: [0, 6], closedDates: ["2026-11-03", "2026-12-31"], questions: ["How strong do you like it?"] });
  });
});

describe("写真", () => {
  const photos = ["a", "b", "c", "d"];

  it("表紙にする moves the photo to the front and keeps the others in order", () => {
    expect(makeCover(photos, 2)).toEqual(["c", "a", "b", "d"]);
    expect(makeCover(photos, 3)).toEqual(["d", "a", "b", "c"]);
  });

  it("leaves the order alone for the cover itself or a photo that is not there", () => {
    expect(makeCover(photos, 0)).toEqual(photos);
    expect(makeCover(photos, 7)).toEqual(photos);
    expect(makeCover(photos, 0)).not.toBe(photos);
  });
});

describe("the list row's summary", () => {
  it("takes the cover and the first offer's schedule from the page", () => {
    expect(listingSummary(byId("community-dinner"))).toEqual({
      cover: "/sample/photos/niho-cd-table-01.jpg",
      schedule: { weekdays: ["火", "木", "土"], start: "18:00", durationMinutes: 120, capacity: 8, priceFromYen: 30000 },
      missing: [],
    });
    expect(listingSummary(byId("kintsugi"))).toEqual({ cover: null, schedule: { weekdays: ["土", "日"], start: "10:00", durationMinutes: 120, capacity: 4, priceFromYen: 8800 }, missing: [] });
  });

  it("says what a draft still needs, and has no schedule until its first offer is complete", () => {
    expect(listingSummary(byId("coffee"))).toEqual({ cover: null, schedule: null, missing: ["表紙写真", "料金"] });
    expect(listingSummary({ status: "draft", title: "Roast", photos: [PHOTO], offers: [{ ...COMPLETE, startTime: "" }] })).toEqual({ cover: PHOTO.url, schedule: null, missing: ["開始時刻"] });
  });
});

describe("保存 shows only when something changed", () => {
  it("compares the content, not the order its fields were written in", () => {
    const page = experienceContent(byId("community-dinner"));
    const rebuilt = { ...page, offers: page.offers.map((offer) => offerFromDraft(offer.id, offerDraft(offer))) };
    expect(sameContent(page, rebuilt)).toBe(true);
    expect(sameContent(page, { ...page, highlights: [...page.highlights, ""] })).toBe(false);
    expect(sameContent(page, { ...page, meeting: { ...page.meeting, exteriorPhotoUrl: null } })).toBe(false);
    expect(sameContent(page, { ...page, photos: makeCover(page.photos, 1) })).toBe(false);
  });

  it("keeps only what 保存 sends: no id, slug or listing state", () => {
    expect(Object.keys(experienceContent(byId("kintsugi"))).sort()).toEqual(
      ["dayLanguage", "description", "highlights", "included", "knowBeforeYouGo", "language", "lead", "meeting", "notIncluded", "notSuitableFor", "offers", "photos", "timeline", "title"].sort(),
    );
  });
});
