import { todayInJapan } from "./format";
import { homeMonth, homeTodos, homeUpcoming, type HomeMonth, type HomeTodo, type HomeUpcoming } from "./home";
import { MOCK_NOW, MOCK_TODAY } from "./mock/bookings";
import { MOCK_CONSOLE_PROVIDERS } from "./mock/provider";
import { MOCK_SALES_PERIOD } from "./mock/sales";
import type { SalesPeriod } from "./sales";
import type { HostBooking, HostExperience, HostMeetingDefaults, HostSale } from "./types";

export type HostDataMode = "mock" | "http";

/** What the console shows for one provider beyond NIHO's provider record. */
export interface HostConsoleSnapshot {
  /** YYYY-MM-DD in Japan. */
  today: string;
  /** The months 売上 moves between (its current one is the home card's); null while sales cannot be read. */
  salesPeriod: SalesPeriod | null;
  experiences: readonly HostExperience[];
  bookings: readonly HostBooking[];
  sales: readonly HostSale[];
  meetingPoint: HostMeetingDefaults;
  notificationEmail: string;
}

const NO_MEETING_POINT: HostMeetingDefaults = { area: "", mapUrl: "", entrance: "" };

/**
 * The data behind the console pages for a provider. Mock mode (the preview) has the
 * synthetic sets in ./mock with a fixed "today" (a provider without a set has nothing in
 * the preview's sales months); http mode has nothing to show yet.
 */
export function hostConsoleSnapshot(providerId: string, mode: HostDataMode, now: number): HostConsoleSnapshot {
  const mock = mode === "mock" ? MOCK_CONSOLE_PROVIDERS.get(providerId) : undefined;
  if (mock) return { today: MOCK_TODAY, salesPeriod: MOCK_SALES_PERIOD, ...mock };
  // TODO: experiences, bookings, sales and the meeting and notification defaults are not in
  // the host contract (#87) yet. The payout account is: data.ts reads it from NIHO.
  return {
    today: mode === "mock" ? MOCK_TODAY : todayInJapan(now),
    salesPeriod: mode === "mock" ? MOCK_SALES_PERIOD : null,
    experiences: [],
    bookings: [],
    sales: [],
    meetingPoint: NO_MEETING_POINT,
    notificationEmail: "",
  };
}

/** What the experience editor (#89) opens for an id. */
export type HostEditorExperience =
  | { status: "ready"; experience: HostExperience }
  | { status: "missing" }
  /** http mode: pages cannot be read or saved until the provider API is connected (#87). The page says 準備中. */
  | { status: "unavailable" };

/** The page the editor opens: the synthetic one in mock mode; nothing to edit yet in http mode. */
export function editorExperience(snapshot: Pick<HostConsoleSnapshot, "experiences">, mode: HostDataMode, id: string): HostEditorExperience {
  // TODO(#87): read the page, with the x-niho-page-updated-at it was read at, from the provider API.
  if (mode === "http") return { status: "unavailable" };
  const experience = snapshot.experiences.find((candidate) => candidate.id === id);
  return experience ? { status: "ready", experience } : { status: "missing" };
}

/** 予約 (#90): the provider's bookings, or (http mode) nothing to show until the provider API has them. */
export type HostBookingList =
  | { status: "ready"; bookings: readonly HostBooking[] }
  /** http mode: bookings cannot be read or answered until the provider API is connected (#87). The page says 準備中. */
  | { status: "unavailable" };

/** The bookings screen's list: the synthetic one in mock mode; nothing to read yet in http mode. */
export function bookingList(snapshot: Pick<HostConsoleSnapshot, "bookings">, mode: HostDataMode): HostBookingList {
  // TODO(#87): read the provider's bookings from the provider API once the contract has them.
  return mode === "http" ? { status: "unavailable" } : { status: "ready", bookings: snapshot.bookings };
}

/**
 * When the bookings screen dates an action (YYYY-MM-DDTHH:MM, JST): the preview's fixed moment
 * in mock mode, so actions follow the synthetic timeline; null takes the clock.
 * TODO(#87): NIHO's own times, read back after each action.
 */
export function bookingClock(mode: HostDataMode): string | null {
  return mode === "mock" ? MOCK_NOW : null;
}

/** One booking the screen opens (`?booking=`). */
export type HostBookingLookup = { status: "ready"; booking: HostBooking } | { status: "missing" } | { status: "unavailable" };

/** The booking with this id among the provider's own; another provider's booking is missing here. */
export function bookingOf(snapshot: Pick<HostConsoleSnapshot, "bookings">, mode: HostDataMode, id: string): HostBookingLookup {
  const list = bookingList(snapshot, mode);
  if (list.status === "unavailable") return list;
  const booking = list.bookings.find((candidate) => candidate.id === id);
  return booking ? { status: "ready", booking } : { status: "missing" };
}

/** 売上 (#91): the provider's ledger and its months, or (http mode) nothing to show until the provider API has sales. */
export type HostSalesList =
  | { status: "ready"; period: SalesPeriod; sales: readonly HostSale[] }
  /** http mode: sales cannot be read until NIHO's API has them. The page says 準備中. */
  | { status: "unavailable" };

export function salesList(snapshot: Pick<HostConsoleSnapshot, "salesPeriod" | "sales">): HostSalesList {
  // TODO: read the provider's ledger from NIHO once the host contract has sales.
  return snapshot.salesPeriod ? { status: "ready", period: snapshot.salesPeriod, sales: snapshot.sales } : { status: "unavailable" };
}

export interface HostHomeData {
  todos: HomeTodo[];
  upcoming: HomeUpcoming[];
  month: HomeMonth | null;
}

/** ホーム: 次にすること, これからの開催 and the month's numbers. */
export function hostHome(snapshot: HostConsoleSnapshot): HostHomeData {
  return {
    todos: homeTodos(snapshot.experiences, snapshot.bookings, snapshot.today),
    upcoming: homeUpcoming(snapshot.experiences, snapshot.bookings, snapshot.today),
    month: snapshot.salesPeriod ? homeMonth(snapshot.sales, snapshot.salesPeriod.current) : null,
  };
}
