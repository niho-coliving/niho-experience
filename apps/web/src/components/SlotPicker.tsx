"use client";

import { useEffect, useState } from "react";
import { computeExpectedTotalYen, type ExperienceApiClient, type ExperienceOffer, type Occurrence } from "@niho-experience/api-client";
import { getBrowserApi } from "@/lib/browser-api";
import { dayOption } from "@/lib/date-filter";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { formatTime, formatYen, pluralize } from "@/lib/format";
import { slotAvailabilityLabel } from "@/lib/availability-copy";
import { track } from "@/lib/analytics";
import { BookingBar, BookingSummaryCard, StepHeading } from "./BookingParts";
import { HandIcon } from "./HandIcon";
import { buttonClass } from "./ui";

export type BookingSelection = { offerId: string; date: string; adultCount: number; childCount: number };

/** Dates shown before "Show more dates" (two columns, three rows). */
const FIRST_DATES = 6;

/** A choice card: the radio covers the card (invisible, but focusable and read out); the card shows its state. */
const choiceCard =
  "relative block rounded-[18px] border border-line-strong bg-white text-left leading-tight has-[:checked]:border-ink has-[:checked]:bg-leaf-pale has-[:checked]:shadow-[inset_0_0_0_1px_var(--color-ink)] has-[:disabled]:border-line has-[:disabled]:bg-sand has-[:disabled]:text-muted has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-moss";
const hiddenRadio = "absolute inset-0 z-[1] size-full cursor-pointer appearance-none rounded-[18px] opacity-0 focus-visible:outline-none disabled:cursor-not-allowed";

