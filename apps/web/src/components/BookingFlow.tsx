"use client";
import { useState } from "react";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { BookingForm } from "./BookingForm";
import { SlotPicker, type BookingSelection } from "./SlotPicker";

export function BookingFlow({ experience, preview, availabilityIsProvisional, nihoWebOrigin }: { experience: ExperienceDetailForSite; preview: boolean; availabilityIsProvisional: boolean; nihoWebOrigin: string }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const offer = experience.offers.find((item) => item.id === selection?.offerId);
  return selection && offer ? <BookingForm key={`${selection.offerId}-${selection.date}-${selection.adultCount}-${selection.childCount}`} experience={experience} offer={offer} selection={selection} preview={preview} nihoWebOrigin={nihoWebOrigin} onBack={() => setSelection(null)} /> : <SlotPicker slug={experience.slug} offers={experience.offers} preview={preview} availabilityIsProvisional={availabilityIsProvisional} nihoWebOrigin={nihoWebOrigin} onContinue={setSelection} />;
}
