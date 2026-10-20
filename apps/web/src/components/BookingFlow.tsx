"use client";
import { useEffect, useRef, useState } from "react";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { BookingForm, type BookingDraft, type CheckoutAttempt } from "./BookingForm";
import { SlotPicker, type BookingSelection } from "./SlotPicker";

/** Two screens on one page: date and party size (SlotPicker), then details and checkout (BookingForm). `titleAs="p"` when a published document supplies the page heading. */
export function BookingFlow({ experience, preview, availabilityIsProvisional, nihoWebOrigin, attributionEnabled, initialOfferId, initialDate, initialAdultCount, titleAs = "h1" }: { experience: ExperienceDetailForSite; preview: boolean; availabilityIsProvisional: boolean; nihoWebOrigin: string; attributionEnabled: boolean; initialOfferId?: string; initialDate?: string; initialAdultCount?: number; titleAs?: "h1" | "p" }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [lastSelection, setLastSelection] = useState<BookingSelection | null>(null);
  // Contact data stays in this page's memory only; answers belong to one offer and question fingerprint.
  const [draft, setDraft] = useState<BookingDraft>({ guestName: "", guestEmail: "", note: "", answerSets: {} });
  const attemptRef = useRef<CheckoutAttempt | null>(null);
  const offer = experience.offers.find((item) => item.id === selection?.offerId);
  function continueBooking(next: BookingSelection) {
    setLastSelection(next);
    setSelection(next);
  }
  // Switching screens keeps the page's scroll position by default, which can land mid-form. Bring the booking area's top into view and move focus there.
  const top = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    top.current?.scrollIntoView({ block: "start" });
    top.current?.focus({ preventScroll: true });
  }, [selection]);
  const formKey = offer && selection ? JSON.stringify([selection, offer.bookingQuestionsFingerprint, offer.pricing, offer.minimumParticipants, offer.maxPartySize, offer.cancellationPolicy, offer.acceptanceMode, experience.seller, experience.booking.consentVersion, experience.booking.legalDocuments]) : "";
  return <div ref={top} tabIndex={-1} className="scroll-mt-20 outline-none">{selection && offer ? <BookingForm key={formKey} experience={experience} offer={offer} selection={selection} preview={preview} nihoWebOrigin={nihoWebOrigin} attributionEnabled={attributionEnabled} draft={draft} onDraftChange={setDraft} attemptRef={attemptRef} onBack={() => setSelection(null)} titleAs={titleAs} /> : <SlotPicker experience={experience} titleAs={titleAs} slug={experience.slug} offers={experience.offers} preview={preview} availabilityIsProvisional={availabilityIsProvisional} nihoWebOrigin={nihoWebOrigin} onContinue={continueBooking} initialOfferId={lastSelection?.offerId ?? initialOfferId} initialDate={lastSelection?.date ?? initialDate} initialAdultCount={lastSelection?.adultCount ?? initialAdultCount} initialChildCount={lastSelection?.childCount} />}</div>;
}
