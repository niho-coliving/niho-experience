/** Hand-drawn icons and the rubber stamp frozen with presentation v1. */
export type HandIconName = "bowl" | "bean" | "enso" | "mend" | "brush" | "clock" | "chat" | "people" | "train" | "pin" | "cal" | "check" | "cross" | "card" | "mail" | "table" | "house" | "umbrella" | "arrow" | "search";
export declare const HAND_ICON_NAMES: readonly HandIconName[];
type UiIconName = "back" | "plus" | "minus";
/** Kept as a no-op export for source compatibility; v1 icons render typed SVG directly. */
export declare function HandIconSprite(): null;
export declare function HandIcon({ name, className }: {
    name: HandIconName | UiIconName;
    className?: string;
}): import("react").JSX.Element;
/** Round rubber stamp: "NIHO · KAMAKURA · NEIGHBORS ·" around 鎌倉. */
export declare function RubberStamp({ className }: {
    className?: string;
}): import("react").JSX.Element;
export {};
