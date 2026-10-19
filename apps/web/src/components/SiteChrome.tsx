import Link from "next/link";
import { EXPERIENCE_API_CONTRACT } from "@niho-experience/api-client";

export function PreviewBanner() {
  return (
    <div role="note" className="bg-ink text-sm text-white">
      <p className="container-page py-2">
        <strong>Preview with sample data.</strong> Hosts, dates and prices are invented and nothing can be booked.{" "}
        <span className="text-white/70">API contract {EXPERIENCE_API_CONTRACT.version} ({EXPERIENCE_API_CONTRACT.status})</span>
      </p>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex shrink-0 items-baseline gap-1 font-display text-lg font-semibold sm:gap-1.5 sm:text-xl">
          <span>NIHO</span>
          <span className="font-normal text-ink-soft max-[359px]:sr-only">Experience</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center text-[0.9375rem] font-bold sm:gap-3">
            <li>
              <Link href="/experiences" className="rounded-full px-2 py-2 hover:bg-sand sm:px-3">
                Experiences
              </Link>
            </li>
            <li>
              <Link href="/host" className="rounded-full px-2 py-2 hover:bg-sand sm:px-3">
                <span className="sm:hidden">Host</span>
                <span className="hidden sm:inline">Host with NIHO</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-sand">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-[2fr_1fr]">
        <div className="max-w-md space-y-2">
          <p className="font-display text-lg font-semibold">NIHO Experience</p>
          <p className="text-sm text-ink-soft">
            Small experiences hosted by people who live in Kamakura. Made by NIHO, a shared living room in the neighborhood.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-2 text-sm font-bold">
            <li>
              <Link href="/experiences" className="hover:underline">
                All experiences
              </Link>
            </li>
            <li>
              <Link href="/host" className="hover:underline">
                Host an experience
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
