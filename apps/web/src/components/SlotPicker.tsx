"use client";

import { useEffect, useState } from "react";
import { computeExpectedTotalYen, type ExperienceApiClient, type ExperienceOffer, type Occurrence } from "@niho-experience/api-client";
import { getBrowserApi } from "@/lib/browser-api";
import { formatDay, formatTimeRange, formatYen } from "@/lib/format";
import { track } from "@/lib/analytics";
import { buttonClass } from "./ui";

export type BookingSelection = { offerId: string; date: string; adultCount: number; childCount: number };
export function SlotPicker({ slug, offers, preview, nihoWebOrigin, onContinue }: { slug: string; offers: ExperienceOffer[]; preview: boolean; nihoWebOrigin: string; onContinue: (selection: BookingSelection) => void }) {
  const [api, setApi] = useState<ExperienceApiClient | null>(null);
  const [offerId, setOfferId] = useState(offers[0]?.id ?? "");
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [date, setDate] = useState("");
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
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
    });
    return () => { active = false; };
  }, [api, slug, offerId]);

  if (!offers.length) return <p className="text-ink-soft">New dates are coming soon.</p>;
  return <div className="space-y-5">
    <div>
      <label htmlFor="offer" className="mb-2 block font-bold">Experience option</label>
      <select id="offer" value={offerId} onChange={(event) => { setOfferId(event.target.value); setDate(""); setLoading(true); setAdultCount(1); setChildCount(0); }} className="min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base">
        {offers.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatYen(item.pricing.adultPriceYen)} per adult</option>)}
      </select>
      {offer?.shortDescription ? <p className="mt-2 text-sm text-muted">{offer.shortDescription}</p> : null}
    </div>
    <fieldset>
      <legend className="mb-2 font-bold">Choose a date <span className="font-normal text-muted">(Japan time)</span></legend>
       {loading ? <p role="status" className="text-muted">Checking dates…</p> : error ? <div role="alert" className="space-y-2"><p>Dates could not be loaded.</p><button type="button" className="font-bold text-moss underline" onClick={() => { setError(false); setLoading(true); if (api) { api.getAvailability(slug, { offerId }).then((result) => { setLoading(false); setError(!result.ok); setOccurrences(result.ok ? result.data.occurrences : []); }); } else { getBrowserApi(preview, nihoWebOrigin).then(setApi).catch(() => { setError(true); setLoading(false); }); } }}>Try again</button></div> :
        occurrences.length ? <div className="max-h-80 space-y-2 overflow-y-auto pr-1">{occurrences.map((item) => <label key={`${item.offerId}-${item.date}`} className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 ${item.bookable ? "cursor-pointer border-line-strong" : "border-line bg-sand text-muted"}`}>
          <input type="radio" name="occurrence" value={item.date} checked={date === item.date} disabled={!item.bookable} onChange={() => setDate(item.date)} className="size-5 accent-moss" />
          <span><span className="block font-bold">{formatDay(item.startAt)} · {formatTimeRange(item.startAt, item.endAt)}</span><span className="block text-sm">{item.bookable ? `${item.seatsLeft} places currently available` : item.reason === "FULL" ? "Fully booked" : "Booking closed"}</span></span>
        </label>)}</div> : <p className="text-muted">No dates are open yet.</p>}
    </fieldset>
    {offer ? <div className="grid grid-cols-2 gap-3">
      <label className="font-bold">Adults<input type="number" inputMode="numeric" min={0} max={offer.maxPartySize} value={adultCount} onChange={(event) => setAdultCount(Number(event.target.value))} className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base" /></label>
      {offer.pricing.child ? <label className="font-bold">Children ({offer.pricing.child.minAge}–{offer.pricing.child.maxAge})<input type="number" inputMode="numeric" min={0} max={offer.maxPartySize} value={childCount} onChange={(event) => setChildCount(Number(event.target.value))} className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base" /></label> : null}
    </div> : null}
    {offer ? <p className="text-sm text-muted">{offer.minimumParticipants}–{offer.maxPartySize} guests per booking. {offer.pricing.child ? `Children ${formatYen(offer.pricing.child.priceYen)} each.` : "This option is for adults only."}</p> : null}
    <p aria-live="polite" className="rounded-xl bg-sand p-3 font-bold">Total: {total !== null && countsValid ? formatYen(total) : "Check guest counts"} <span className="block text-sm font-normal text-muted">Japanese yen, tax included. Availability is confirmed at checkout.</span></p>
    {canContinue ? <button type="button" onClick={() => { track("slot_continue", { experience: slug, guests: headCount }); onContinue({ offerId, date, adultCount, childCount }); }} className={buttonClass("primary", "w-full text-center")}>Continue</button> : <p className="text-sm text-muted">Choose an available date and a valid party size to continue.</p>}
  </div>;
}
