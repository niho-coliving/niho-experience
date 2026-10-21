import { HOST_BOOKINGS_PATH, HOST_HOME_PATH, HOST_NAV } from "@/lib/host/routes";

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

/** The query of a location ("a=1" from "/host/bookings?a=1#x"). */
function queryOf(location: string): string {
  const at = location.indexOf("?");
  return at < 0 ? "" : (location.slice(at + 1).split("#", 1)[0] ?? "");
}

/**
 * Sub screens that live in a top page's query instead of a path of their own: one booking
 * of 予約 (`/host/bookings?booking=…`, #90), which keeps the list's state in the same page.
 */
const QUERY_SUB_SCREENS: readonly { path: string; param: string }[] = [{ path: HOST_BOOKINGS_PATH, param: "booking" }];

/**
 * Pages under a menu item, and the sub screens above, get a "‹ 体験" back header on phones
 * instead of the brand header and the bottom tabs. Returns the menu item it leads back to, or
 * null on the five top pages. `search` is the page's query (useSearchParams); without it, the
 * query written in `location` counts.
 */
export function hostBackLink(location: string, search?: string | URLSearchParams | null): { href: string; label: string } | null {
  const path = pathOf(location);
  for (const item of HOST_NAV) {
    if (item.href !== HOST_HOME_PATH && path.startsWith(`${item.href}/`)) return { href: item.href, label: item.label };
  }
  const query = new URLSearchParams(search ?? queryOf(location));
  for (const sub of QUERY_SUB_SCREENS) {
    const item = HOST_NAV.find((candidate) => candidate.href === sub.path);
    if (item && path === sub.path && query.get(sub.param)) return { href: item.href, label: item.label };
  }
  return null;
}
