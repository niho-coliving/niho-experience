import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ExperienceDetail, Slot } from "@niho-experience/api-client";
import { JsonLd } from "@/components/JsonLd";
import { Photo } from "@/components/Photo";
import { PolicyDetails } from "@/components/Policy";
import { SlotPicker } from "@/components/SlotPicker";
import { Notice, Pill } from "@/components/ui";
import { getApi } from "@/lib/api";
import { config } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";
import { formatDuration, formatLanguages, formatYen, unitLabel } from "@/lib/format";
import { breadcrumbJsonLd, experienceJsonLd } from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = await getApi(await searchParams).getExperience(slug);
  if (!e) return { title: "Experience not found" };
  return {
    title: e.title,
    description: e.summary,
    alternates: { canonical: `${config.siteUrl}/experiences/${e.slug}` },
    openGraph: {
      type: "website",
      url: `${config.siteUrl}/experiences/${e.slug}`,
      title: e.title,
      description: e.summary,
      images: e.heroImage.placeholder ? [] : [{ url: e.heroImage.url, width: e.heroImage.width, height: e.heroImage.height, alt: e.heroImage.alt }],
    },
  };
}

export default async function ExperiencePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const api = getApi(await searchParams);
  const e = await api.getExperience(slug);
  if (!e) notFound();
  const { slots } = await api.getSlots(e.id);
  const status = e.availability.status;

  return (
    <div className="pb-28 lg:pb-0">
      <JsonLd
        data={breadcrumbJsonLd(config.siteUrl, [
          { name: "Experiences", path: "/experiences" },
          { name: e.title, path: `/experiences/${e.slug}` },
        ])}
      />
      <JsonLd data={experienceJsonLd(e, config.siteUrl)} />
      <div className="container-page pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/experiences" className="font-bold text-moss hover:underline">
                Experiences
              </Link>
              <span aria-hidden> / </span>
            </li>
            <li aria-current="page" className="truncate">
              {e.title}
            </li>
          </ol>
        </nav>

        <header className="mt-4 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">{e.themes.map((t) => t.label).join(" · ")}</p>
            {e.synthetic ? <Pill tone="sample">Sample listing</Pill> : null}
          </div>
          <h1 className="text-[2.125rem] leading-tight sm:text-5xl">{e.title}</h1>
          <p className="text-lg text-ink-soft">{e.summary}</p>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:grid-cols-4">
          <Fact label="Duration" value={formatDuration(e.durationMinutes)} />
          <Fact label="Language" value={formatLanguages(e.languages)} />
          <Fact label="Group size" value={`${e.groupSize.min}–${e.groupSize.max} guests`} />
          <Fact label="Price" value={`From ${formatYen(e.price.from)} ${unitLabel(e.price.unit)}`} />
        </dl>

        <Gallery experience={e} />
      </div>

      <div className="container-page mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-12">
          <Section title="What you'll do">
            <div className="space-y-4">
              {e.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {e.highlights.length ? (
              <ul className="mt-6 space-y-2">
                {e.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-leaf" />
                    {h}
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section title="How the time flows">
            <ol className="relative space-y-6 border-l-2 border-line pl-6">
              {e.itinerary.map((step) => (
                <li key={step.title} className="relative">
                  <span aria-hidden className="absolute top-2 -left-[1.95rem] size-3 rounded-full border-2 border-moss bg-canvas" />
                  <p className="font-bold">
                    {step.title}
                    {step.minutes ? <span className="font-normal text-muted"> · {formatDuration(step.minutes)}</span> : null}
                  </p>
                  <p className="text-ink-soft">{step.detail}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={`Meet ${e.host.displayName}`} id="host">
            <div className="flex flex-col gap-5 rounded-[var(--radius-card)] bg-sand p-5 sm:flex-row sm:p-6">
              {e.host.portrait ? (
                <Photo image={e.host.portrait} sizes="128px" aspect="aspect-square" rounded="rounded-full" className="w-24 shrink-0 sm:w-32" label={false} />
              ) : null}
              <div className="min-w-0 space-y-3">
                <p className="font-bold">
                  {e.host.displayName} <span className="font-normal text-muted">· {e.host.role}</span>
                </p>
                {e.host.story.map((p, i) => (
                  <p key={i} className="text-ink-soft">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </Section>

          <div className="grid gap-8 sm:grid-cols-2">
            <ListSection title="Included" items={e.included} mark="✓" />
            <ListSection title="Not included" items={e.notIncluded} mark="–" />
          </div>

          <Section title="Where you'll meet">
            <p>{e.meetingArea.summary}</p>
            {e.meetingArea.nearestStation ? <p className="mt-2 text-ink-soft">Nearest station: {e.meetingArea.nearestStation}</p> : null}
            <p className="mt-2 text-sm text-muted">For the host&apos;s privacy, the exact meeting point is shared by email after booking.</p>
          </Section>

          {e.goodToKnow.length || e.accessibility.length ? (
            <div className="grid gap-8 sm:grid-cols-2">
              <ListSection title="Good to know" items={e.goodToKnow} mark="•" />
              <ListSection title="Accessibility" items={e.accessibility} mark="•" />
            </div>
          ) : null}

          <Section title="Cancellation and weather" id="policy">
            <PolicyDetails policy={e.cancellation} />
            <p className="mt-4 text-sm text-ink-soft">
              Sold by <span className="font-bold text-ink">{e.seller.displayName}</span>. You&apos;ll see the seller, total and terms again before paying.
            </p>
          </Section>
        </div>

        <aside id="book" aria-labelledby="book-heading" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 id="book-heading" className="sr-only">
              Book this experience
            </h2>
            <p className="mb-4">
              <span className="text-sm text-muted">From </span>
              <span className="text-2xl font-extrabold">{formatYen(e.price.from)}</span>
              <span className="text-muted"> {unitLabel(e.price.unit)}</span>
            </p>
            <BookingPanel experience={e} slots={slots} />
          </div>
        </aside>
      </div>

      {status === "bookable" ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <p className="min-w-0 leading-tight">
              <span className="block text-sm text-muted">From</span>
              <span className="font-extrabold">{formatYen(e.price.from)}</span>
              <span className="text-sm text-muted"> {unitLabel(e.price.unit)}</span>
            </p>
            <a href="#book" className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-moss px-5 font-bold text-white">
              Check dates
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BookingPanel({ experience: e, slots }: { experience: ExperienceDetail; slots: Slot[] }) {
  switch (e.availability.status) {
    case "paused":
      return (
        <Notice tone="neutral" title="Bookings are paused">
          This experience isn&apos;t taking bookings right now. <Link href="/experiences" className="font-bold text-moss underline">See other experiences</Link>.
        </Notice>
      );
    case "no_upcoming_dates":
      return (
        <Notice tone="neutral" title="New dates coming soon">
          The host hasn&apos;t opened new dates yet. Please check back later.
        </Notice>
      );
    case "sold_out":
      return (
        <div className="space-y-4">
          <Notice tone="warn" title="All upcoming dates are fully booked">
            The host may add more dates. <Link href="/experiences" className="font-bold text-moss underline">See other experiences</Link>.
          </Notice>
          <SlotPicker slug={e.slug} slots={slots} groupSize={e.groupSize} unit={e.price.unit} />
        </div>
      );
    case "bookable":
      return <SlotPicker slug={e.slug} slots={slots} groupSize={e.groupSize} unit={e.price.unit} />;
  }
}

function Gallery({ experience: e }: { experience: ExperienceDetail }) {
  const extra = e.gallery.slice(0, 2);
  return (
    <div className={`mt-6 grid gap-3 ${extra.length ? "sm:grid-cols-[2fr_1fr]" : ""}`}>
      <Photo image={e.heroImage} priority sizes="(min-width: 64rem) 780px, 100vw" aspect="aspect-[4/3] sm:aspect-[16/10]" />
      {extra.length ? (
        <div className="hidden gap-3 sm:grid">
          {extra.map((img) => (
            <Photo key={img.url} image={img} sizes="380px" aspect="aspect-auto h-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined} className="mb-4 text-2xl sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ListSection({ title, items, mark }: { title: string; items: string[]; mark: string }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden className="w-4 shrink-0 font-bold text-moss">
              {mark}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
