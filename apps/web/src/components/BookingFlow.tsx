"use client";
import { useState } from "react";
import type { ExperienceDetail } from "@niho-experience/api-client";
import { BookingForm } from "./BookingForm";
import { SlotPicker, type BookingSelection } from "./SlotPicker";

export function BookingFlow({ experience, preview, nihoWebOrigin }: { experience: ExperienceDetail; preview: boolean; nihoWebOrigin: string }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const offer = experience.offers.find((item) => item.id === selection?.offerId);
  return selection && offer ? <BookingForm key={`${selection.offerId}-${selection.date}-${selection.adultCount}-${selection.childCount}`} experience={experience} offer={offer} selection={selection} preview={preview} nihoWebOrigin={nihoWebOrigin} onBack={() => setSelection(null)} /> : <SlotPicker slug={experience.slug} offers={experience.offers} preview={preview} nihoWebOrigin={nihoWebOrigin} onContinue={setSelection} />;
}
