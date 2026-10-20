/**
 * Hand-drawn icons and the rubber stamp (drawn for NIHO, see docs/design-system.md).
 * The sprite is rendered once in the root layout; icons reference it with <use>.
 * Icons are decoration: they are always aria-hidden and the text next to them carries the meaning.
 */

export type HandIconName = "bowl" | "bean" | "enso" | "mend" | "brush" | "clock" | "chat" | "people" | "train" | "pin" | "cal" | "check" | "cross" | "card" | "mail" | "table" | "house" | "umbrella" | "arrow" | "search";

export const HAND_ICON_NAMES: readonly HandIconName[] = ["bowl", "bean", "enso", "mend", "brush", "clock", "chat", "people", "train", "pin", "cal", "check", "cross", "card", "mail", "table", "house", "umbrella", "arrow", "search"];

// Static, trusted markup (no user data). The #sketch filter gives strokes a slightly wobbly, hand-drawn line.
const SPRITE = `
<defs> <filter id="sketch" x="-15%" y="-15%" width="130%" height="130%"> <feTurbulence type="turbulence" baseFrequency="0.045" numOctaves="2" seed="4" result="t"/> <feDisplacementMap in="SourceGraphic" in2="t" scale="2.2" xChannelSelector="R" yChannelSelector="G"/> </filter> <filter id="rubber" x="-6%" y="-6%" width="112%" height="112%"> <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="9" result="n"/> <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.2 0 0 0 1.95" result="m"/> <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/> <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="1" seed="2" result="w"/> <feDisplacementMap in="c" in2="w" scale="1.6" xChannelSelector="R" yChannelSelector="G"/> </filter> <path id="stamp-arc" d="M16 60a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/> </defs>
<symbol id="i-bowl" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M7.5 23.5c8.6.8 24.3.6 33-.3"/><path d="M8.2 24c.4 8.3 7 14.6 15.8 14.8 8.9.1 15.8-6.4 16.4-15"/><path d="M18.6 38.6l.6 3.1c3.4.6 6.4.5 9.6-.1l.5-3"/><path d="M26.5 20.8L40.8 8.6"/><path d="M29.6 21.6l13.2-9.4"/><path d="M16.3 18.6c-1.8-2.3 1.9-3.6.2-6.2"/><path d="M21.4 18.2c-1.7-2.4 2-3.8.3-6.3"/></g></symbol>
<symbol id="i-bean" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M24.6 7.8c7.9.6 12.6 8.2 11.2 17.5-1.5 9.6-8.6 15.7-15.6 14.6C12.9 38.8 9.6 30.3 12 21.5 13.9 13.9 18.6 7.4 24.6 7.8z"/><path d="M24.2 8.6c-4.6 5.4 3.9 11.5-.4 18.9-2.3 4-2.6 8.6-2.4 12"/><path d="M39.6 10.2l3.2-2.6M41 17.4l3.6-.4M37.4 5.8l1-3.4"/></g></symbol>
<symbol id="i-enso" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M34.8 12.2C29.5 6.7 18.2 6.9 12 13.4 5.6 20.2 7.7 32.6 16.8 37.9c8.4 4.9 19.5 1.7 22.9-7.4 2-5.4.8-10.9-2.1-14.6" stroke-width="2.7"/><path d="M36.6 14.6c.6.4 1.2.9 1.6 1.5" stroke-width="1.4"/></g></symbol>
<symbol id="i-mend" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M6.8 20.5c11.3 1 23.6.8 34.6-.4"/><path d="M7.4 21c.6 9.6 7.6 16.6 16.8 16.8 9.4.2 16.6-7 17-17"/><path d="M19 37.8l.3 2.8h9.7l.4-2.9"/><path d="M22.6 20.8l2.4 4.6-3.2 3.9 3.4 3.7-1.4 4.6"/><path d="M27.4 15.2l1.4-3.6M31.4 16.6l3-2.6M23.2 14.6l-.6-3.6"/></g></symbol>
<symbol id="i-brush" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M39.6 6.6L24.2 25.4"/><path d="M37.4 5l4.2 3.6"/><path d="M22.2 23.4l4.3 3.8"/><path d="M23.6 25.8c-3.6 2-7 5.7-9 10.6 4.5-.6 8.7-3.2 11.4-7.1"/><path d="M7 41.5c5.2-1.6 11.4-1.1 17.1-.9 4.5.2 9.1-.4 13.4-1.4"/></g></symbol>
<symbol id="i-clock" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M24 8.5c9.3-.4 16 6.6 15.6 15.8-.4 8.6-7.3 15.4-16 15.2C15 39.3 8.3 32.4 8.6 23.7 8.9 15.6 15.6 8.9 24 8.5z"/><path d="M23.6 14.6l.4 10 6.6 4"/></g></symbol>
<symbol id="i-chat" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M7.8 11.6c6.8-1.1 14.6-1 20.6.1.8 4.2.7 8.6-.3 12.6-3.6.5-7.6.6-11.4.4L11 29.6l.4-5.2c-1.4-.1-2.6-.3-3.6-.5-.8-4.1-.8-8.1 0-12.3z"/><path d="M31.6 18.4c3.2.1 6.2.4 8.8.9.7 3.8.6 7.5-.2 11.3-1 .2-2.1.3-3.2.4l.6 4.6-5.2-4.2c-3.4 0-6.6-.2-9.4-.6-.4-1.6-.6-3.3-.6-5"/><path d="M13.8 21.6l3-7.2 3 7.2M15 19h3.6"/><path d="M30.6 23.2c1.6-.3 3.4-.2 4.8.2M32.8 21.8c-.3 3 .2 5.6.8 7.6M35.4 25.4c-1.8 0-3.6 1-3.8 2.4"/></g></symbol>
<symbol id="i-people" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M17.6 10.2c3.2-.1 5.6 2.4 5.5 5.6-.1 3.1-2.6 5.4-5.6 5.4-3 0-5.4-2.6-5.3-5.6.1-3 2.4-5.3 5.4-5.4z"/><path d="M7.4 37.4c.4-7 4.6-11.6 10.4-11.6 5.8 0 9.8 4.6 10.2 11.6"/><path d="M31.8 13.6c2.6 0 4.6 2 4.5 4.6-.1 2.5-2.1 4.4-4.6 4.4-2.4 0-4.3-2.1-4.2-4.6.1-2.4 2-4.3 4.3-4.4z"/><path d="M30.4 27.2c5.8-.8 10 3.2 10.4 10"/></g></symbol>
<symbol id="i-train" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M14.2 9.6c6.4-1.2 13.4-1.2 19.8 0 1.4 7.4 1.6 15 .6 22.6-6.8 1.2-14 1.2-20.8 0-1-7.6-.9-15.2.4-22.6z"/><path d="M16.8 13.4c4.8-.6 9.8-.6 14.6 0l-.4 7.4c-4.6.5-9.2.5-13.8 0z"/><path d="M18 27.2h1.4M28.8 27.2h1.4" stroke-width="2.6"/><path d="M17 32.6l-3.4 6.2M31 32.6l3.6 6.2M11 39.2c8.6-.6 17.4-.6 26.2 0"/><path d="M20.2 9.4l-1.8-4.4h11.2l-1.6 4.4"/></g></symbol>
<symbol id="i-pin" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M24.2 41.6c-6.6-8.4-11.4-14.4-11.4-21.2 0-6.6 5-11.6 11.2-11.6 6.4 0 11.4 5 11.2 11.6-.2 6.6-4.6 12.8-11 21.2z"/><path d="M24 15.6c2.6 0 4.6 2 4.5 4.5 0 2.5-2.1 4.4-4.6 4.3-2.4 0-4.4-2-4.3-4.5.1-2.4 2-4.3 4.4-4.3z"/></g></symbol>
<symbol id="i-cal" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M9.4 12.6c9.8-.8 19.6-.8 29.4 0 .6 8.6.6 17.4-.2 26-9.6.8-19.2.8-28.8 0-.8-8.6-.9-17.4-.4-26z"/><path d="M9.6 19.6c9.6-.4 19.2-.4 28.8.2M17 8.6l.3 7M31 8.6l-.2 7"/><path d="M16.4 26.2h.4M24 26.2h.4M31.4 26.2h.4M16.4 32.4h.4M24 32.4h.4" stroke-width="2.8"/></g></symbol>
<symbol id="i-check" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M10.6 25.4c3 2.6 5.4 5.6 7.6 9.4 4.6-9.4 11.4-17.6 19.8-23.6" stroke-width="2.4"/></g></symbol>
<symbol id="i-cross" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M14.4 14.6c6.8 6 12.8 12.6 19.2 19.6M33.4 14.2c-6.8 6.2-13 12.8-18.8 19.8"/></g></symbol>
<symbol id="i-card" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M7.4 13.8c11-.9 22.2-.9 33.2 0 .6 6.8.6 13.6-.1 20.4-11 .9-22 .9-33 0-.7-6.8-.8-13.6-.1-20.4z"/><path d="M7.8 19.8c10.8-.4 21.6-.4 32.4 0M12.8 28.4c2.8-.2 5.6-.2 8.4 0"/></g></symbol>
<symbol id="i-mail" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M7.6 13.2c11-.8 22-.8 33 0 .5 7.2.5 14.4-.1 21.6-11 .8-21.9.8-32.8 0-.6-7.2-.7-14.4-.1-21.6z"/><path d="M8.4 14.4c5 4.4 10.2 8.2 15.8 11.2 5.4-3 10.6-6.8 15.4-11"/></g></symbol>
<symbol id="i-table" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M5.6 21.4c12.4-.8 24.6-.8 36.8 0"/><path d="M9.4 21.8l-1.2 15.6M38.6 21.8l1.2 15.6M14.4 27.6c6.4-.4 12.8-.4 19.2 0"/><path d="M11.6 18.4c1.8-.9 3.8-.9 5.6 0M21.2 18c1.8-.9 3.8-.9 5.6 0M30.8 18.4c1.8-.9 3.8-.9 5.6 0"/><path d="M24 10.4c-1.4-1.8 1.4-2.8 0-4.8" stroke-width="1.5"/></g></symbol>
<symbol id="i-house" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M8.6 22.4L24 9.8l15.6 12.8"/><path d="M12.4 20.4c-.4 6.4-.4 12.4.2 18.2 7.6.6 15.4.6 23 0 .5-5.8.5-11.8 0-18"/><path d="M20.6 38.4c-.2-3.6-.1-7 .3-10.2 2.2-.3 4.4-.3 6.4 0 .4 3.2.4 6.6.2 10.2"/></g></symbol>
<symbol id="i-umbrella" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M6.6 24.2C8 14.8 15.2 9 24 9s16 5.8 17.4 15.2c-2.6-2-5.6-2-8 0-2.6-2-5.8-2-8.6 0-2.8-2-6-2-8.6 0-2.6-2-5.6-2-8 0z"/><path d="M24.2 24v11.6c0 3.4-4.8 3.6-5 .4"/></g></symbol>
<symbol id="i-arrow" viewBox="0 0 60 34"><g filter="url(#sketch)"><path d="M4 6c9 16 26 22 46 18"/><path d="M42 16.6l8.6 7.4-9.2 4.6"/></g></symbol>
<symbol id="i-search" viewBox="0 0 48 48"><g filter="url(#sketch)"><path d="M20.6 8.8c6.6-.3 11.6 4.6 11.4 11.1-.2 6.2-5.2 11-11.4 10.9-6.3-.1-11.1-5.1-10.9-11.3.2-5.9 5-10.4 10.9-10.7z"/><path d="M29.2 29.4l9.8 9.4" stroke-width="2.6"/></g></symbol>
<symbol id="u-left" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
<symbol id="u-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="u-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
<symbol id="s-stamp" viewBox="0 0 120 120"><g filter="url(#rubber)"> <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2.4"/> <circle cx="60" cy="60" r="37" fill="none" stroke="currentColor" stroke-width="1.4"/> <text fill="currentColor" stroke="none" font-family="Nunito Variable, sans-serif" font-size="10" font-weight="900" letter-spacing="1"><textPath href="#stamp-arc" textLength="272" lengthAdjust="spacing">NIHO · KAMAKURA · NEIGHBORS ·</textPath></text> <text x="60" y="68" text-anchor="middle" fill="currentColor" stroke="none" font-family="'Hiragino Mincho ProN','Yu Mincho',serif" font-size="23" font-weight="600">鎌倉</text> </g></symbol>
`;

export function HandIconSprite() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      dangerouslySetInnerHTML={{ __html: SPRITE }}
    />
  );
}

/** Plain (not hand-drawn) control glyphs: back chevron, plus and minus. */
type UiIconName = "back" | "plus" | "minus";
const UI_ICONS: Record<UiIconName, string> = { back: "#u-left", plus: "#u-plus", minus: "#u-minus" };

export function HandIcon({ name, className = "size-6" }: { name: HandIconName | UiIconName; className?: string }) {
  const ui = (UI_ICONS as Partial<Record<string, string>>)[name];
  const viewBox = name === "arrow" ? "0 0 60 34" : ui ? "0 0 24 24" : "0 0 48 48";
  return (
    <svg className={`ico ${className}`} viewBox={viewBox} aria-hidden="true" focusable="false">
      <use href={ui ?? `#i-${name}`} />
    </svg>
  );
}

/** Round rubber stamp: "NIHO · KAMAKURA · NEIGHBORS ·" around 鎌倉. Decoration only. */
export function RubberStamp({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <use href="#s-stamp" />
    </svg>
  );
}
