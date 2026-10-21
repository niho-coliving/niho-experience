"use client";

import { useEffect, useState } from "react";
import { computeExpectedTotalYen, type ExperienceApiClient, type ExperienceOffer, type Occurrence } from "@niho-experience/api-client";
import { getBrowserApi } from "@/lib/browser-api";
import { dayOption } from "@/lib/date-filter";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { formatDuration, formatTime, formatYen, pluralize } from "@/lib/format";
import { slotAvailabilityLabel } from "@/lib/availability-copy";
import { track } from "@/lib/analytics";
import { BookingSelectionViewV1, EN_STATIC_COPY_V1, type BookingSelectionViewModelV1 } from "@niho/experience-presentation/v1";
import { PRESENTATION_PRIMITIVES_V1 } from "./PresentationV1";
import { formatClock } from "@/lib/schedule";

export type BookingSelection = { offerId: string; date: string; adultCount: number; childCount: number };

/** Dates shown before "Show more dates" (two columns, three rows). */
const FIRST_DATES = 6;

export function SlotPicker({ experience, slug, offers, preview, availabilityIsProvisional, nihoWebOrigin, onContinue, initialOfferId, initialDate, initialAdultCount = 1, initialChildCount = 0, titleAs = "h1" }: { experience: ExperienceDetailForSite; slug: string; offers: ExperienceOffer[]; preview: boolean; availabilityIsProvisional: boolean; nihoWebOrigin: string; onContinue: (selection: BookingSelection) => void; initialOfferId?: string; initialDate?: string; initialAdultCount?: number; initialChildCount?: number; titleAs?: "h1" | "p" }) {
  const [api, setApi] = useState<ExperienceApiClient | null>(null);
  // A date chosen on the detail page arrives pre-selected; it is kept only if it is still bookable (below).
  const [offerId, setOfferId] = useState(offers.some((item) => item.id === initialOfferId) ? initialOfferId! : (offers[0]?.id ?? ""));
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [date, setDate] = useState(initialDate ?? "");
  const [adultCount, setAdultCount] = useState(initialAdultCount);
  const [childCount, setChildCount] = useState(initialChildCount);
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

  // A pre-selected date further down the list opens the full list so it stays in view.
  const selectedIndex = occurrences.findIndex((item) => item.date === date);
  const shownDates = showAllDates || selectedIndex >= FIRST_DATES ? occurrences : occurrences.slice(0, FIRST_DATES);
  const moreDates = occurrences.length - shownDates.length;
  const hint = selected?.bookable && selected.seatsLeft < headCount ? availabilityIsProvisional ? EN_STATIC_COPY_V1.text("booking.samplePartySize") : EN_STATIC_COPY_V1.text("booking.onlyPlaces", { places: pluralize(selected.seatsLeft, "place") }) : EN_STATIC_COPY_V1.text("booking.chooseValid");

  const summary = { title: experience.title, image: experience.cover ? { src: experience.cover.url, alt: "" } : null, summary: offer ? `${formatDuration(offer.durationMinutes)} · ${formatClock(offer.startTime)} JST · ${offer.name}` : undefined };
  const model: BookingSelectionViewModelV1 = {
    summary,
    ...(offers.length ? {} : { unavailableMessage: EN_STATIC_COPY_V1.text("booking.newDatesSoon") }),
    offerDescription: offers.length === 1 ? offer?.shortDescription ?? undefined : undefined,
    offers: offers.map((item) => ({ id: item.id, name: item.name, description: item.shortDescription ?? undefined, adultPrice: formatYen(item.pricing.adultPriceYen), selected: offerId === item.id })),
    dates: { state: loading ? "loading" : error ? "error" : occurrences.length ? "ready" : "empty", provisional: availabilityIsProvisional, options: shownDates.map((item) => { const day = dayOption(item.date); return { id: item.date, weekday: day.weekday, day: day.label.slice(day.weekday.length + 1), time: `${formatTime(item.startAt)} – ${formatTime(item.endAt)}`, availability: item.bookable && availabilityIsProvisional ? undefined : slotAvailabilityLabel(item, availabilityIsProvisional), bookable: item.bookable, selected: date === item.date }; }), moreCount: moreDates },
    counters: offer ? [
      { id: "adult-count", label: EN_STATIC_COPY_V1.text("booking.adults"), note: EN_STATIC_COPY_V1.text(offer.minimumParticipants > 1 ? "booking.adultMinimum" : "booking.each", { price: formatYen(offer.pricing.adultPriceYen), minimum: offer.minimumParticipants }), value: adultCount, maximum: offer.maxPartySize, full: headCount >= offer.maxPartySize },
      ...(offer.pricing.child ? [{ id: "child-count", label: EN_STATIC_COPY_V1.text("booking.children"), note: EN_STATIC_COPY_V1.text(offer.pricing.child.adultRequired ? "booking.childPriceAdult" : "booking.childPrice", { minimumAge: offer.pricing.child.minAge, maximumAge: offer.pricing.child.maxAge, price: formatYen(offer.pricing.child.priceYen) }), value: childCount, maximum: offer.maxPartySize, full: headCount >= offer.maxPartySize }] : []),
    ] : undefined,
    guestRange: offer ? { minimum: offer.minimumParticipants, maximum: offer.maxPartySize, childrenPrice: offer.pricing.child ? formatYen(offer.pricing.child.priceYen) : undefined } : undefined,
    hint: canContinue ? undefined : hint,
    total: total !== null && countsValid ? formatYen(total) : EN_STATIC_COPY_V1.text("booking.checkCounts"),
    totalIsAmount: total !== null && countsValid,
    line: selected ? `${dayOption(selected.date).label} · ${formatTime(selected.startAt)}` : EN_STATIC_COPY_V1.text("booking.chooseDateLine"),
    canContinue,
  };
  const retry = () => { setError(false); setLoading(true); if (api) api.getAvailability(slug, { offerId }).then((result) => { setLoading(false); setError(!result.ok); setOccurrences(result.ok ? result.data.occurrences : []); }); else getBrowserApi(preview, nihoWebOrigin).then(setApi).catch(() => { setError(true); setLoading(false); }); };
  return <BookingSelectionViewV1 model={model} titleAs={titleAs} primitives={PRESENTATION_PRIMITIVES_V1} callbacks={{ onOfferChange: (id) => { const item = offers.find((candidate) => candidate.id === id); setOfferId(id); setDate(""); setLoading(true); if (!item?.pricing.child) setChildCount(0); setShowAllDates(false); }, onDateChange: setDate, onCounterChange: (id, value) => id === "adult-count" ? setAdultCount(value) : setChildCount(value), onRetry: retry, onShowMore: () => setShowAllDates(true), onContinue: () => { track("slot_continue", { experience: slug, guests: headCount }); onContinue({ offerId, date, adultCount, childCount }); } }} />;
}
