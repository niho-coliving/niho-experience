"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Occurrence } from "@niho-experience/api-client";
import { readAvailability } from "@/lib/browser-availability";
import { browseHref, type BrowseContext } from "@/lib/browse-context";
import { dayOption, nextBookable } from "@/lib/date-filter";
import { formatTime, formatYen } from "@/lib/format";
import { type HandIconName } from "./HandIcon";
import { buttonClass } from "./ui";
import { DetailBookingCardV1, DetailBookingDatesV1, EN_STATIC_COPY_V1 } from "@niho/experience-presentation/v1";
import { bookingCardModel, presentationBookingHref as bookHref } from "@/lib/presentation-booking-model";
import { PRESENTATION_PRIMITIVES_V1 } from "./PresentationV1";

export type BookingSummary = {
  slug: string;
  offers: { id: string; name: string; adultPriceYen: number }[];
  /** "¥30,000". */
  price: string;
  priceIsFrom: boolean;
  /** "Children 6–17 ¥12,000", when children can join. */
  childNote: string | null;
  /** "Tue · Thu · Sat · 6:00 PM". */
  schedule: string | null;
  canBook: boolean;
  assurances: { icon: HandIconName; text: string }[];
  preview: boolean;
  availabilityIsProvisional: boolean;
  nihoWebOrigin: string;
  browseContext?: Partial<BrowseContext>;
  preferredOfferId?: string;
};

const NEXT_DATES = 3;

/** Next bookable sessions read in the browser (never cached, never shown as seat counts). */
function useNextDates(summary: BookingSummary): Occurrence[] | null | "failed" {
  const [dates, setDates] = useState<Occurrence[] | null | "failed">(null);
  const { slug, preview, nihoWebOrigin, canBook } = summary;
  useEffect(() => {
    if (!canBook) return;
    let active = true;
    readAvailability(slug, preview, nihoWebOrigin).then((read) => {
      if (active) setDates(read.ok ? nextBookable(read.occurrences, NEXT_DATES) : "failed");
    });
    return () => {
      active = false;
    };
  }, [slug, preview, nihoWebOrigin, canBook]);
  return dates;
}

/** The booking page pre-selects this date and option; the guest still confirms everything there. */
const bookDateHref = (summary: BookingSummary, occurrence: Occurrence) =>
  browseHref(`/experiences/${summary.slug}/book`, { ...summary.browseContext, date: occurrence.date }, occurrence.offerId);
const offerFor = (summary: BookingSummary, occurrence: Occurrence) => summary.offers.find((offer) => offer.id === occurrence.offerId);
const sessionLabel = (summary: BookingSummary, occurrence: Occurrence) => {
  const offer = offerFor(summary, occurrence);
  return `${dayOption(occurrence.date).label} · ${formatTime(occurrence.startAt)} · ${offer?.name ?? EN_STATIC_COPY_V1.text("booking.optionFallback")}`;
};
/** The bottom bar names the option only when there is more than one. */
const nextLabel = (summary: BookingSummary, occurrence: Occurrence) =>
  summary.offers.length > 1 ? sessionLabel(summary, occurrence) : `${dayOption(occurrence.date).label} · ${formatTime(occurrence.startAt)}`;

function Price({ summary, size = "lg" }: { summary: BookingSummary; size?: "lg" | "sm" }) {
  return (
    <p className={size === "lg" ? "text-[0.9375rem] text-ink-soft" : "text-sm text-ink-soft"}>
      {summary.priceIsFrom ? "From " : ""}
      <b className={`font-extrabold text-ink ${size === "lg" ? "text-[1.75rem]" : "text-lg"}`}>{summary.price}</b> / adult
    </p>
  );
}

/** Desktop: the sticky card beside the description. Party size and totals stay on the booking page. */
export function BookingCard({ summary, label = "Check dates and book" }: { summary: BookingSummary; label?: string }) {
  return <DetailBookingCardV1 model={bookingCardModel(summary, <BookingDatesController summary={summary} />, label)} primitives={PRESENTATION_PRIMITIVES_V1} />;
}

/** Maps public availability into the narrow behavior seam used by the frozen card view. */
export function BookingDatesController({ summary }: { summary: BookingSummary }) {
  const dates = useNextDates(summary);
  const state = dates === null ? "loading" : dates === "failed" ? "failed" : dates.length ? "ready" : "empty";
  const items = Array.isArray(dates) ? dates.map((occurrence) => {
    const day = dayOption(occurrence.date);
    const offer = offerFor(summary, occurrence);
    const optionPrice = offer ? formatYen(offer.adultPriceYen) : EN_STATIC_COPY_V1.text("booking.seeOption");
    const option = offer?.name ?? EN_STATIC_COPY_V1.text("booking.optionFallback");
    const session = sessionLabel(summary, occurrence);
    return { id: `${occurrence.offerId}-${occurrence.date}`, href: bookDateHref(summary, occurrence), ariaLabel: EN_STATIC_COPY_V1.text("booking.bookDateAria", { session, price: optionPrice }), weekday: day.weekday, day: day.label.slice(day.weekday.length + 1), time: formatTime(occurrence.startAt), option, price: optionPrice };
  }) : [];
  return <DetailBookingDatesV1 state={state} dates={items} provisional={summary.availabilityIsProvisional} primitives={PRESENTATION_PRIMITIVES_V1} />;
}

/** Phones and tablets: price, the next date and one action, always within reach. */
export function MobileBookingBar({ summary }: { summary: BookingSummary }) {
  const dates = useNextDates(summary);
  const next = Array.isArray(dates) ? dates[0] : undefined;
  const line = next ? `Next: ${nextLabel(summary, next)}` : summary.schedule;
  return (
    <div data-sticky-bar className="sticky bottom-0 z-20 mt-14 border-t border-line bg-white/95 backdrop-blur lg:hidden">
      <div className="container-page flex items-center justify-between gap-3 py-3">
        <div className="min-w-0 leading-tight">
          <Price summary={summary} size="sm" />
          {summary.canBook && line ? <p className="mt-1 truncate text-[0.8125rem] font-extrabold text-moss">{line}</p> : null}
        </div>
        {summary.canBook ? (
          <Link href={bookHref(summary)} className={buttonClass("primary", "shrink-0 px-5")}>
            Check dates
          </Link>
        ) : (
          <p className="shrink-0 text-sm font-bold text-ink-soft">{EN_STATIC_COPY_V1.text("booking.pausedShort")}</p>
        )}
      </div>
    </div>
  );
}
