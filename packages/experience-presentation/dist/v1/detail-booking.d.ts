import type { ReactNode } from "react";
import type { HandIconName } from "./icons.js";
import { type StaticCopyAccessorV1 } from "./static-copy.js";
import { type PresentationPrimitivesV1 } from "./types.js";
export type DetailBookingDateV1 = Readonly<{
    id: string;
    href: string;
    ariaLabel: string;
    weekday: string;
    day: string;
    time: string;
    option: string;
    price: string;
}>;
export declare function DetailBookingDatesV1({ state, dates, provisional, primitives, copy }: {
    state: "loading" | "failed" | "empty" | "ready";
    dates: readonly DetailBookingDateV1[];
    provisional: boolean;
    primitives?: Partial<PresentationPrimitivesV1>;
    copy?: StaticCopyAccessorV1;
}): import("react").JSX.Element;
export type DetailBookingCardModelV1 = Readonly<{
    price: string;
    priceIsFrom: boolean;
    childNote?: string;
    schedule?: string;
    canBook: boolean;
    bookingHref: string;
    actionLabel: string;
    assurances: readonly {
        icon: HandIconName;
        text: string;
    }[];
    dates: ReactNode;
}>;
export declare function DetailBookingCardV1({ model, primitives, copy }: {
    model: DetailBookingCardModelV1;
    primitives?: Partial<PresentationPrimitivesV1>;
    copy?: StaticCopyAccessorV1;
}): import("react").JSX.Element;
