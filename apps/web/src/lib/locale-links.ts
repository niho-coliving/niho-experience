const EXPERIENCE_PATH = /^\/experiences(?:\/[^/?#]+(?:\/book)?)?$/;

/** Routes owned by the public bilingual site. Everything else stays on its authoritative route. */
export function isSupportedPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/host" || pathname === "/help" || pathname === "/booking/return" || EXPERIENCE_PATH.test(pathname);
}

function switchQuery(sourcePath: string, query: string): string {
  const allowed = sourcePath === "/experiences"
    ? new Set(["q", "theme", "date", "guests"])
    : /^\/experiences\/[^/]+(?:\/book)?$/.test(sourcePath)
      ? new Set(["q", "theme", "date", "guests", "offer"])
      : new Set<string>();
  const filtered = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(query)) if (allowed.has(key)) filtered.append(key, value);
  return filtered.toString();
}

export function languageSwitchTarget(pathname: string, query: string, counterparts: Readonly<Record<string, string>>): string | null {
  const sourcePath = pathname === "/ja" || pathname === "/ja/" ? "/" : pathname.startsWith("/ja/") ? pathname.slice(3) : pathname;
  const japanesePath = counterparts[sourcePath];
  if (!japanesePath) return null;
  const isEnglish = pathname === sourcePath;
  const filtered = switchQuery(sourcePath, query);
  return `${isEnglish ? japanesePath : sourcePath}${filtered ? `?${filtered}` : ""}`;
}
