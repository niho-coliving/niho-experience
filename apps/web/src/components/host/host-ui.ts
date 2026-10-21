/**
 * Host console styles (#86). Same tokens as the traveler site (globals.css,
 * docs/design-system.md §2–3) without its English presentation components.
 */
export type HostButtonVariant = "primary" | "secondary";

const BUTTON_BASE = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[1rem] font-bold leading-tight transition-colors";
const BUTTON_VARIANTS: Record<HostButtonVariant, string> = {
  // Leaf ground with ink text (10.4:1), one per screen.
  primary: "bg-leaf text-ink hover:bg-leaf-hover",
  secondary: "border-[1.5px] border-ink bg-transparent text-ink hover:bg-sand",
};

export function hostButtonClass(variant: HostButtonVariant = "primary", extra = ""): string {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${extra}`.trim();
}

/** Headings in Japanese read better in the UI face than in the Latin display serif. */
export const HOST_HEADING = "font-sans font-bold tracking-normal";

export const HOST_CARD = "rounded-[var(--radius-card)] border border-line bg-canvas p-5 sm:p-6";

export const HOST_PAGE = "mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8";
