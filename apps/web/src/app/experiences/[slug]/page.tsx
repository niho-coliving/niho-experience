import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/Analytics";
import { BookingCard, MobileBookingBar, type BookingSummary } from "@/components/DetailBooking";
import { AllPhotosButton, MobileGallery } from "@/components/DetailGallery";
import { FaceBadge } from "@/components/Face";
import { HandIcon, RubberStamp, type HandIconName } from "@/components/HandIcon";
import { JsonLd } from "@/components/JsonLd";
import { Photo, SampleTag } from "@/components/Photo";
import { Notice, Pill } from "@/components/ui";
import { getExperienceForSite } from "@/lib/api";
import { faceOf, groupSizeLabel, hostNames, initialOf } from "@/lib/card-model";
import { config, isPreview, previewListingLabel } from "@/lib/config";
import { imageAlt } from "@/lib/experience-copy";
import type { ExperienceDetailForSite, PublicImageForSite } from "@/lib/experience-types";
import type { SearchParams } from "@/lib/filters";
import { formatDuration, formatYen } from "@/lib/format";
import { safeHttpsUrl } from "@/lib/safe-url";
import { addMinutesToClock, formatClock, scheduleLine, scheduleSummary } from "@/lib/schedule";
import { seoDescription } from "@/lib/seo-description";
import { breadcrumbJsonLd, experienceJsonLd } from "@/lib/structured-data";
import { iconForText } from "@/lib/themes";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };
async function readExperience(slug: string, query: SearchParams) {
  const result = await getExperienceForSite(slug, query);
  if (!result.ok) {
    if (result.kind === "not_found") notFound();
    throw new Error("Public experience unavailable");
  }
  return result.data.experience;
}
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const e = await readExperience((await params).slug, await searchParams);
  const description = seoDescription(e.lead);
  // The public image DTO has no rights/OG approval flag. Do not publish a
  // provisional image as a share image until approved photos are available.
  return { title: e.title, description, alternates: { canonical: e.canonicalUrl }, openGraph: { title: e.title, description, images: [] } };
}

/** Cover first, then the other photos, without repeating the cover. */
function galleryPhotos(e: ExperienceDetailForSite): PublicImageForSite[] {
  const seen = new Set<string>();
  return [e.cover, ...e.photos].filter((photo): photo is PublicImageForSite => {
    if (!photo || seen.has(photo.url)) return false;
    seen.add(photo.url);
    return true;
  });
}

function durationFact(e: ExperienceDetailForSite): { main: string; sub: string | null } {
  const durations = [...new Set(e.offers.map((offer) => offer.durationMinutes))].sort((a, b) => a - b);
  const main = durations.length ? (durations.length === 1 ? formatDuration(durations[0]!) : `${formatDuration(durations[0]!)}–${formatDuration(durations.at(-1)!)}`) : "Ask your host";
  const first = e.offers[0];
  const sameTimes = first && e.offers.every((offer) => offer.startTime === first.startTime && offer.durationMinutes === first.durationMinutes);
  const sub = first && sameTimes ? `${formatClock(first.startTime)} – ${formatClock(addMinutesToClock(first.startTime, first.durationMinutes))} JST` : first ? "Times vary by option" : null;
  return { main, sub };
}

function childNote(e: ExperienceDetailForSite): { fact: string | null; price: string | null } {
  const children = e.offers.map((offer) => offer.pricing.child).filter((child) => child !== null);
  if (!children.length) return { fact: null, price: null };
  const minAge = Math.min(...children.map((child) => child.minAge));
  const maxAge = Math.max(...children.map((child) => child.maxAge));
  const prices = [...new Set(children.map((child) => child.priceYen))];
  const withAdult = children.every((child) => child.adultRequired);
  return {
    fact: `ages ${minAge}+${withAdult ? " with an adult" : ""}`,
    price: `Children ${minAge}–${maxAge} ${prices.length > 1 ? "from " : ""}${formatYen(Math.min(...prices))}`,
  };
}

function shorten(text: string, max: number): string {
  const clean = text.replace(/\.$/, "");
  if (clean.length <= max) return clean;
  const space = clean.lastIndexOf(" ", max - 1);
  return `${clean.slice(0, space > 0 ? space : max - 1)}…`;
}

