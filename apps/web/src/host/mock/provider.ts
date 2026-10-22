import type { HostBooking, HostExperience, HostMeetingDefaults, HostReview, HostSale, HostThread } from "../types";
import { MOCK_KITCHEN_BOOKINGS } from "./bookings";
import { MOCK_KITCHEN_EXPERIENCES, MOCK_STUDIO_EXPERIENCES } from "./experiences";
import { MOCK_KITCHEN_REVIEWS } from "./reviews";
import { MOCK_KITCHEN_SALES } from "./sales";
import { MOCK_KITCHEN_THREADS } from "./threads";

/*
 * The console's side of the two synthetic providers of the host contract's mock
 * (`@niho-experience/api-client/host/mock`, scenario `two-providers`; same ids): what the
 * contract has no API for yet. The providers' own values, their review and their payout
 * account come from the contract mock itself. Names, URLs and addresses are invented;
 * emails use example.com.
 */
export interface MockConsoleProvider {
  experiences: readonly HostExperience[];
  bookings: readonly HostBooking[];
  threads: readonly HostThread[];
  reviews: readonly HostReview[];
  sales: readonly HostSale[];
  meetingPoint: HostMeetingDefaults;
  notificationEmail: string;
}

export const MOCK_CONSOLE_PROVIDERS: ReadonlyMap<string, MockConsoleProvider> = new Map<string, MockConsoleProvider>([
  ["sample-provider-kitchen", {
    experiences: MOCK_KITCHEN_EXPERIENCES,
    bookings: MOCK_KITCHEN_BOOKINGS,
    threads: MOCK_KITCHEN_THREADS,
    reviews: MOCK_KITCHEN_REVIEWS,
    sales: MOCK_KITCHEN_SALES,
    meetingPoint: {
      area: "Near Kamakura Station, 5-minute walk",
      mapUrl: "https://maps.example.com/sample-kitchen",
      entrance: "Use the side entrance on the right of the building and take the stairs to the second floor. Look for the small sign by the door.",
    },
    notificationEmail: "kitchen@example.com",
  }],
  // A small second provider: one draft, nothing booked, asked, reviewed or sold yet.
  ["sample-provider-studio", {
    experiences: MOCK_STUDIO_EXPERIENCES,
    bookings: [],
    threads: [],
    reviews: [],
    sales: [],
    meetingPoint: { area: "", mapUrl: "", entrance: "" },
    notificationEmail: "studio@example.com",
  }],
]);
