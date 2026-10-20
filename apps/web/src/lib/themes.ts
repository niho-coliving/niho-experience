import type { HandIconName } from "@/components/HandIcon";

/**
 * Editorial shortcuts on the home page (the icon row and the video strips).
 * The public contract has no theme field, and #36 rules out inferring themes
 * from titles, so only the slugs listed here get an entry. They link to the
 * experience and are never used as list filters. Unknown slugs are skipped.
 */

export type ThemeKey = "cook" | "roast" | "sit" | "mend" | "write";

export type Theme = { key: ThemeKey; icon: HandIconName; label: string; verb: string };

const COOK: Theme = { key: "cook", icon: "bowl", label: "Cook & eat", verb: "Cook" };
const ROAST: Theme = { key: "roast", icon: "bean", label: "Roast coffee", verb: "Roast" };
const SIT: Theme = { key: "sit", icon: "enso", label: "Sit zazen", verb: "Sit" };
const MEND: Theme = { key: "mend", icon: "mend", label: "Mend a bowl", verb: "Mend" };
const WRITE: Theme = { key: "write", icon: "brush", label: "Write kanji", verb: "Write" };

const EDITORIAL: Readonly<Record<string, Theme>> = {
  // Pilot (MOCK_CATALOG=pilot)
  "kamakura-community-dinner": COOK,
  "kamakura-coffee-roasting": ROAST,
  "engakuji-zen-meditation": SIT,
  "kamakura-ceramic-mending": MEND,
  "kamakura-calligraphy": WRITE,
  // Synthetic preview catalog
  "home-cooked-dinner-with-locals": COOK,
  "evening-pottery-session": { ...MEND, label: "Make pottery", verb: "Make" },
};

type Listed = { slug: string; title: string };

/** The editorial theme of one experience, or null when its slug is not listed. */
export function themeOf(experience: Pick<Listed, "slug">): Theme | null {
  return EDITORIAL[experience.slug] ?? null;
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
