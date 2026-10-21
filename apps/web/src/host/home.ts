import { HOST_EXPERIENCES_PATH } from "@/lib/host/routes";
import { bookingSessions, bookingsHref, respondByLabel, seatsLabel, type BookingExperience } from "./bookings";
import { dateWithWeekdayJa, dayOfMonth, durationJa, listJa, monthDayJa, weekdayJa, yen } from "./format";
import { BOOKING_STATUS, LISTING_STATUS, type StatusLabel } from "./status";
import type { HostBooking, HostExperience, HostSale } from "./types";

/** A row of 次にすること. `href` may carry the bookings screen's own query; the page adds `?providerId=`. */
export interface HomeTodo {
  key: string;
  status: StatusLabel;
  title: string;
  detail: string;
  action: { label: string; href: string; primary: boolean } | null;
}

/** A row of これからの開催: one date, start time and experience. */
export interface HomeUpcoming {
  key: string;
  /** "10月22日（木）" for screen readers; the row shows weekday and day. */
  dateLabel: string;
  weekday: string;
  day: number;
  title: string;
  detail: string;
  /** "4 / 8名" */
  seats: string;
  /** "2件" */
  bookings: string;
}

export interface HomeMonth {
  label: string;
  sales: string;
  refunds: string;
  confirmed: string;
}

export function experiencePath(id: string): string {
  return `${HOST_EXPERIENCES_PATH}/${encodeURIComponent(id)}`;
}

/**
 * The requests waiting for an answer, as one row: the request itself when there is one (it
 * opens that booking), "承認待ちの申込が 2 件" when there are more (it opens 承認待ち).
 */
function pendingTodos(experiences: readonly HostExperience[], bookings: readonly HostBooking[], today: string): HomeTodo[] {
  const requests = bookings
    .filter((booking) => booking.status === "pending" && booking.date >= today)
    .sort((a, b) => (a.respondBy ?? a.date).localeCompare(b.respondBy ?? b.date));
  const [first] = requests;
  if (!first) return [];
  if (requests.length > 1) {
    return [
      {
        key: "bookings-pending",
        status: BOOKING_STATUS.pending,
        title: `承認待ちの申込が ${requests.length} 件`,
        detail: first.respondBy ? `最も早い承認期限 ${respondByLabel(first.respondBy, today)}` : requests.map((booking) => booking.guest).join("、"),
        action: { label: "確認する", href: bookingsHref({ filter: "pending" }), primary: true },
      },
    ];
  }
  return [
    {
      key: `booking-${first.id}`,
      status: BOOKING_STATUS.pending,
      title: `${first.guest} の申込を確認する`,
      detail: [
        `${dateWithWeekdayJa(first.date)}${first.start}`,
        experiences.find((experience) => experience.id === first.experienceId)?.title ?? "",
        `${first.guests}名`,
        yen(first.amountYen),
        ...(first.respondBy ? [`承認期限 ${respondByLabel(first.respondBy, today)}`] : []),
      ].join(" · "),
      action: { label: "確認する", href: bookingsHref({ booking: first.id }), primary: true },
    },
  ];
}

/** 次にすること: requests waiting for an answer, then drafts to finish, then listings under review. */
export function homeTodos(experiences: readonly HostExperience[], bookings: readonly HostBooking[], today: string): HomeTodo[] {
  const pending = pendingTodos(experiences, bookings, today);
  const drafts: HomeTodo[] = experiences
    .filter((experience) => experience.status === "draft")
    .map((experience) => ({
      key: `draft-${experience.id}`,
      status: LISTING_STATUS.draft,
      title: `${experience.title} の原稿を仕上げる`,
      detail: experience.missing.length ? `${listJa(experience.missing)}が未入力` : "掲載を申請できます",
      action: { label: "編集する", href: experiencePath(experience.id), primary: false },
    }));
  const reviews: HomeTodo[] = experiences
    .filter((experience) => experience.status === "review")
    .map((experience) => ({
      key: `review-${experience.id}`,
      status: LISTING_STATUS.review,
      title: experience.title,
      detail: [experience.requestedOn ? `${monthDayJa(experience.requestedOn)}に申請` : null, "NIHO が確認中"].filter(Boolean).join(" · "),
      action: null,
    }));
  return [...pending, ...drafts, ...reviews];
}

/**
 * これからの開催 from today: one row per session (an offer on a day at a time) with guests,
 * counting the 承認待ち and 確定 bookings as the bookings list does.
 */
export function homeUpcoming(experiences: readonly BookingExperience[], bookings: readonly HostBooking[], today: string, limit = 3): HomeUpcoming[] {
  return bookingSessions(bookings, experiences)
    .filter((session) => session.date >= today && session.count > 0)
    .slice(0, limit)
    .map((session) => ({
      key: session.key,
      dateLabel: dateWithWeekdayJa(session.date),
      weekday: weekdayJa(session.date),
      day: dayOfMonth(session.date),
      title: session.title,
      detail: [`${session.start} 開始`, session.durationMinutes ? durationJa(session.durationMinutes) : null].filter(Boolean).join(" · "),
      seats: seatsLabel(session),
      bookings: `${session.count}件`,
    }));
}

/** The month card: sales and refunds from the ledger lines (payouts are not sales), and how many bookings were charged. */
export function homeMonth(sales: readonly HostSale[], month: { year: number; month: number }): HomeMonth {
  const prefix = `${month.year}-${String(month.month).padStart(2, "0")}-`;
  const inMonth = sales.filter((line) => line.date.startsWith(prefix));
  const charged = inMonth.filter((line) => line.kind === "sale");
  const refunds = inMonth.filter((line) => line.kind === "refund");
  return {
    label: `${month.month}月`,
    sales: yen(charged.reduce((sum, line) => sum + line.amountYen, 0)),
    refunds: yen(refunds.reduce((sum, line) => sum + line.amountYen, 0)),
    confirmed: `${charged.length}件`,
  };
}
