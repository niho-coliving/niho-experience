import { describe, expect, it } from "vitest";
import { createMockHostFetch, MOCK_ID_TOKEN_PREFIX } from "@/lib/host/mock-niho";
import { bookingClock, bookingList, bookingOf, editorExperience, hostConsoleSnapshot, hostHome } from "./console-data";
import { MOCK_CONSOLE_PROVIDERS } from "./mock/provider";

const NOW = Date.UTC(2026, 11, 1, 3, 0);

describe("console data per provider", () => {
  it("gives the sample kitchen its listings, bookings, sales and payout account", () => {
    const snapshot = hostConsoleSnapshot("sample-provider-kitchen", "mock", NOW);
    expect(snapshot.experiences.map((experience) => [experience.id, experience.status])).toEqual([
      ["community-dinner", "live"],
      ["kintsugi", "review"],
      ["coffee", "draft"],
    ]);
    expect(snapshot.payout).toEqual({ reason: "READY", label: "サンプルの台所の口座" });
    expect(snapshot.notificationEmail).toBe("kitchen@example.com");
    const home = hostHome(snapshot);
    expect(home.todos.map((todo) => todo.status.label)).toEqual(["承認待ち", "下書き", "審査待ち"]);
    expect(home.upcoming).toHaveLength(3);
    // The preview keeps its own "today": the synthetic dates stay upcoming whenever it is opened.
    expect(home.month).toEqual({ label: "10月", sales: "¥270,000", refunds: "−¥60,000", confirmed: "6件" });
  });

  it("gives the sample studio one draft and nothing booked", () => {
    const snapshot = hostConsoleSnapshot("sample-provider-studio", "mock", NOW);
    expect(snapshot.experiences.map((experience) => [experience.title, experience.status])).toEqual([["Write Your Own Kanji with a Kamakura Calligrapher", "draft"]]);
    expect(snapshot.bookings).toEqual([]);
    expect(snapshot.payout).toEqual({ reason: "NOT_CONNECTED", label: null });
    const home = hostHome(snapshot);
    expect(home.todos.map((todo) => [todo.title, todo.detail, todo.action?.href])).toEqual([
      // Derived from the page (no photo, no offer yet), as the editor's 掲載までに必要 shows it.
      ["Write Your Own Kanji with a Kamakura Calligrapher の原稿を仕上げる", "表紙写真と料金が未入力", "/host/experiences/calligraphy"],
    ]);
    expect(home.upcoming).toEqual([]);
    expect(home.month).toEqual({ label: "10月", sales: "¥0", refunds: "¥0", confirmed: "0件" });
  });

  it("covers every provider the synthetic NIHO returns", async () => {
    const response = await createMockHostFetch("default")("https://niho.example.test/api/experience-providers", { headers: { authorization: `Bearer ${MOCK_ID_TOKEN_PREFIX}test` } });
    const { providers } = (await response.json()) as { providers: { id: string }[] };
    expect(providers.map((provider) => provider.id).sort()).toEqual([...MOCK_CONSOLE_PROVIDERS.keys()].sort());
  });

  it("shows nothing invented for providers outside the preview set", () => {
    for (const id of ["someone-else", "constructor", "__proto__"]) {
      const snapshot = hostConsoleSnapshot(id, "mock", NOW);
      expect(snapshot, id).toMatchObject({ experiences: [], bookings: [], sales: [], payout: null, month: null });
    }
  });

  it("opens the provider's own experience in the editor, and nothing in http mode yet (#87)", () => {
    const kitchen = hostConsoleSnapshot("sample-provider-kitchen", "mock", NOW);
    const opened = editorExperience(kitchen, "mock", "community-dinner");
    expect(opened.status === "ready" && [opened.experience.title, opened.experience.photos.length, opened.experience.offers.map((offer) => offer.name)]).toEqual(["Kamakura Community Dinner with Locals", 8, ["Dinner", "tea time"]]);
    // Another provider's experience is not this provider's to edit.
    expect(editorExperience(hostConsoleSnapshot("sample-provider-studio", "mock", NOW), "mock", "community-dinner")).toEqual({ status: "missing" });
    expect(editorExperience(kitchen, "mock", "no-such-experience")).toEqual({ status: "missing" });
    expect(editorExperience(kitchen, "http", "community-dinner")).toEqual({ status: "unavailable" });
  });

  it("lists the provider's own bookings and opens one of them, and has none to read in http mode yet (#87)", () => {
    const kitchen = hostConsoleSnapshot("sample-provider-kitchen", "mock", NOW);
    const list = bookingList(kitchen, "mock");
    expect(list.status === "ready" && list.bookings.map((booking) => booking.status)).toEqual(["pending", "confirmed", "confirmed", "confirmed", "confirmed", "cancelled", "refund_needed", "pending", "declined", "expired"]);
    expect(bookingOf(kitchen, "mock", "bk-2041")).toMatchObject({ status: "ready", booking: { guest: "Lucas & Mia Chen" } });
    expect(bookingOf(kitchen, "mock", "no-such-booking")).toEqual({ status: "missing" });
    // Another provider's booking is not this provider's to open.
    expect(bookingOf(hostConsoleSnapshot("sample-provider-studio", "mock", NOW), "mock", "bk-2041")).toEqual({ status: "missing" });
    // The preview dates actions with its own fixed moment, after the synthetic timeline.
    expect(bookingClock("mock")).toBe("2026-10-21T15:30");
    expect(bookingClock("http")).toBeNull();
    expect(bookingList(kitchen, "http")).toEqual({ status: "unavailable" });
    expect(bookingOf(kitchen, "http", "bk-2041")).toEqual({ status: "unavailable" });
  });

  it("is empty in http mode until the provider API is connected (#87)", () => {
    const snapshot = hostConsoleSnapshot("sample-provider-kitchen", "http", NOW);
    expect(snapshot).toEqual({ today: "2026-12-01", month: null, experiences: [], bookings: [], sales: [], payout: null, meetingPoint: { area: "", mapUrl: "", entrance: "" }, notificationEmail: "" });
    expect(hostHome(snapshot)).toEqual({ todos: [], upcoming: [], month: null });
  });
});
