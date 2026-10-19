import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { describeMockQuote } from "@niho-experience/api-client/mock";
import { ButtonLink, Notice } from "@/components/ui";
import { isPreview } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";
import { formatYen, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mock payment", robots: { index: false, follow: false } };

/** Stands in for Stripe Checkout in the preview only. Takes no card details. */
export default async function MockCheckoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (!isPreview) notFound();
  const query = await searchParams;
  const quote = typeof query.quote === "string" ? describeMockQuote(query.quote) : null;
  if (!quote) notFound();
  const back = new URLSearchParams({ experience: quote.slug, slot: quote.slotId, guests: String(quote.guests) });

  return (
    <div className="container-page max-w-xl py-12">
      <p className="eyebrow">Preview only</p>
      <h1 className="mt-2 text-3xl">Mock payment page</h1>
      <div className="mt-6">
        <Notice tone="warn" title="This is not a real payment">
          <p>On the live site, guests pay on Stripe&apos;s hosted Checkout page for the seller. Here you can choose what happens next.</p>
        </Notice>
      </div>
      <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <p className="font-bold">{quote.title}</p>
        <p className="text-ink-soft">
          {pluralize(quote.guests, "guest")} · {formatYen({ amount: quote.total, currency: "JPY" })}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={`/booking/return?result=success&experience=${quote.slug}`}>Simulate completed payment</ButtonLink>
        <ButtonLink href={`/booking/return?result=cancelled&${back}`} variant="secondary">
          Simulate cancel
        </ButtonLink>
      </div>
    </div>
  );
}
