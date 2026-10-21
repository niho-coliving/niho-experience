import { todayInJapan } from "./format";
import { homeMonth, homeTodos, homeUpcoming, type HomeMonth, type HomeTodo, type HomeUpcoming } from "./home";
import { MOCK_TODAY } from "./mock/bookings";
import { MOCK_CONSOLE_PROVIDERS } from "./mock/provider";
import { MOCK_SALES_MONTH } from "./mock/sales";
import type { HostBooking, HostExperience, HostMeetingDefaults, HostPayoutAccount, HostSale } from "./types";

export type HostDataMode = "mock" | "http";

/** What the console shows for one provider beyond NIHO's provider record. */
export interface HostConsoleSnapshot {
  /** YYYY-MM-DD in Japan. */
  today: string;
  /** The month the home card sums; null while sales cannot be read. */
  month: { year: number; month: number } | null;
  experiences: readonly HostExperience[];
  bookings: readonly HostBooking[];
  sales: readonly HostSale[];
  payout: HostPayoutAccount | null;
  meetingPoint: HostMeetingDefaults;
  notificationEmail: string;
}

const NO_MEETING_POINT: HostMeetingDefaults = { area: "", mapUrl: "", entrance: "" };

/**
 * The data behind the console pages for a provider. Mock mode (the preview) has the
 * synthetic sets in ./mock with a fixed "today"; http mode has nothing to show yet.
 */
export function hostConsoleSnapshot(providerId: string, mode: HostDataMode, now: number): HostConsoleSnapshot {
  const mock = mode === "mock" ? MOCK_CONSOLE_PROVIDERS.get(providerId) : undefined;
  if (mock) return { today: MOCK_TODAY, month: MOCK_SALES_MONTH, ...mock };
  // TODO(#87): read experiences, bookings, sales, the payout account and the meeting and
  // notification defaults from the provider API once the contract is agreed.
  return {
    today: mode === "mock" ? MOCK_TODAY : todayInJapan(now),
    month: null,
    experiences: [],
    bookings: [],
    sales: [],
    payout: null,
    meetingPoint: NO_MEETING_POINT,
    notificationEmail: "",
  };
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
    month: snapshot.month ? homeMonth(snapshot.sales, snapshot.month) : null,
  };
}
