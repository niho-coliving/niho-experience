import { HOST_HOME_PATH, HOST_NAV } from "@/lib/host/routes";

/** Path only: `?providerId=` (and any other query or hash) never changes which item is selected. */
function pathOf(location: string): string {
  const path = location.split(/[?#]/, 1)[0] ?? "";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** The menu item for a location: its own page and the pages under it (/host/experiences/{id}). */
export function isHostNavActive(location: string, href: string): boolean {
  const path = pathOf(location);
  const target = pathOf(href);
  return path === target || path.startsWith(`${target}/`);
}

/**
 * Pages under a menu item get a "‹ 体験" back header on phones instead of the brand
 * header and the bottom tabs. Returns where it leads, or null on the five top pages.
 */
export function hostBackLink(location: string): { href: string; label: string } | null {
  const path = pathOf(location);
  for (const item of HOST_NAV) {
    if (item.href !== HOST_HOME_PATH && path.startsWith(`${item.href}/`)) return { href: item.href, label: item.label };
  }
  return null;
}
