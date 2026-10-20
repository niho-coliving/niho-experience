"use client";
import { useState } from "react";
import type { ExperienceDetail } from "@niho-experience/api-client";
import { BookingForm } from "./BookingForm";
import { SlotPicker, type BookingSelection } from "./SlotPicker";

export function BookingFlow({ experience, preview, availabilityIsProvisional, nihoWebOrigin, initialOfferId, initialDate }: { experience: ExperienceDetail; preview: boolean; availabilityIsProvisional: boolean; nihoWebOrigin: string; initialOfferId?: string; initialDate?: string }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const offer = experience.offers.find((item) => item.id === selection?.offerId);
  return selection && offer ? <BookingForm key={`${selection.offerId}-${selection.date}-${selection.adultCount}-${selection.childCount}`} experience={experience} offer={offer} selection={selection} preview={preview} nihoWebOrigin={nihoWebOrigin} onBack={() => setSelection(null)} /> : <SlotPicker slug={experience.slug} offers={experience.offers} preview={preview} availabilityIsProvisional={availabilityIsProvisional} nihoWebOrigin={nihoWebOrigin} onContinue={setSelection} initialOfferId={initialOfferId} initialDate={initialDate} />;
}
