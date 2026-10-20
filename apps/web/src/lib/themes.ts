import type { HandIconName } from "@/components/HandIcon";
import { CALLIGRAPHY_VIDEO, FEATURE_MOSAIC, GUIDE_FACE, type SitePhoto, type SiteVideo } from "./site-media";

/**
 * Editorial table for the home page (the icon row, the video strips, the feature and the
 * host feature) and a few display words on cards and the booking page. The public contract
 * has no theme field, and #36 rules out inferring themes from titles, so only the slugs
 * listed here get an entry. Entries link to the experience and are never used as list
 * filters. Unknown slugs are skipped and fall back to what the data says.
 */

export type ThemeKey = "cook" | "roast" | "sit" | "mend" | "write";

export type Theme = {
  key: ThemeKey;
  icon: HandIconName;
  label: string;
  verb: string;
  /** One word for "Food, coffee, Zen, mending and calligraphy." */
  topic: string;
};

/** Words and pictures an editor chose for one listed slug. Data (hosts, dates, prices) always comes from the API. */
export type Editorial = {
  theme: Theme;
  /** Short name: "Community dinner" (video strips, the booking page's back link). */
  short?: string;
  /** Replaces the host names on cards: "with Takuya & neighbors". */
  withLabel?: string;
  /** A face for cards and the host row, used only when the data lists no hosts. */
  face?: string;
  /** Replaces the theme's strip video. */
  video?: SiteVideo;
};

const COOK: Theme = { key: "cook", icon: "bowl", label: "Cook & eat", verb: "Cook", topic: "food" };
const ROAST: Theme = { key: "roast", icon: "bean", label: "Roast coffee", verb: "Roast", topic: "coffee" };
const SIT: Theme = { key: "sit", icon: "enso", label: "Sit zazen", verb: "Sit", topic: "Zen" };
const MEND: Theme = { key: "mend", icon: "mend", label: "Mend a bowl", verb: "Mend", topic: "mending" };
const WRITE: Theme = { key: "write", icon: "brush", label: "Write kanji", verb: "Write", topic: "calligraphy" };

const EDITORIAL: Readonly<Record<string, Editorial>> = {
  // Pilot (MOCK_CATALOG=pilot)
  "kamakura-community-dinner": { theme: COOK, short: "Community dinner", withLabel: "Takuya & neighbors" },
  "kamakura-coffee-roasting": { theme: ROAST, short: "Coffee roasting" },
  "engakuji-zen-meditation": { theme: SIT, short: "Zazen at Engakuji", withLabel: "a Zen priest & guide", face: GUIDE_FACE },
  "kamakura-ceramic-mending": { theme: MEND, short: "Ceramic mending" },
  "kamakura-calligraphy": { theme: WRITE, short: "Calligraphy", video: CALLIGRAPHY_VIDEO },
  // Synthetic preview catalog: themes only.
  "home-cooked-dinner-with-locals": { theme: COOK },
  "evening-pottery-session": { theme: { ...MEND, label: "Make pottery", verb: "Make", topic: "pottery" } },
};

/** Home feature next to a photo mosaic, shown while its slug is listed. */
export const FEATURED_STORY = {
  slug: "kamakura-community-dinner",
  heading: "One long table, eight guests and a few neighbors",
  body: "Cook four or five seasonal dishes with people who live in Kamakura, then sit down together. The menu follows the season; the conversation follows the table.",
  cta: "See the dinner",
  photos: FEATURE_MOSAIC as readonly SitePhoto[],
} as const;

/** Home host feature, shown while its slug is listed. The name comes from the data (hosts[0]). */
export const FEATURED_HOST = {
  slug: "kamakura-calligraphy",
  role: "Calligrapher, MC and event producer",
  story: "His work was exhibited in New York in 2025. In his workshop you learn how to hold the brush, choose a word that means something to you, and write it on paper to take home.",
  video: CALLIGRAPHY_VIDEO,
} as const;

type Listed = { slug: string; title: string };

/** Full pilot copy and assets are preview-only; theme mapping stays available for live catalog layout. */
export function editorialOf(experience: Pick<Listed, "slug">, pilotPreview = false): Editorial | null {
  const entry = EDITORIAL[experience.slug];
  if (!entry) return null;
  return pilotPreview ? entry : { theme: entry.theme };
}

/** The editorial theme of one experience, or null when its slug is not listed. */
export function themeOf(experience: Pick<Listed, "slug">): Theme | null {
  return EDITORIAL[experience.slug]?.theme ?? null;
}

/** "Kamakura Community Dinner with Locals" → "Kamakura Community Dinner". */
export function shortTitle(title: string, max = 32): string {
  const text = title.trim();
  const cut = /\s(?:with|in|at|and)\s/i.exec(text);
  const head = cut && cut.index >= 6 ? text.slice(0, cut.index) : text;
  if (head.length <= max) return head;
  const space = head.lastIndexOf(" ", max - 1);
  return `${head.slice(0, space > 0 ? space : max - 1).trimEnd()}…`;
}

/** The pilot's short name in its preview, or the title cut at its first connecting word. */
export function shortName(experience: Listed, pilotPreview = false): string {
  return (pilotPreview ? EDITORIAL[experience.slug]?.short : undefined) ?? shortTitle(experience.title);
}

/** "Food, coffee, Zen, mending and calligraphy." when every listed experience has a theme; otherwise null. */
export function topicsLine(items: Pick<Listed, "slug">[]): string | null {
  const topics: string[] = [];
  for (const item of items) {
    const theme = themeOf(item);
    if (!theme) return null;
    if (!topics.includes(theme.topic)) topics.push(theme.topic);
  }
  if (!topics.length) return null;
  const list = topics.length === 1 ? topics[0]! : `${topics.slice(0, -1).join(", ")} and ${topics.at(-1)}`;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}.`;
}

export type ThemeEntry = { key: string; icon: HandIconName; label: string; slug: string };

/** One entry per listed theme, in catalog order, each linking to its experience. */
export function themeEntries(items: Listed[]): ThemeEntry[] {
  const seen = new Set<string>();
  const entries: ThemeEntry[] = [];
  for (const item of items) {
    const theme = themeOf(item);
    if (!theme || seen.has(theme.key)) continue;
    seen.add(theme.key);
    entries.push({ key: theme.key, icon: theme.icon, label: theme.label, slug: item.slug });
  }
  return entries;
}

const ICON_KEYWORDS: [RegExp, HandIconName][] = [
  [/long table|\btable\b|sit down and eat/i, "table"],
  [/\bcook|dish|dinner|meal|kitchen|menu|recipe|tempura|soup/i, "bowl"],
  [/coffee|\bbeans?\b|\broast/i, "bean"],
  [/\bzen\b|zazen|meditat|priest|temple/i, "enso"],
  [/\bmend|repair|ceramic|kintsugi|pottery|\bbowl\b|\bcup\b/i, "mend"],
  [/\bbrush|kanji|calligraph|\bink\b|stroke/i, "brush"],
  [/talk|chat|conversation|introduc|hello|welcome|english|japanese|language/i, "chat"],
  [/\bgroup|guests|people|neighbou?rs|residents|\bhosts?\b/i, "people"],
  [/station|\btrain\b|walk|head back/i, "train"],
  [/take home|wrap|pack|bag/i, "house"],
];

/** Picks a decorative hand-drawn icon from the words of a highlight or timeline step (never shown as a theme or filter). */
export function iconForText(text: string, fallback: HandIconName = "check"): HandIconName {
  return ICON_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1] ?? fallback;
}
