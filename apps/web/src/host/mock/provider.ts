import type { HostBooking, HostExperience, HostMeetingDefaults, HostPayoutAccount, HostSale } from "../types";
import { MOCK_KITCHEN_BOOKINGS } from "./bookings";
import { MOCK_KITCHEN_EXPERIENCES, MOCK_STUDIO_EXPERIENCES } from "./experiences";
import { MOCK_KITCHEN_SALES } from "./sales";

/*
 * The console's side of the two synthetic providers of the host contract's mock
 * (`@niho-experience/api-client/host/mock`, scenario `two-providers`; same ids).
 * Names, URLs and addresses are invented; emails use example.com.
 */
export interface MockConsoleProvider {
  experiences: readonly HostExperience[];
  bookings: readonly HostBooking[];
  sales: readonly HostSale[];
  payout: HostPayoutAccount;
  meetingPoint: HostMeetingDefaults;
  notificationEmail: string;
}

export const MOCK_CONSOLE_PROVIDERS: ReadonlyMap<string, MockConsoleProvider> = new Map<string, MockConsoleProvider>([
  ["sample-provider-kitchen", {
    experiences: MOCK_KITCHEN_EXPERIENCES,
    bookings: MOCK_KITCHEN_BOOKINGS,
    sales: MOCK_KITCHEN_SALES,
    payout: { reason: "READY", label: "サンプルの台所の口座" },
    meetingPoint: {
      area: "Near Kamakura Station, 5-minute walk",
      mapUrl: "https://maps.example.com/sample-kitchen",
      entrance: "Use the side entrance on the right of the building and take the stairs to the second floor. Look for the small sign by the door.",
    },
    notificationEmail: "kitchen@example.com",
  }],
  // A small second provider: one draft, no bookings, no payout account yet.
  ["sample-provider-studio", {
    experiences: MOCK_STUDIO_EXPERIENCES,
    bookings: [],
    sales: [],
    payout: { reason: "NOT_CONNECTED", label: null },
    meetingPoint: { area: "", mapUrl: "", entrance: "" },
    notificationEmail: "studio@example.com",
  }],
]);

/** Synthetic consent summary for the mock registration. The real text and its version come from NIHO (#87/#88). */
export const MOCK_REGISTRATION_CONSENT =
  "体験ページの原稿と写真を体験サイトに掲載すること、旅行者への対応と返金、法令にもとづく販売者の表示について、NIHO Experience の提供者規約に同意します。";
