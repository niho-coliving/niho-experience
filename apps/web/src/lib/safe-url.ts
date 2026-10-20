export function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/** Operator-configured NIHO support destination; never carry a booking query or token to it. */
export function safeNihoHelpUrl(value: string, nihoWebOrigin: string): string | null {
  const href = safeHttpsUrl(value);
  const origin = safeHttpsUrl(nihoWebOrigin);
  if (!href || !origin) return null;
  const url = new URL(href);
  return url.origin === new URL(origin).origin && !url.search && !url.hash ? href : null;
}
