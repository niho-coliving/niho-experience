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

/**
 * The console's denser buttons (mock v2 of the provider workspace): 38px, 30px inside
 * rows, 48px for a form's one action. `ghost` is text only. hostButtonClass stays for
 * the full-page states (sign-in, errors).
 */
export type HostConsoleButtonVariant = HostButtonVariant | "ghost";

const CONSOLE_BUTTON_BASE = "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border font-extrabold leading-none transition-colors";
const CONSOLE_BUTTON_SIZES = { lg: "h-12 px-6 text-[0.9375rem]", md: "h-[38px] px-4 text-[0.84375rem]", sm: "h-[30px] px-3 text-[0.78125rem]" } as const;
const CONSOLE_BUTTON_VARIANTS: Record<HostConsoleButtonVariant, string> = {
  primary: "border-transparent bg-leaf text-ink hover:bg-leaf-hover",
  secondary: "border-line-strong bg-canvas text-ink hover:bg-sand",
  ghost: "border-transparent text-ink-soft hover:bg-sand hover:text-ink",
};

export function consoleButtonClass(variant: HostConsoleButtonVariant = "secondary", size: keyof typeof CONSOLE_BUTTON_SIZES = "md", extra = ""): string {
  return `${CONSOLE_BUTTON_BASE} ${CONSOLE_BUTTON_SIZES[size]} ${CONSOLE_BUTTON_VARIANTS[variant]} ${extra}`.trim();
}

/** Headings in Japanese read better in the UI face than in the Latin display serif. */
export const HOST_HEADING = "font-sans font-bold tracking-normal";

/** One white panel per section: 16px corners, a hairline, no shadow. */
export const HOST_SURFACE = "rounded-2xl border border-line bg-canvas";

/** The page while the browser refreshes the session (no frame around it yet). */
export const HOST_PAGE = "mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8";
