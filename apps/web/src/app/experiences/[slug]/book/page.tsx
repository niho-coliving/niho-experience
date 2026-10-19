import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ApiErrorCode, ExperienceDetail, Quote } from "@niho-experience/api-client";
import { BookingForm } from "@/components/BookingForm";
import { Photo } from "@/components/Photo";
import { PolicyDetails } from "@/components/Policy";
import { problemAction, problemCopy } from "@/components/States";
import { ButtonLink, Notice, Pill } from "@/components/ui";
import { getApi } from "@/lib/api";
import { bookingHref, parseSelection } from "@/lib/checkout";
import { isPreview } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";
import { formatLongDay, formatTime, formatTimeRange, formatYen, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const api = getApi(query);
  const experience = await api.getExperience(slug);
  if (!experience) notFound();
  const selection = parseSelection(query);
  if (!selection) redirect(`/experiences/${slug}#book`);

  const result = await api.createQuote({ experienceId: experience.id, ...selection });

  return (
    <div className="container-page max-w-5xl pt-6">
      <Link href={`/experiences/${slug}`} className="text-sm font-bold text-moss hover:underline">
        ← Back to {experience.title}
      </Link>
      <h1 className="mt-4 text-3xl sm:text-4xl">Review and book</h1>

      {result.ok ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="order-2 min-w-0 lg:order-1">
            <BookingForm
              slug={slug}
              quoteId={result.quote.id}
              policyVersion={result.quote.cancellation.version}
              idempotencyKey={crypto.randomUUID()}
              reviewHref={bookingHref(slug, selection.slotId, selection.guests)}
              preview={isPreview}
            />
            <section id="terms" className="mt-10 scroll-mt-24">
              <h2 className="mb-3 text-2xl">Cancellation and weather</h2>
              <PolicyDetails policy={result.quote.cancellation} />
            </section>
          </div>
          <aside className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start" aria-label="Booking summary">
            <BookingSummary experience={experience} quote={result.quote} />
          </aside>
        </div>
      ) : (
        <BookingProblem code={result.error.code} slug={slug} />
      )}
    </div>
  );
}

function BookingSummary({ experience: e, quote: q }: { experience: ExperienceDetail; quote: Quote }) {
  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex gap-3">
        <Photo image={e.heroImage} sizes="96px" aspect="aspect-square" rounded="rounded-xl" className="w-20 shrink-0" label={false} />
        <div className="min-w-0">
          <p className="font-bold leading-snug">{e.title}</p>
          <p className="text-sm text-muted">With {e.host.displayName}</p>
          {e.synthetic ? (
            <div className="mt-1">
              <Pill tone="sample">Sample</Pill>
            </div>
          ) : null}
        </div>
      </div>
      <dl className="space-y-2 border-t border-line pt-4 text-[0.9375rem]">
        <Row label="Date" value={formatLongDay(q.startsAt)} />
        <Row label="Time" value={formatTimeRange(q.startsAt, q.endsAt)} />
        <Row label="Guests" value={pluralize(q.guests, "guest")} />
      </dl>
      <dl className="space-y-2 border-t border-line pt-4 text-[0.9375rem]">
        {q.lines.map((l) => (
          <Row
            key={l.label}
            label={l.quantity > 1 ? `${l.label} × ${l.quantity} (${formatYen(l.unitAmount)} each)` : l.label}
            value={formatYen(l.amount)}
          />
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <dt className="font-bold">Total</dt>
          <dd className="text-right">
            <span className="text-2xl font-extrabold">{formatYen(q.total)}</span>
            <span className="block text-sm text-muted">{q.taxIncluded ? "Japanese yen, tax included" : "Japanese yen, before tax"}</span>
          </dd>
        </div>
      </dl>
      <div className="space-y-1 border-t border-line pt-4 text-sm">
        <p>
          <span className="text-muted">Sold by </span>
          <span className="font-bold">{q.seller.displayName}</span>
        </p>
        {q.seller.disclosureUrl ? (
          <a href={q.seller.disclosureUrl} className="font-bold text-moss underline" rel="noopener">
            Seller information
          </a>
        ) : null}
        <p className="text-muted">This price is held until {formatTime(q.expiresAt)} JST.</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}

function BookingProblem({ code, slug }: { code: ApiErrorCode; slug: string }) {
  const copy = problemCopy[code];
  const action = problemAction[code];
  return (
    <div className="mt-8 max-w-2xl">
      <Notice
        role="alert"
        tone={copy.tone}
        title={copy.title}
        action={
          <div className="flex flex-wrap gap-3">
            {action === "browse" ? (
              <ButtonLink href="/experiences">See other experiences</ButtonLink>
            ) : (
              <ButtonLink href={`/experiences/${slug}#book`}>Choose a date</ButtonLink>
            )}
          </div>
        }
      >
        <p>{copy.body}</p>
      </Notice>
    </div>
  );
}
