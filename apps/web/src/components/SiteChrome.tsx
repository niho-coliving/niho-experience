import Link from "next/link";
import { EXPERIENCE_API_CONTRACT } from "@niho-experience/api-client";
import { RubberStamp } from "./HandIcon";

/** One thin line: synthetic data is invented, pilot data is real but provisional. Nothing here is bookable for real. */
export function PreviewBanner({ catalog = "synthetic" }: { catalog?: "synthetic" | "pilot" }) {
  return (
    <div role="note" className="bg-ink px-4 py-1.5 text-center text-[0.8125rem] leading-snug text-white/85">
      {catalog === "pilot" ? (
        <>
          <strong className="text-white">Preview</strong> · real hosts; dates, prices and photos are provisional · nothing can be booked
        </>
      ) : (
        <>
          <strong className="text-white">Preview with sample data</strong> · hosts, dates and prices are invented · nothing can be booked
        </>
      )}{" "}
      <span className="whitespace-nowrap text-white/70">
        · API contract {EXPERIENCE_API_CONTRACT.version} ({EXPERIENCE_API_CONTRACT.status})
      </span>
    </div>
  );
}

export function SiteHeader({ brandLabel, exploreLabel = "Experiences", hostLabel }: { brandLabel?: string; exploreLabel?: string; hostLabel?: string } = {}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md backdrop-saturate-[1.2]">
      <div className="container-page flex h-16 items-center gap-1.5">
        <Link href="/" className="flex shrink-0 items-baseline gap-1.5 font-display text-xl font-semibold tracking-[-0.01em]">
          {brandLabel ? <span>{brandLabel}</span> : <><span>NIHO</span><span className="font-normal text-ink-soft max-[359px]:sr-only">Experience</span></>}
        </Link>
        <nav aria-label="Main" className="ml-auto">
          <ul className="flex items-center gap-0.5 text-[0.9375rem] font-bold sm:gap-1">
            <li>
              <Link href="/experiences" className="rounded-full px-2.5 py-2 hover:bg-sand sm:px-3">
                {exploreLabel}
              </Link>
            </li>
            <li className="hidden sm:block">
              <Link href="/host" className="rounded-full px-3 py-2 hover:bg-sand">
                {hostLabel || "Host with NIHO"}
              </Link>
            </li>
          </ul>
        </nav>
        {/* A statement, not a control: the site is in English and prices are in yen. */}
        <p className="shrink-0 rounded-full border border-line-strong px-2.5 py-1 text-[0.8125rem] font-extrabold whitespace-nowrap">
          <span aria-hidden>EN · ¥</span>
          <span className="sr-only">In English, prices in Japanese yen</span>
        </p>
      </div>
    </header>
  );
}

export function SiteFooter({ description = "Small experiences hosted by people who live in Kamakura. Made by NIHO, a shared living room in the neighborhood.", copyright }: { description?: string; copyright?: string } = {}) {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-8 pt-11 pb-14 sm:grid-cols-[2fr_1fr_auto] sm:items-start">
        <div className="max-w-md">
          <p className="font-display text-xl font-semibold">NIHO Experience</p>
          <p className="mt-2 text-sm text-muted">
            {description}
          </p>
          {copyright ? <p className="mt-2 text-sm text-muted">{copyright}</p> : null}
        </div>
        <nav aria-label="Footer">
          <ul className="grid gap-2 text-sm font-bold">
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
        <RubberStamp className="size-[104px] rotate-[10deg] text-moss" />
      </div>
    </footer>
  );
}
