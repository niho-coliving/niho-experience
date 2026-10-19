import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { Photo } from "@/components/Photo";
import { PolicyDetails } from "@/components/Policy";
import { Notice, Pill } from "@/components/ui";
import { getApi } from "@/lib/api";
import { config, isPreview, previewListingLabel } from "@/lib/config";
import { safeHttpsUrl } from "@/lib/safe-url";
import { seoDescription } from "@/lib/seo-description";
import type { SearchParams } from "@/lib/filters";
import { formatDuration, formatYen } from "@/lib/format";
import { breadcrumbJsonLd, experienceJsonLd } from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };
async function readExperience(slug: string, query: SearchParams) {
  const result = await (await getApi(query)).getExperience(slug);
  if (!result.ok) { if (result.kind === "not_found") notFound(); throw new Error("Public experience unavailable"); }
  return result.data.experience;
}
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const e = await readExperience((await params).slug, await searchParams);
  const description = seoDescription(e.lead);
  // The public image DTO has no rights/OG approval flag. Do not publish a
  // provisional image as a share image until approved photos are available.
  return { title: e.title, description, alternates: { canonical: e.canonicalUrl }, openGraph: { title: e.title, description, images: [] } };
}
export default async function ExperiencePage({ params, searchParams }: Props) {
  const e = await readExperience((await params).slug, await searchParams);
  const sellerLegalUrl = safeHttpsUrl(e.seller.legalNoticeUrl);
  // One policy for every option: show it here so travelers see it before choosing a date.
  const sharedPolicy = e.offers.every((offer) => offer.cancellationPolicy.code === e.offers[0]?.cancellationPolicy.code) ? (e.offers[0]?.cancellationPolicy ?? null) : null;
  return <div className="pb-24 lg:pb-0">
    <TrackView event="experience_view" props={{ experience: e.slug }} />
    <JsonLd data={breadcrumbJsonLd(config.siteUrl, [{ name: "Home", path: "/" }, { name: "Experiences", path: "/experiences" }, { name: e.title, path: `/experiences/${e.slug}` }])} />
    <JsonLd data={experienceJsonLd(e, config.siteUrl, isPreview)} />
    <div className="container-page pt-6"><nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/experiences" className="font-bold text-moss hover:underline">Experiences</Link><span aria-hidden> / </span><span aria-current="page">{e.title}</span></nav>
      <header className="mt-4 max-w-3xl space-y-3"><p className="eyebrow">{e.region.name}</p>{isPreview ? <Pill tone="sample">{previewListingLabel}</Pill> : null}<h1 className="text-[2.125rem] leading-tight sm:text-5xl">{e.title}</h1><p className="text-lg text-ink-soft">{e.lead}</p></header>
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:grid-cols-4"><Fact label="Duration" value={e.offers.length ? formatDuration(e.offers[0]!.durationMinutes) : "Ask host"} /><Fact label="Language" value={e.languageNote} /><Fact label="Provider" value={e.provider.name} /><Fact label="Price" value={e.offers.length ? `From ${formatYen(Math.min(...e.offers.map((o) => o.pricing.adultPriceYen)))} per adult` : "See options"} /></dl>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr]" role="group" aria-label="Experience photos"><Photo image={e.cover} alt={e.title} priority preview={isPreview} sizes="(min-width: 64rem) 780px, 100vw" aspect="aspect-[4/3] sm:aspect-[16/10]" className="sm:col-span-2 lg:col-span-1 lg:row-span-2" />{e.photos.slice(1, 3).map((photo, index) => <Photo key={`${photo.url}-${index}`} image={photo} alt={`${e.title}, another view ${index + 2}`} preview={isPreview} sizes="(min-width: 64rem) 380px, 50vw" aspect="aspect-[4/3] sm:aspect-[16/10]" />)}</div>
    </div>
    <div className="container-page mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem]"><div className="min-w-0 space-y-10">
      <Section title="What you'll do"><div className="space-y-4">{e.description.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>{e.highlights.length ? <List items={e.highlights} /> : null}</Section>
      {e.timeline.length ? <Section title="How the time flows"><ol className="space-y-4 border-l-2 border-line pl-6">{e.timeline.map((step, i) => <li key={i}><p className="font-bold">{step.time ? `${step.time} · ` : ""}{step.title}</p><p className="text-ink-soft">{step.text}</p></li>)}</ol></Section> : null}
      <Section title="The people behind the experience"><p className="text-ink-soft">Offered by <strong className="text-ink">{e.provider.name}</strong>{e.provider.tagline ? ` — ${e.provider.tagline}` : "."}</p>{e.hosts.length ? <><h3 className="mt-5 text-lg">{e.hosts.length > 1 ? "Your hosts" : "Your host"}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{e.hosts.map((host) => <div key={host.displayName} className="flex items-center gap-3 rounded-xl bg-sand p-4">{host.avatar ? <Photo image={host.avatar} alt={host.displayName} sizes="64px" rounded="rounded-full" aspect="aspect-square" className="size-16 shrink-0" /> : null}<p className="font-bold">{host.displayName}</p></div>)}</div></> : null}</Section>
      <div className="grid gap-8 sm:grid-cols-2"><Section title="Included"><List items={e.included} /></Section><Section title="Not included"><List items={e.notIncluded} /></Section></div>
      <Section title="Where you'll meet">{e.meetingPointDisclosure === "PUBLIC" && e.meetingPoint ? <><p>{e.meetingPoint.name}</p>{e.meetingPoint.address ? <p className="text-ink-soft">{e.meetingPoint.address}</p> : null}{e.meetingPoint.accessNote ? <p className="text-ink-soft">{e.meetingPoint.accessNote}</p> : null}</> : <p>The meeting point is shared after your booking is confirmed.</p>}</Section>
      {e.knowBeforeYouGo.length ? <Section title="Good to know"><List items={e.knowBeforeYouGo} /></Section> : null}
      {e.notSuitableFor.length ? <Section title="Not suitable for"><List items={e.notSuitableFor} /></Section> : null}
      <Section title="Cancellation terms">{sharedPolicy ? <PolicyDetails policy={sharedPolicy} /> : <p>Choose an option to see its cancellation policy before checkout.</p>}<p className="mt-3 text-sm">Sold by <strong>{e.seller.displayName}</strong>. {sellerLegalUrl ? <a href={sellerLegalUrl} className="font-bold text-moss underline" rel="noopener noreferrer">Seller information</a> : null}</p></Section>
    </div><aside id="book" aria-labelledby="book-heading" className="lg:sticky lg:top-24 lg:self-start"><div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)]"><h2 id="book-heading" className="mb-4 text-2xl">Choose your experience</h2>{config.bookingsEnabled && e.booking.checkoutAvailable ? <Link href={`/experiences/${e.slug}/book`} className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-moss px-5 font-bold text-white">Check dates and book</Link> : <Notice tone="neutral" title="Bookings are paused">Please check back later.</Notice>}</div></aside></div>
  </div>;
}
function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-sm text-muted">{label}</dt><dd className="font-bold">{value}</dd></div>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section><h2 className="mb-4 text-2xl sm:text-3xl">{title}</h2>{children}</section>; }
function List({ items }: { items: string[] }) { return items.length ? <ul className="mt-4 list-disc space-y-2 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-muted">None listed.</p>; }
