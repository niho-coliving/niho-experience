import type { ReactNode } from "react";
import type { DetailBookingCardModelV1 } from "@niho/experience-presentation/v1";
import { browseHref, type BrowseContext } from "./browse-context";

type BookingCardInput = Pick<DetailBookingCardModelV1, "price" | "priceIsFrom" | "canBook" | "assurances"> & {
  slug: string;
  childNote: string | null;
  schedule: string | null;
  browseContext?: Partial<BrowseContext>;
  preferredOfferId?: string;
};

export const presentationBookingHref = (summary: BookingCardInput) =>
  browseHref(`/experiences/${summary.slug}/book`, summary.browseContext ?? {}, summary.preferredOfferId);

/** Pure mapping shared by server rendering and browser availability controllers. */
export function bookingCardModel(summary: BookingCardInput, dates: ReactNode, label = "Check dates and book"): DetailBookingCardModelV1 {
  return {
    price: summary.price,
    priceIsFrom: summary.priceIsFrom,
    ...(summary.childNote === null ? {} : { childNote: summary.childNote }),
    ...(summary.schedule === null ? {} : { schedule: summary.schedule }),
    canBook: summary.canBook,
    bookingHref: presentationBookingHref(summary),
    actionLabel: label,
    assurances: summary.assurances,
    dates,
  };
}
