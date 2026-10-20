"use client";
import { useEffect, useRef, useState } from "react";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { BookingForm } from "./BookingForm";
import { SlotPicker, type BookingSelection } from "./SlotPicker";

/** Two screens on one page: date and party size (SlotPicker), then details and checkout (BookingForm). `titleAs="p"` when a published document supplies the page heading. */
export function BookingFlow({ experience, preview, availabilityIsProvisional, nihoWebOrigin, attributionEnabled, initialOfferId, initialDate, titleAs = "h1" }: { experience: ExperienceDetailForSite; preview: boolean; availabilityIsProvisional: boolean; nihoWebOrigin: string; attributionEnabled: boolean; initialOfferId?: string; initialDate?: string; titleAs?: "h1" | "p" }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const offer = experience.offers.find((item) => item.id === selection?.offerId);
  // Switching screens keeps the page's scroll position by default, which can land mid-form. Bring the booking area's top into view and move focus there.
  const top = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    top.current?.scrollIntoView({ block: "start" });
    top.current?.focus({ preventScroll: true });
  }, [selection]);
  return <div ref={top} tabIndex={-1} className="scroll-mt-20 outline-none">{selection && offer ? <BookingForm key={`${selection.offerId}-${selection.date}-${selection.adultCount}-${selection.childCount}`} experience={experience} offer={offer} selection={selection} preview={preview} nihoWebOrigin={nihoWebOrigin} attributionEnabled={attributionEnabled} onBack={() => setSelection(null)} titleAs={titleAs} /> : <SlotPicker experience={experience} titleAs={titleAs} slug={experience.slug} offers={experience.offers} preview={preview} availabilityIsProvisional={availabilityIsProvisional} nihoWebOrigin={nihoWebOrigin} onContinue={setSelection} initialOfferId={initialOfferId} initialDate={initialDate} />}</div>;
}