export function SlotPicker({ experience, slug, offers, preview, availabilityIsProvisional, nihoWebOrigin, onContinue, initialOfferId, initialDate, titleAs = "h1" }: { experience: ExperienceDetailForSite; slug: string; offers: ExperienceOffer[]; preview: boolean; availabilityIsProvisional: boolean; nihoWebOrigin: string; onContinue: (selection: BookingSelection) => void; initialOfferId?: string; initialDate?: string; titleAs?: "h1" | "p" }) {
  const [api, setApi] = useState<ExperienceApiClient | null>(null);
  // A date chosen on the detail page arrives pre-selected; it is kept only if it is still bookable (below).
  const [offerId, setOfferId] = useState(offers.some((item) => item.id === initialOfferId) ? initialOfferId! : (offers[0]?.id ?? ""));
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [date, setDate] = useState(initialDate ?? "");
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [showAllDates, setShowAllDates] = useState(false);
  const offer = offers.find((item) => item.id === offerId);
  const selected = occurrences.find((item) => item.offerId === offerId && item.date === date);
  const headCount = adultCount + childCount;
  const total = offer ? computeExpectedTotalYen(offer.pricing, adultCount, childCount) : null;
  const countsValid = !!offer && headCount >= offer.minimumParticipants && headCount <= offer.maxPartySize && adultCount >= 0 && childCount >= 0 && (!offer.pricing.child || !offer.pricing.child.adultRequired || childCount === 0 || adultCount > 0);
  const canContinue = countsValid && total !== null && !!selected?.bookable && selected.seatsLeft >= headCount;

  useEffect(() => {
    let active = true;
    getBrowserApi(preview, nihoWebOrigin).then((client) => { if (active) setApi(client); }).catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, [preview, nihoWebOrigin]);

  useEffect(() => {
    if (!api) return;
    let active = true;
    api.getAvailability(slug, { offerId }).then((result) => {
      if (!active) return;
      setLoading(false);
      setError(!result.ok);
      setOccurrences(result.ok ? result.data.occurrences : []);
      setDate((current) => (current && result.ok && result.data.occurrences.some((item) => item.offerId === offerId && item.date === current && item.bookable) ? current : ""));
    });
    return () => { active = false; };
  }, [api, slug, offerId]);

  if (!offers.length) return <><BookingSummaryCard experience={experience} offer={null} titleAs={titleAs} /><p className="mt-6 text-ink-soft">New dates are coming soon.</p></>;

  // A pre-selected date further down the list opens the full list so it stays in view.
  const selectedIndex = occurrences.findIndex((item) => item.date === date);
  const shownDates = showAllDates || selectedIndex >= FIRST_DATES ? occurrences : occurrences.slice(0, FIRST_DATES);
  const moreDates = occurrences.length - shownDates.length;
  const hint = selected?.bookable && selected.seatsLeft < headCount ? availabilityIsProvisional ? "This sample date cannot take that party size. Try another date or fewer guests." : `Only ${pluralize(selected.seatsLeft, "place")} available for this date. Try another date or fewer guests.` : "Choose an available date and a valid party size to continue.";

  return <div>
    <BookingSummaryCard experience={experience} offer={offer ?? null} titleAs={titleAs} />
    {offers.length === 1 && offer?.shortDescription ? <p className="mt-2.5 text-sm text-muted">{offer.shortDescription}</p> : null}

    {offers.length > 1 ? <section className="mt-6" aria-labelledby="offer-heading">
      <h2 id="offer-heading" className="mb-2.5 font-sans text-sm font-extrabold tracking-normal text-muted">Experience option</h2>
      <div role="radiogroup" aria-labelledby="offer-heading" className="grid gap-2.5">
        {offers.map((item) => <label key={item.id} className={`${choiceCard} bg-sand px-4 py-3.5`}>
          <input type="radio" name="offer" value={item.id} checked={offerId === item.id} onChange={() => { setOfferId(item.id); setDate(""); setLoading(true); setAdultCount(1); setChildCount(0); setShowAllDates(false); }} className={hiddenRadio} />
          <span className="flex items-baseline justify-between gap-3"><b className="font-extrabold">{item.name}</b><span className="shrink-0 text-sm text-ink-soft"><b className="font-extrabold text-ink">{formatYen(item.pricing.adultPriceYen)}</b> per adult</span></span>
          {item.shortDescription ? <span className="mt-1 block text-sm text-muted">{item.shortDescription}</span> : null}
        </label>)}
      </div>
    </section> : null}

    <section aria-labelledby="date-heading">
      <StepHeading id="date-heading" step={1}>Choose a date</StepHeading>
      <p className="-mt-1.5 mb-3 text-sm text-muted">Times are Japan time (JST).{availabilityIsProvisional ? " Sample dates: availability is not confirmed." : ""}</p>
      {loading ? <p role="status" className="text-muted">Checking dates…</p> : error ? <div role="alert" className="space-y-2"><p>Dates could not be loaded.</p><button type="button" className="font-bold text-moss underline" onClick={() => { setError(false); setLoading(true); if (api) { api.getAvailability(slug, { offerId }).then((result) => { setLoading(false); setError(!result.ok); setOccurrences(result.ok ? result.data.occurrences : []); }); } else { getBrowserApi(preview, nihoWebOrigin).then(setApi).catch(() => { setError(true); setLoading(false); }); } }}>Try again</button></div> :
        occurrences.length ? <>
          <div role="radiogroup" aria-labelledby="date-heading" className="grid grid-cols-2 gap-2.5">
            {shownDates.map((item) => {
              const day = dayOption(item.date);
              return <label key={`${item.offerId}-${item.date}`} className={`${choiceCard} px-3.5 py-3`}>
                <input type="radio" name="occurrence" value={item.date} checked={date === item.date} disabled={!item.bookable} onChange={() => setDate(item.date)} className={hiddenRadio} />
                <small className="block text-[0.78125rem] font-extrabold text-muted">{day.weekday}</small>
                <b className="block text-[1.0625rem] font-extrabold">{day.label.slice(day.weekday.length + 1)}</b>
                <span className="mt-0.5 block text-[0.8125rem] text-ink-soft">{formatTime(item.startAt)} – {formatTime(item.endAt)}<span className="sr-only"> JST</span></span>
                {/* Provisional (pilot) dates carry one note under the heading instead of the same line on every card. */}
                {item.bookable && availabilityIsProvisional ? null : <span className={`mt-1 block text-xs ${item.bookable ? "text-muted" : "font-extrabold"}`}>{slotAvailabilityLabel(item, availabilityIsProvisional)}</span>}
              </label>;
            })}
          </div>
          {moreDates > 0 ? <button type="button" onClick={() => setShowAllDates(true)} className="link-leaf mt-3.5 text-sm">Show {pluralize(moreDates, "more date")}</button> : null}
        </> : <p className="text-muted">No dates are open yet.</p>}
    </section>

    {offer ? <section aria-labelledby="guests-heading">
      <StepHeading id="guests-heading" step={2}>Who&apos;s coming</StepHeading>
      <Counter id="adult-count" label="Adults" note={`${formatYen(offer.pricing.adultPriceYen)} each${offer.minimumParticipants > 1 ? ` · at least ${offer.minimumParticipants} guests` : ""}`} value={adultCount} max={offer.maxPartySize} full={headCount >= offer.maxPartySize} onChange={setAdultCount} />
      {offer.pricing.child ? <Counter id="child-count" label="Children" note={`Ages ${offer.pricing.child.minAge}–${offer.pricing.child.maxAge} · ${formatYen(offer.pricing.child.priceYen)} each${offer.pricing.child.adultRequired ? ", with an adult" : ""}`} value={childCount} max={offer.maxPartySize} full={headCount >= offer.maxPartySize} onChange={setChildCount} /> : null}
      <p className="mt-3 text-sm text-muted">{offer.minimumParticipants}–{offer.maxPartySize} guests per booking. {offer.pricing.child ? `Children ${formatYen(offer.pricing.child.priceYen)} each.` : "This option is for adults only."} Japanese yen, tax included. Availability is confirmed at checkout.</p>
    </section> : null}
    {canContinue ? null : <p aria-live="polite" className="mt-4 flex items-start gap-2 rounded-2xl bg-sand p-3.5 text-sm text-ink-soft"><HandIcon name="cal" className="size-5 shrink-0 text-moss" />{hint}</p>}

    <BookingBar
      total={total !== null && countsValid ? <><b className="text-lg font-extrabold text-ink">{formatYen(total)}</b> total</> : <b className="font-extrabold text-ink">Check guest counts</b>}
      line={selected ? `${dayOption(selected.date).label} · ${formatTime(selected.startAt)}` : "Choose a date"}
      action={<button type="button" disabled={!canContinue} onClick={() => { track("slot_continue", { experience: slug, guests: headCount }); onContinue({ offerId, date, adultCount, childCount }); }} className={buttonClass("primary", "min-h-[46px] shrink-0 px-6")}>Continue</button>}
    />
  </div>;
}

/** −/+ around a real number input, so the count can also be typed (and is read as a spin button). */
function Counter({ id, label, note, value, max, full, onChange }: { id: string; label: string; note: string; value: number; max: number; full: boolean; onChange: (value: number) => void }) {
  const step = "grid size-[34px] shrink-0 place-items-center rounded-full border border-line-strong bg-white disabled:cursor-not-allowed disabled:opacity-35";
  const noun = label.toLowerCase();
  return <div className="flex items-center justify-between gap-3 border-b border-line py-3.5 last-of-type:border-b-0">
    <div className="min-w-0">
      <label htmlFor={id} className="block font-extrabold">{label}</label>
      <small id={`${id}-note`} className="block text-[0.8125rem] font-bold text-muted">{note}</small>
    </div>
    <div className="flex shrink-0 items-center gap-1.5">
      <button type="button" aria-label={`Fewer ${noun}`} aria-controls={id} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))} className={step}><HandIcon name="minus" className="size-4 [stroke-width:2.2]" /></button>
      <input id={id} type="number" inputMode="numeric" min={0} max={max} value={value} aria-describedby={`${id}-note`} onChange={(event) => onChange(Number(event.target.value))} className="w-10 rounded-lg bg-transparent py-1 text-center text-[1.0625rem] font-extrabold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <button type="button" aria-label={`More ${noun}`} aria-controls={id} disabled={full || value >= max} onClick={() => onChange(Math.min(max, value + 1))} className={step}><HandIcon name="plus" className="size-4 [stroke-width:2.2]" /></button>
    </div>
  </div>;
}
