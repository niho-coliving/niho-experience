"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Occurrence } from "@niho-experience/api-client";
import { readAvailability } from "@/lib/browser-availability";
import { browseHref, type BrowseContext } from "@/lib/browse-context";
import { dayOption, nextBookable } from "@/lib/date-filter";
import { formatTime, formatYen } from "@/lib/format";
import { HandIcon, type HandIconName } from "./HandIcon";
import { buttonClass, Notice } from "./ui";

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

const bookHref = (summary: BookingSummary) => browseHref(`/experiences/${summary.slug}/book`, summary.browseContext ?? {}, summary.preferredOfferId);
/** The booking page pre-selects this date and option; the guest still confirms everything there. */
const bookDateHref = (summary: BookingSummary, occurrence: Occurrence) =>
  browseHref(`/experiences/${summary.slug}/book`, { ...summary.browseContext, date: occurrence.date }, occurrence.offerId);
const offerFor = (summary: BookingSummary, occurrence: Occurrence) => summary.offers.find((offer) => offer.id === occurrence.offerId);
const sessionLabel = (summary: BookingSummary, occurrence: Occurrence) => {
  const offer = offerFor(summary, occurrence);
  return `${dayOption(occurrence.date).label} · ${formatTime(occurrence.startAt)} · ${offer?.name ?? "Option"}`;
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
  const dates = useNextDates(summary);
  return (
    <div className="rounded-[26px] border border-line bg-white p-6 shadow-[0_12px_36px_rgb(0_0_0/0.08)]">
      <h2 id="book-heading" className="sr-only">
        Dates and booking
      </h2>
      <Price summary={summary} />
      <p className="mt-0.5 text-[0.84375rem] text-muted">{[summary.childNote, "Japanese yen, tax included"].filter(Boolean).join(" · ")}</p>
      {summary.schedule ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
          <HandIcon name="cal" className="size-6" />
          <span>
            {summary.schedule} <span className="font-normal text-muted">JST</span>
          </span>
        </p>
      ) : null}
      {summary.canBook ? (
        <>
          <p className="mt-5 mb-2 text-[0.8125rem] font-extrabold text-muted">Next dates (Japan time)</p>
          <div aria-live="polite">
            {dates === null ? (
              <p className="text-sm text-muted">Checking dates…</p>
            ) : dates === "failed" || dates.length === 0 ? (
              <p className="text-sm text-muted">{dates === "failed" ? "Dates couldn't be loaded here." : "No dates are open yet."} See all dates on the next page.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {dates.map((occurrence) => {
                  const day = dayOption(occurrence.date);
                  const offer = offerFor(summary, occurrence);
                  const optionPrice = offer ? formatYen(offer.adultPriceYen) : "See option";
                  return (
                    <li key={`${occurrence.offerId}-${occurrence.date}`}>
                      <Link
                        href={bookDateHref(summary, occurrence)}
                        aria-label={`Book ${sessionLabel(summary, occurrence)} for ${optionPrice} per adult`}
                        className="block rounded-2xl border border-line-strong bg-white px-1 py-2.5 text-center leading-tight hover:border-ink hover:bg-leaf-pale"
                      >
                        <small className="block text-xs font-extrabold text-muted">{day.weekday}</small>
                        <b className="block text-base font-extrabold">{day.label.slice(day.weekday.length + 1)}</b>
                        <span className="mt-0.5 block text-xs text-ink-soft">{formatTime(occurrence.startAt)}</span>
                        <span className="mt-1 block truncate text-[0.6875rem] font-extrabold" title={offer?.name ?? "Option"}>{offer?.name ?? "Option"}</span>
                        <span className="block text-[0.6875rem] text-ink-soft">{optionPrice} / adult</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {summary.availabilityIsProvisional && Array.isArray(dates) && dates.length ? (
              <p className="mt-2 text-xs text-muted">Sample dates · not confirmed yet</p>
            ) : null}
          </div>
          <Link href={bookHref(summary)} className={buttonClass("primary", "mt-5 w-full")}>
            {label}
          </Link>
          <ul className="mt-[18px] grid gap-2 text-sm text-ink-soft">
            {summary.assurances.map((item) => (
              <li key={item.text} className="flex items-center gap-2">
                <HandIcon name={item.icon} className="size-6 text-moss" />
                {item.text}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-5">
          <Notice tone="neutral" title="Bookings are paused">
            Please check back later.
          </Notice>
        </div>
      )}
    </div>
  );
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
          <p className="shrink-0 text-sm font-bold text-ink-soft">Bookings are paused</p>
        )}
      </div>
    </div>
  );
}
