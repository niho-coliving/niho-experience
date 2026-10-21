import { HOST_BOOKINGS_PATH, HOST_EXPERIENCES_PATH } from "@/lib/host/routes";
import { dateWithWeekdayJa, dayOfMonth, durationJa, listJa, monthDayJa, weekdayJa, yen } from "./format";
import { BOOKING_STATUS, LISTING_STATUS, type StatusLabel } from "./status";
import type { HostBooking, HostExperience, HostSale } from "./types";

/** A row of 次にすること. `href` has no query: the page adds `?providerId=`. */
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

function respondByLabel(respondBy: string, today: string): string {
  const [date = "", time = ""] = respondBy.split("T");
  return date === today ? `今日 ${time}` : `${dateWithWeekdayJa(date)}${time}`;
}

/** 次にすること: requests waiting for an answer, then drafts to finish, then listings under review. */
export function homeTodos(experiences: readonly HostExperience[], bookings: readonly HostBooking[], today: string): HomeTodo[] {
  const titleOf = (id: string) => experiences.find((experience) => experience.id === id)?.title ?? "";
  const pending: HomeTodo[] = bookings
    .filter((booking) => booking.status === "pending" && booking.date >= today)
    .sort((a, b) => (a.respondBy ?? a.date).localeCompare(b.respondBy ?? b.date))
    .map((booking) => ({
      key: `booking-${booking.id}`,
      status: BOOKING_STATUS.pending,
      title: `${booking.guest} の申込を確認する`,
      detail: [
        `${dateWithWeekdayJa(booking.date)}${booking.start}`,
        titleOf(booking.experienceId),
        `${booking.guests}名`,
        yen(booking.amountYen),
        ...(booking.respondBy ? [`承認期限 ${respondByLabel(booking.respondBy, today)}`] : []),
      ].join(" · "),
      action: { label: "確認する", href: HOST_BOOKINGS_PATH, primary: true },
    }));
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

/** これからの開催 from today: one row per date, start time and experience, counting every booking that is not cancelled. */
export function homeUpcoming(experiences: readonly HostExperience[], bookings: readonly HostBooking[], today: string, limit = 3): HomeUpcoming[] {
  const groups = new Map<string, { date: string; start: string; experience: HostExperience | undefined; guests: number; count: number }>();
  for (const booking of bookings) {
    if (booking.status === "cancelled" || booking.date < today) continue;
    const key = `${booking.date}-${booking.start}-${booking.experienceId}`;
    const group = groups.get(key) ?? { date: booking.date, start: booking.start, experience: experiences.find((item) => item.id === booking.experienceId), guests: 0, count: 0 };
    group.guests += booking.guests;
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, limit)
    .map(([key, group]) => {
      const schedule = group.experience?.schedule;
      return {
        key,
        dateLabel: dateWithWeekdayJa(group.date),
        weekday: weekdayJa(group.date),
        day: dayOfMonth(group.date),
        title: group.experience?.title ?? "",
        detail: [`${group.start} 開始`, schedule ? durationJa(schedule.durationMinutes) : null].filter(Boolean).join(" · "),
        seats: schedule ? `${group.guests} / ${schedule.capacity}名` : `${group.guests}名`,
        bookings: `${group.count}件`,
      };
    });
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