/** "2-minute walk from Kamakura Station West Exit." → "2-minute walk" / "from Kamakura Station West Exit". */
function accessFact(accessNote: string, placeName: string): { main: string; sub: string } {
  const split = /^(.{3,24}?)\s+(from .+)$/i.exec(accessNote.replace(/\.$/, ""));
  return split ? { main: split[1]!, sub: shorten(split[2]!, 40) } : { main: shorten(accessNote, 44), sub: placeName };
}

export default async function ExperiencePage({ params, searchParams }: Props) {
  const query = await searchParams;
  const e = await readExperience((await params).slug, query);
  const checkoutCancelled = query.checkout === "cancelled";
  const sellerLegalUrl = safeHttpsUrl(e.seller.legalNoticeUrl);
  // One policy for every option: show it here so travelers see it before choosing a date.
  const firstPolicy = e.offers[0]?.cancellationPolicy;
  const sharedPolicy = firstPolicy && e.offers.every((offer) =>
    offer.cancellationPolicy.code === firstPolicy.code &&
    offer.cancellationPolicy.freeCancellationHoursBefore === firstPolicy.freeCancellationHoursBefore
  ) ? firstPolicy : null;
  const policyTitle = sharedPolicy
    ? sharedPolicy.code === "NONE"
      ? "Non-refundable"
      : `Free cancellation until ${sharedPolicy.freeCancellationHoursBefore} hours before the start`
    : null;
  const photos = galleryPhotos(e);
  const line = scheduleLine(e.offers);
  const duration = durationFact(e);
  const children = childNote(e);
  const group = groupSizeLabel(e.offers);
  const meeting = e.meetingPointDisclosure === "PUBLIC" ? e.meetingPoint : null;
  const exterior = meeting && meeting.exteriorPhotoIndex !== null ? (e.photos[meeting.exteriorPhotoIndex] ?? null) : null;
  const mapUrl = meeting?.mapUrl ? safeHttpsUrl(meeting.mapUrl) : null;
  const paragraphs = e.description.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());
  // Only a host's own photo goes next to their name. A gallery photo may show other people (or sample stock), so it is never used here.
  const hostWithPhoto = e.hosts.find((host) => host.avatar) ?? null;
  const hostPhoto = hostWithPhoto?.avatar ?? null;
  const adultPrices = e.offers.map((offer) => offer.pricing.adultPriceYen);
  const canBook = config.bookingsEnabled && e.booking.checkoutAvailable;
  const approval = e.offers.filter((offer) => offer.acceptanceMode === "APPROVAL").length;

  const assurances: BookingSummary["assurances"] = [];
  if (sharedPolicy) {
    assurances.push({
      icon: "check",
      text: sharedPolicy.code === "NONE" ? "Non-refundable once booked" : `Free cancellation until ${sharedPolicy.freeCancellationHoursBefore} h before`,
    });
  }
  if (approval) {
    assurances.push({
      icon: "people",
      text:
        approval === e.offers.length
          ? "Your hosts confirm each request — you're only charged if they accept"
          : "Some options are confirmed by your hosts — you're only charged if they accept",
    });
  }
  assurances.push({ icon: "mail", text: "No account needed" }, { icon: "card", text: "Secure payment by Stripe" });

  const booking: BookingSummary = {
    slug: e.slug,
    offers: e.offers.map((offer) => ({ id: offer.id, name: offer.name, adultPriceYen: offer.pricing.adultPriceYen })),
    price: adultPrices.length ? formatYen(Math.min(...adultPrices)) : "—",
    priceIsFrom: new Set(adultPrices).size > 1,
    childNote: children.price,
    schedule: scheduleSummary(e.offers),
    canBook,
    assurances,
    preview: isPreview,
    availabilityIsProvisional: isPreview && config.mockCatalog === "pilot",
    nihoWebOrigin: config.nihoWebOrigin,
  };

  const hostFaces = e.hosts.length
    ? e.hosts.map((host) => ({ name: host.displayName, initial: initialOf(host.displayName), image: host.avatar }))
    : [faceOf(e)];

  return (
    // clip (not hidden) keeps the tilted stamp from widening the page without breaking the sticky card and bar.
    <div className="overflow-x-clip">
      <TrackView event="experience_view" props={{ experience: e.slug }} />
      <JsonLd data={breadcrumbJsonLd(config.siteUrl, [{ name: "Home", path: "/" }, { name: "Experiences", path: "/experiences" }, { name: e.title, path: `/experiences/${e.slug}` }])} />
      <JsonLd data={experienceJsonLd(e, config.siteUrl, isPreview)} />

      <MobileGallery photos={photos} title={e.title} preview={isPreview} />

      <div className="container-page">
        <nav aria-label="Breadcrumb" className="hidden pt-7 text-sm text-muted lg:block">
          <Link href="/experiences" className="font-extrabold text-ink hover:underline">
            Experiences
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page">{e.title}</span>
        </nav>
        {checkoutCancelled ? (
          <div className="mt-5">
            <Notice
              tone="info"
              title="Checkout cancelled"
              role="status"
              action={
                <Link href={`/experiences/${e.slug}/book`} className="font-bold text-moss underline underline-offset-4">
                  Choose a date
                </Link>
              }
            />
          </div>
        ) : null}

        <header className="pt-5 lg:pt-3.5">
          {line ? <p className="eyebrow">{line}</p> : null}
          {isPreview ? (
            <p className="mt-2">
              <Pill tone="sample">{previewListingLabel}</Pill>
            </p>
          ) : null}
          <h1 className="mt-1.5 text-[2.125rem] leading-[1.1] lg:max-w-[20ch] lg:text-[3.25rem]">{e.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[0.9375rem] text-ink-soft">
            <span className="flex">
              {hostFaces.map((face, index) => (
                <FaceBadge key={`${face.name}-${index}`} face={face} className={`size-[38px] rounded-full border-2 border-white text-sm ${index ? "-ml-2.5" : ""}`} sizes="38px" />
              ))}
            </span>
            <span>
              Hosted by <b className="text-ink">{hostNames(e)}</b>
              {e.hosts.length ? <> {e.provider.kind === "SPOT" ? "at" : "of"} {e.provider.name}</> : null}
            </span>
          </div>
          <ul className="mt-[18px] grid grid-cols-2 gap-x-3 gap-y-4 border-y border-line py-[18px] lg:mt-[22px] lg:flex lg:flex-wrap lg:gap-x-9 lg:border-0 lg:py-0">
            <Fact icon="clock" label="Duration" main={duration.main} sub={duration.sub} />
            <Fact icon="chat" label="Language" main={e.languageNote} />
            {group ? <Fact icon="people" label="Group size" main={group} sub={children.fact} /> : null}
            {meeting?.accessNote ? <Fact icon="train" label="Getting there" {...accessFact(meeting.accessNote, meeting.name)} /> : null}
          </ul>
        </header>

        <DesktopGallery photos={photos} title={e.title} preview={isPreview} />

        <div className="grid gap-10 pt-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-[72px] lg:pt-4">
          <div className="min-w-0">
            <section className="pt-6" aria-label="Overview">
              <p className="text-lg leading-relaxed">{e.lead}</p>
              {e.highlights.length ? (
                <ul className="mt-6 grid gap-3.5">
                  {e.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-3.5">
                      <HandIcon name={iconForText(item)} className="size-10" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <Section title="What you'll do">
              <div className="space-y-4">
                {paragraphs.slice(0, 2).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              {paragraphs.length > 2 ? (
                <details className="group mt-4">
                  <summary className="link-leaf w-max cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Read more</span>
                    <span className="hidden group-open:inline">Show less</span>
                  </summary>
                  <div className="mt-4 space-y-4">
                    {paragraphs.slice(2).map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              ) : null}
            </Section>

            {e.timeline.length ? (
              <Section title="How the time flows">
                <ol>
                  {e.timeline.map((step, i) => {
                    const photo = step.photoIndex !== null ? (e.photos[step.photoIndex] ?? null) : null;
                    return (
                      <li key={i} className="relative grid grid-cols-[96px_1fr] gap-4 pb-[22px] lg:grid-cols-[130px_1fr] lg:gap-[22px]">
                        {i < e.timeline.length - 1 ? (
                          <span aria-hidden className="absolute top-[102px] bottom-1 left-12 border-l-2 border-dashed border-line-strong lg:top-[136px] lg:left-[65px]" />
                        ) : null}
                        {photo ? (
                          <Photo image={photo} alt={imageAlt(photo, `${e.title}, ${step.title}`)} aspect="" rounded="rounded-[18px]" className="size-24 lg:size-[130px]" sizes="130px" />
                        ) : (
                          <span className="grid size-24 place-items-center rounded-[18px] bg-sand lg:size-[130px]">
                            <HandIcon name={iconForText(`${step.title} ${step.text}`, "clock")} className="size-[42px]" />
                          </span>
                        )}
                        <div>
                          {step.time ? <p className="hand text-[1.5625rem]">{formatClock(step.time)}</p> : null}
                          <h3 className="mt-1 font-sans text-[1.0625rem] leading-snug font-extrabold tracking-normal">{step.title}</h3>
                          <p className="mt-0.5 text-[0.9375rem] text-ink-soft">{step.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Section>
            ) : null}

            <Section title={e.hosts.length > 1 ? "Your hosts" : "Your host"}>
              <div className={`grid items-center gap-[30px] sm:gap-10 ${hostPhoto ? "sm:grid-cols-[300px_1fr]" : "sm:grid-cols-[140px_1fr]"}`}>
                {hostPhoto ? (
                  <div className="postage aspect-[5/4] w-[min(100%,320px)] justify-self-center">
                    <div className="postage-paper [--pad:11px]">
                      <Photo image={hostPhoto} alt={imageAlt(hostPhoto, hostWithPhoto?.displayName ?? e.provider.name)} aspect="" rounded="" className="h-full w-full" sampleTag={isPreview} sizes="320px" />
                    </div>
                    <RubberStamp className="absolute -right-3 -bottom-[26px] size-[100px] -rotate-[14deg] text-moss" />
                  </div>
                ) : (
                  <RubberStamp className="size-[132px] -rotate-[10deg] justify-self-center text-moss sm:justify-self-start" />
                )}
                <div>
                  {e.provider.tagline ? <p className="hand text-[1.8125rem] leading-[1.12]">“{e.provider.tagline}”</p> : null}
                  <p className="mt-3 text-ink-soft">
                    Offered by <strong className="text-ink">{e.provider.name}</strong>.
                  </p>
                  {e.hosts.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {e.hosts.map((host) => (
                        <li key={host.displayName} className="flex items-center gap-2 rounded-full bg-sand py-1 pr-3.5 pl-1 text-sm font-extrabold">
                          <FaceBadge face={{ name: host.displayName, initial: initialOf(host.displayName), image: host.avatar }} className="size-8 rounded-full text-[0.8125rem]" sizes="32px" />
                          {host.displayName}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </Section>

            <Section title="What's included">
              <div className="grid gap-[26px] sm:grid-cols-2">
                <IconList title="Included" items={e.included} icon="check" iconClass="text-moss" />
                <IconList title="Not included" items={e.notIncluded} icon="cross" iconClass="text-muted" />
              </div>
            </Section>

            <Section title="Where you'll meet">
              {meeting ? (
                <div className={`grid items-start gap-5 ${exterior ? "sm:grid-cols-[200px_1fr] sm:gap-7" : ""}`}>
                  {exterior ? (
                    <div className="arch relative aspect-[3/4] w-[190px] sm:w-[200px]">
                      <Photo image={exterior} alt={imageAlt(exterior, `${meeting.name} from outside`)} aspect="" rounded="" className="h-full w-full" sizes="200px" />
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[1.0625rem] font-extrabold">{meeting.name}</p>
                    {meeting.address ? <p className="mt-1.5 text-[0.96875rem] text-ink-soft">{meeting.address}</p> : null}
                    {meeting.accessNote ? (
                      <p className="mt-3 flex items-center gap-2 font-extrabold">
                        <HandIcon name="train" className="size-[30px]" />
                        {meeting.accessNote}
                      </p>
                    ) : null}
                    {meeting.entranceNote ? <p className="mt-1.5 text-[0.96875rem] text-ink-soft">{meeting.entranceNote}</p> : null}
                    {mapUrl ? (
                      <a href={mapUrl} rel="noopener noreferrer" className="link-leaf mt-3.5 inline-block text-[0.9375rem]">
                        Open in Maps
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="flex items-center gap-2">
                  <HandIcon name="pin" className="size-7 text-moss" />
                  The meeting point is shared after your booking is confirmed.
                </p>
              )}
            </Section>

            {e.knowBeforeYouGo.length || e.notSuitableFor.length ? (
              <Section title="Good to know">
                {e.knowBeforeYouGo.length ? (
                  <>
                    <DotList items={e.knowBeforeYouGo.slice(0, 3)} />
                    {e.knowBeforeYouGo.length > 3 ? (
                      <details className="group mt-3">
                        <summary className="link-leaf w-max cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">Show all {e.knowBeforeYouGo.length}</span>
                          <span className="hidden group-open:inline">Show fewer</span>
                        </summary>
                        <div className="mt-3">
                          <DotList items={e.knowBeforeYouGo.slice(3)} />
                        </div>
                      </details>
                    ) : null}
                  </>
                ) : null}
                {e.notSuitableFor.length ? (
                  <div className="mt-[26px]">
                    <IconList title="Not suitable for" items={e.notSuitableFor} icon="cross" iconClass="text-muted" />
                  </div>
                ) : null}
              </Section>
            ) : null}

            <Section title="Cancellation">
              {sharedPolicy ? (
                <div className="flex items-start gap-3.5 rounded-[22px] bg-sand p-5">
                  <HandIcon name="umbrella" className="size-[38px] text-moss" />
                  <div>
                    <p className="text-[1.0625rem] font-extrabold">{policyTitle}</p>
                    <p className="mt-1 text-[0.9375rem] text-ink-soft">This policy applies to the option and date you select.</p>
                  </div>
                </div>
              ) : (
                <p>Choose an option to see its cancellation policy before checkout.</p>
              )}
              <p className="mt-3.5 text-sm text-muted">
                Sold by <strong className="text-ink">{e.seller.displayName}</strong>
                {sellerLegalUrl ? (
                  <>
                    {" · "}
                    <a href={sellerLegalUrl} className="font-extrabold text-ink underline" rel="noopener noreferrer">
                      Seller information
                    </a>
                  </>
                ) : null}
              </p>
            </Section>
          </div>

          <aside id="book" aria-labelledby="book-heading" className="hidden lg:sticky lg:top-[88px] lg:block lg:self-start lg:pt-12">
            <BookingCard summary={booking} />
          </aside>
        </div>
      </div>

      <MobileBookingBar summary={booking} />
    </div>
  );
}

/** Desktop: the cover and up to four more photos, with every photo one click away. */
function DesktopGallery({ photos, title, preview }: { photos: PublicImageForSite[]; title: string; preview: boolean }) {
  if (!photos.length) return null;
  const [cover, ...rest] = photos;
  const small = rest.slice(0, 4);
  const columns = small.length >= 3 ? "grid-cols-[2fr_1fr_1fr]" : small.length ? "grid-cols-[2fr_1fr]" : "grid-cols-1";
  return (
    <div className={`relative mt-7 hidden h-[466px] grid-rows-2 gap-1.5 overflow-hidden rounded-3xl lg:grid ${columns}`} role="group" aria-label="Experience photos">
      <Photo image={cover ?? null} alt={imageAlt(cover ?? null, title)} priority aspect="" rounded="" className="row-span-2 h-full" sizes="(min-width: 64rem) 780px, 100vw" />
      {small.map((photo, i) => (
        <Photo
          key={`${photo.url}-${i}`}
          image={photo}
          alt={imageAlt(photo, `${title}, photo ${i + 2} of ${photos.length}`)}
          aspect=""
          rounded=""
          className={`h-full min-h-0 ${small.length === 1 ? "row-span-2" : small.length === 3 && i === 2 ? "col-span-2" : ""}`}
          sizes="(min-width: 64rem) 300px, 50vw"
        />
      ))}
      {preview ? <SampleTag className="bottom-4 left-4" /> : null}
      {photos.length > 1 ? <AllPhotosButton photos={photos} title={title} preview={preview} /> : null}
    </div>
  );
}

function Fact({ icon, label, main, sub = null }: { icon: HandIconName; label: string; main: string; sub?: string | null }) {
  return (
    <li className="flex items-center gap-2.5 text-[0.9375rem] leading-tight font-extrabold">
      <HandIcon name={icon} className="size-8" />
      <div>
        <span className="sr-only">{label}: </span>
        {main}
        {sub ? <small className="block text-[0.78125rem] font-bold text-muted">{sub}</small> : null}
      </div>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-12">
      <h2 className="mb-[18px] text-[1.75rem] lg:text-[2rem]">{title}</h2>
      {children}
    </section>
  );
}

function IconList({ title, items, icon, iconClass }: { title: string; items: string[]; icon: HandIconName; iconClass: string }) {
  return (
    <div>
      <h3 className="mb-3 font-sans text-sm font-extrabold tracking-[0.04em] text-muted uppercase">{title}</h3>
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <HandIcon name={icon} className={`mt-px size-[26px] ${iconClass}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">None listed.</p>
      )}
    </div>
  );
}

function DotList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 text-ink-soft">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className="mt-[0.6em] size-[7px] shrink-0 rounded-full bg-leaf" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
