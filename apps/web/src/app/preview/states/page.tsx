import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ApiErrorCode, AvailabilityStatus, ExperienceSummary } from "@niho-experience/api-client";
import { MOCK_CHECKOUT_TRIGGERS } from "@niho-experience/api-client/mock";
import { ExperienceCard, ExperienceGridSkeleton } from "@/components/ExperienceCard";
import { EmptyResults, bookingsPausedCopy, problemCopy } from "@/components/States";
import { Notice, SectionHeading } from "@/components/ui";
import { getApi } from "@/lib/api";
import { isPreview } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Design states (preview)", robots: { index: false, follow: false } };

const STATUSES: AvailabilityStatus[] = ["bookable", "sold_out", "no_upcoming_dates", "paused"];

/** One page to review every designed state on a phone. Preview builds only. */
export default async function StatesPage() {
  if (!isPreview) notFound();
  const { items } = await getApi().getCatalog({});
  const base = items[0]!;
  const variants: ExperienceSummary[] = STATUSES.map((status) => ({
    ...base,
    id: `${base.id}-${status}`,
    availability: { status, nextStartsAt: status === "bookable" ? base.availability.nextStartsAt : null },
  }));
  const codes = Object.keys(problemCopy) as ApiErrorCode[];

  return (
    <div className="container-page space-y-16 pt-8">
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">Preview tools</p>
        <h1 className="text-4xl">Designed states</h1>
        <p className="text-ink-soft">Every state the screens can show, with synthetic data. This page does not exist in production.</p>
      </header>

      <section>
        <SectionHeading title="Try a scenario" />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link className="font-bold text-moss underline" href="/experiences?mock=slow">
              Slow API (loading skeleton)
            </Link>
          </li>
          <li>
            <Link className="font-bold text-moss underline" href="/experiences?mock=empty">
              No experiences listed
            </Link>
          </li>
          <li>
            <Link className="font-bold text-moss underline" href="/experiences?mock=error">
              API unavailable
            </Link>
          </li>
          <li>
            <Link className="font-bold text-moss underline" href="/experiences/fish-market-breakfast">
              Fully booked experience
            </Link>
          </li>
          <li>
            <Link className="font-bold text-moss underline" href="/experiences/backyard-indigo-dyeing">
              Bookings paused
            </Link>
          </li>
          <li>
            Checkout failures: book any open date with one of these emails —{" "}
            {Object.entries(MOCK_CHECKOUT_TRIGGERS).map(([email, code], i) => (
              <span key={email}>
                {i ? ", " : ""}
                <code className="rounded bg-sand px-1">{email}</code> ({code})
              </span>
            ))}
          </li>
        </ul>
      </section>

      <section>
        <SectionHeading title="Cards by availability" />
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {variants.map((v) => (
            <li key={v.id}>
              <ExperienceCard experience={v} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading title="Empty list" />
        <div className="grid gap-6 lg:grid-cols-2">
          <EmptyResults clearHref="/experiences" />
          <EmptyResults clearHref={null} />
        </div>
      </section>

      <section>
        <SectionHeading title="Loading" />
        <ExperienceGridSkeleton />
      </section>

      <section>
        <SectionHeading title="Booking problems" />
        <ul className="grid gap-4 md:grid-cols-2">
          <li>
            <Notice tone={bookingsPausedCopy.tone} title={bookingsPausedCopy.title}>
              <p>{bookingsPausedCopy.body}</p>
              <p className="mt-1 font-mono text-xs text-muted">BOOKINGS_ENABLED=false</p>
            </Notice>
          </li>
          {codes.map((code) => (
            <li key={code}>
              <Notice tone={problemCopy[code].tone} title={problemCopy[code].title}>
                <p>{problemCopy[code].body}</p>
                <p className="mt-1 font-mono text-xs text-muted">{code}</p>
              </Notice>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeading title="After payment" />
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link className="font-bold text-moss underline" href="/booking/return?result=success&experience=neighborhood-dinner-table">
              Payment submitted, confirming
            </Link>
          </li>
          <li>
            <Link className="font-bold text-moss underline" href="/booking/return?result=cancelled&experience=neighborhood-dinner-table">
              Payment cancelled
            </Link>
          </li>
          <li>
            <Link className="font-bold text-moss underline" href="/booking/return">
              Unknown result
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
