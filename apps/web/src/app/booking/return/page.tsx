import type { Metadata } from "next";
import { ButtonLink, Notice } from "@/components/ui";
import { bookingHref, parseSelection } from "@/lib/checkout";
import { config, isPreview } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking status", robots: { index: false, follow: false } };

const SLUG = /^[a-z0-9-]{1,80}$/;

/**
 * Landing page after the hosted payment page. The query string only says
 * where the guest came back from; it never proves a booking. Confirmation
 * comes from NIHO after the payment webhook.
 */
export default async function BookingReturnPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const result = query.result === "cancelled" ? "cancelled" : query.result === "success" ? "submitted" : "unknown";
  const slug = typeof query.experience === "string" && SLUG.test(query.experience) ? query.experience : null;
  const selection = parseSelection(query);

  return (
    <div className="container-page max-w-2xl py-12 sm:py-16">
      {result === "submitted" ? (
        <div className="space-y-6">
          <p className="eyebrow">Payment submitted</p>
          <h1 className="text-3xl sm:text-4xl">Thank you — we&apos;re confirming your booking</h1>
          <Notice role="status" tone="info" title="Your booking is not confirmed yet">
            <p>
              We confirm it once the payment is complete. You&apos;ll get an email with the confirmation and the
              meeting point. If no email arrives, please don&apos;t book again — check your booking status first.
            </p>
          </Notice>
          <div className="flex flex-wrap gap-3">
            {config.nihoBookingHelpUrl ? (
              <a href={config.nihoBookingHelpUrl} className="inline-flex min-h-11 items-center rounded-full bg-moss px-5 font-bold text-white">
                Check booking status on NIHO
              </a>
            ) : isPreview ? (
              <p className="text-sm text-muted">Preview: on the live site this button opens the guest&apos;s booking status page on NIHO.</p>
            ) : null}
            <ButtonLink href="/experiences" variant="secondary">
              Browse more experiences
            </ButtonLink>
          </div>
        </div>
      ) : result === "cancelled" ? (
        <div className="space-y-6">
          <p className="eyebrow">Payment cancelled</p>
          <h1 className="text-3xl sm:text-4xl">No payment was taken</h1>
          <Notice role="status" tone="neutral" title="Your date isn't reserved">
            <p>You left the payment page before paying. You can go back and try again — we&apos;ll check that the date and price are still available.</p>
          </Notice>
          <div className="flex flex-wrap gap-3">
            {slug && selection ? <ButtonLink href={bookingHref(slug, selection.slotId, selection.guests)}>Return to booking</ButtonLink> : null}
            <ButtonLink href={slug ? `/experiences/${slug}` : "/experiences"} variant="secondary">
              {slug ? "Back to the experience" : "Browse experiences"}
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl">We couldn&apos;t tell how your payment went</h1>
          <p className="text-ink-soft">If you paid, you&apos;ll receive a confirmation email from NIHO. Please don&apos;t book again until you&apos;ve checked.</p>
          <ButtonLink href="/experiences" variant="secondary">
            Browse experiences
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
