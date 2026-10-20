import NextImage from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageDocumentContent, blockText } from "@/components/PageDocument";
import { AmbientVideo } from "@/components/AmbientVideo";
import { ExperienceCard, InviteCard } from "@/components/ExperienceCard";
import { FaceBadge } from "@/components/Face";
import { HomeFinder } from "@/components/HomeFinder";
import { HandIcon, RubberStamp, type HandIconName } from "@/components/HandIcon";
import { Photo } from "@/components/Photo";
import { EmptyResults, ErrorState } from "@/components/States";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getApi, listExperiencesForSite } from "@/lib/api";
import { buildCardModels, cardFaceOf, type Face } from "@/lib/card-model";
import { loadDetails } from "@/lib/catalog";
import { config, isPilotPreview, isPreview } from "@/lib/config";
import { upcomingDays } from "@/lib/date-filter";
import type { SearchParams } from "@/lib/filters";
import { scheduleLine } from "@/lib/schedule";
import { BANNER_VIDEO, HERO_PHOTO, HOST_BAND_VIDEO, POSTCARDS, STRIP_VIDEOS, type SiteVideo } from "@/lib/site-media";
import { editorialOf, FEATURED_HOST, FEATURED_STORY, shortName, themeEntries, themeOf, topicsLine, type Theme } from "@/lib/themes";
import type { CardDatesSource } from "@/components/CardDates";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { getPublishedPageDocument } from "@/lib/page-documents";

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

const STEPS: { icon: HandIconName; title: string; body: string }[] = [
  { icon: "cal", title: "Pick a date", body: "See the next dates on every card. Times are Japan time." },
  { icon: "card", title: "Pay securely", body: "Checkout by Stripe in Japanese yen, tax included." },
  { icon: "mail", title: "Meet your hosts", body: "The meeting point and your booking arrive by email." },
];

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedPageDocument("home");
  return document ? { title: document.title } : {};
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const [api, result, document] = await Promise.all([getApi(query), listExperiencesForSite("kamakura", query), getPublishedPageDocument("home")]);
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const summaries = result.ok ? result.data.experiences : [];
  const details = await loadDetails(api, summaries, config.publicApiVersion !== "1.0");
  const cards = buildCardModels(summaries, details, isPilotPreview);
  const listed = summaries.map((summary) => details.get(summary.slug)).filter((detail): detail is ExperienceDetailForSite => Boolean(detail));

  const themes = themeEntries(summaries);
  // Editorial features while their slug is listed (lib/themes.ts); otherwise the data decides.
  const story = isPilotPreview ? (listed.find((experience) => experience.slug === FEATURED_STORY.slug) ?? null) : null;
  const featured = story ? null : (listed.find((experience) => experience.photos.length >= 5) ?? null);
  // One clip per listed theme; the label is the verb and the experience's short name (never a host's name).
  const strips: { theme: Theme; slug: string; name: string; video: SiteVideo }[] = [];
  for (const summary of summaries) {
    const theme = themeOf(summary);
    if (theme && !strips.some((strip) => strip.theme.key === theme.key)) {
      strips.push({ theme, slug: summary.slug, name: shortName(summary, isPilotPreview), video: editorialOf(summary, isPilotPreview)?.video ?? STRIP_VIDEOS[theme.key] });
    }
  }
  const hostFeature =
    (isPilotPreview ? listed.find((experience) => experience.slug === FEATURED_HOST.slug && experience.hosts.length) : null) ??
    listed.find((experience) => experience.provider.kind === "INDIVIDUAL") ??
    null;
  const capacities = listed.flatMap((experience) => experience.offers.map((offer) => offer.capacity));
  const days = upcomingDays(new Date(), 14);
  const cardDates: CardDatesSource = { kind: "read", preview: isPreview, nihoWebOrigin: config.nihoWebOrigin };

  const fallback = (
    <>
      <section className="relative" aria-label="Welcome">
        <div className="relative h-[560px] overflow-hidden bg-[#222] lg:h-[680px]">
          <NextImage
            src={HERO_PHOTO.src}
            alt={HERO_PHOTO.alt}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: HERO_PHOTO.position }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_32%,rgb(0_0_0/0.64)_100%)] lg:bg-[linear-gradient(90deg,rgb(0_0_0/0.42),rgb(0_0_0/0)_62%),linear-gradient(180deg,rgb(0_0_0/0)_40%,rgb(0_0_0/0.5)_100%)]"
          />
          <div className="absolute inset-x-0 bottom-16 z-[2] text-white lg:bottom-[116px]">
            <div className="container-page">
              <h1 className="max-w-[12ch] text-[2.625rem] leading-[1.02] [text-shadow:0_2px_18px_rgb(0_0_0/0.35)] lg:max-w-[13ch] lg:text-[4.875rem]">
                Meet the people who make Kamakura <span className="hand inline-block -rotate-3 text-[1.22em] text-leaf">home</span>
              </h1>
              <p className="mt-3.5 max-w-[30rem] text-[1.0625rem] text-white/90 lg:text-[1.1875rem]">
                Cook, sit, mend and write with people who live here. Small groups, booked in minutes, no account needed.
              </p>
            </div>
          </div>
          <RubberStamp className="absolute top-[18px] right-4 z-[2] size-24 -rotate-12 text-white opacity-90 lg:top-11 lg:right-14 lg:size-[134px]" />
        </div>
        <HomeFinder days={days} />
      </section>

      {themes.length ? (
        <nav aria-label="Themes" className="scrollbar-none flex gap-0.5 overflow-x-auto px-3 pt-9 lg:justify-center lg:gap-7 lg:pt-[88px]">
          {themes.map((theme) => (
            <Link
              key={theme.key}
              href={`/experiences/${theme.slug}`}
              className="flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-[18px] px-1 py-2.5 text-center text-sm leading-tight font-bold text-ink-soft hover:bg-sand"
            >
              <HandIcon name={theme.icon} className="size-[46px] text-ink" />
              {theme.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <section className="container-page pt-14 lg:pt-[88px]" aria-labelledby="home-cards">
        <SectionHeading
          id="home-cards"
          eyebrow={cards.length ? `${numberWord(cards.length)} to choose from` : undefined}
          title={
            <>
              Experiences hosted by <span className="squig">neighbors</span>
            </>
          }
          action={
            cards.length ? (
              <Link href="/experiences" className="link-leaf">
                See all
              </Link>
            ) : null
          }
        />
        {cards.length ? (
          <ul className="scrollbar-none -mx-5 grid snap-x snap-mandatory auto-cols-[80%] grid-flow-col gap-[18px] overflow-x-auto px-5 pt-1 pb-7 sm:-mx-6 sm:auto-cols-[44%] sm:px-6 lg:mx-0 lg:grid-flow-row lg:grid-cols-3 lg:gap-x-7 lg:gap-y-[52px] lg:overflow-visible lg:p-0">
            {cards.map((card, index) => (
              <li key={card.slug} className="snap-center">
                <ExperienceCard card={card} priority={index === 0} dates={cardDates} />
              </li>
            ))}
            <li className="snap-center">
              <InviteCard />
            </li>
          </ul>
        ) : (
          <EmptyResults clearHref={null} />
        )}
      </section>

      {story ? <FeaturedStory experience={story} /> : featured ? <Featured experience={featured} /> : null}

      {strips.length ? (
        <section className="pt-[72px] lg:pt-[104px]" aria-labelledby="strips-heading">
          <div className="relative h-[340px] overflow-hidden bg-[#222] lg:h-[500px]">
            <AmbientVideo video={BANNER_VIDEO} />
            <div aria-hidden className="absolute inset-0 bg-black/35" />
            <h2
              id="strips-heading"
              className="absolute inset-0 z-[1] flex flex-col items-center justify-center px-6 pb-[90px] text-center text-[2.125rem] text-white lg:pb-40 lg:text-[3.625rem]"
            >
              Slow down, you&apos;re among neighbors
              <span className="hand mt-2 block text-[0.86em] text-leaf">
                {strips.length === 1 ? "one small way into Kamakura" : `${numberWord(strips.length)} small ways into Kamakura`}
              </span>
            </h2>
          </div>
          <ul className="scrollbar-none relative z-[2] -mt-[110px] grid snap-x snap-mandatory auto-cols-[46%] grid-flow-col gap-2.5 overflow-x-auto px-5 sm:auto-cols-[30%] lg:mx-auto lg:-mt-[190px] lg:flex lg:max-w-[75rem] lg:justify-center lg:gap-3.5 lg:overflow-visible lg:px-10">
            {strips.map((strip) => (
              <li key={strip.theme.key} className="snap-start lg:w-[calc((100%_-_4*0.875rem)/5)]">
                <Link href={`/experiences/${strip.slug}`} className="relative block aspect-[1/2] overflow-hidden rounded-[20px] bg-[#333] text-white">
                  <AmbientVideo video={strip.video} />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_50%,rgb(0_0_0/0.66))]" />
                  <span className="absolute right-3 bottom-4 left-4 z-[1]">
                    <b className="hand block text-[2.375rem] text-white">{strip.theme.verb}</b>
                    <small className="mt-0.5 block text-[0.8125rem] leading-snug font-bold text-white">{strip.name}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hostFeature ? <HostFeature experience={hostFeature} listed={listed} pilotPreview={isPilotPreview} /> : null}

      {cards.length ? (
        <section className="container-page pt-[72px] lg:pt-[104px]" aria-labelledby="numbers-heading">
          <SectionHeading align="center" eyebrow="why it feels different" title="Small on purpose" id="numbers-heading" />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-11 text-center lg:grid-cols-4">
            <Figure value="2" unit="minutes" note="From Kamakura Station West Exit to the living room door." />
            {capacities.length ? (
              <Figure value={String(Math.max(...capacities))} unit="guests at most" note="Small enough for one table and real conversation." />
            ) : null}
            <Figure
              value={String(cards.length)}
              unit={cards.length === 1 ? "way to start" : "ways to start"}
              note={topicsLine(summaries) ?? "Each one hosted by people who live here."}
            />
            <Figure value="2" unit="languages" note="English and Japanese, often both at the same table." />
          </ul>
        </section>
      ) : null}

      <section className="container-page pt-[72px] lg:pt-[104px]" aria-labelledby="steps-heading">
        <SectionHeading eyebrow="how booking works" title="Simple, in yen, in your inbox" id="steps-heading" />
        <ol className="grid gap-3 lg:grid-cols-3 lg:gap-4">
          {STEPS.map((step) => (
            <li key={step.title} className="flex items-start gap-4 rounded-[22px] bg-sand p-[22px]">
              <HandIcon name={step.icon} className="size-[46px]" />
              <div>
                <b className="block text-[1.0625rem]">{step.title}</b>
                <p className="mt-0.5 text-[0.9375rem] text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-[18px] flex flex-wrap items-center justify-center gap-1 text-center">
          <span className="hand text-[1.5625rem]">no account needed — book as a guest</span>
          <HandIcon name="arrow" className="h-[34px] w-[60px] text-moss" />
        </p>
      </section>

      <section className="pt-[88px]" aria-labelledby="walk-heading">
        <div className="container-page">
          <SectionHeading align="center" eyebrow="make a day of it" title="Kamakura is small. Walk it." id="walk-heading" />
        </div>
        <ul tabIndex={0} aria-label="Places around Kamakura" className="scrollbar-none flex gap-[18px] overflow-x-auto px-5 pt-4 pb-7 lg:justify-center lg:gap-[26px] lg:pt-6">
          {POSTCARDS.map((card) => (
            <li key={card.src} className="w-40 shrink-0 lg:w-45" style={{ transform: `rotate(${card.rotate}deg)` }}>
              <figure>
                <div className="postage postage-sm aspect-[3/4]">
                  <div className="postage-paper">
                    <div className="relative h-full w-full overflow-hidden">
                      <NextImage src={card.src} alt={card.alt} fill unoptimized sizes="180px" className="object-cover" style={{ objectPosition: card.position }} />
                    </div>
                  </div>
                </div>
                <figcaption className="mt-3 text-center font-hand text-2xl leading-[1.1] font-semibold">{card.place}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pt-16" aria-labelledby="host-band-heading">
        <div className="grid items-center gap-7 overflow-hidden rounded-[28px] bg-sand px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-16 lg:py-14">
          <div>
            <p className="eyebrow">for locals</p>
            <h2 id="host-band-heading" className="mt-2 text-[1.875rem] lg:text-[2.625rem]">
              Share what you love about Kamakura
            </h2>
            <p className="mt-3 text-ink-soft">NIHO helps local hosts prepare and take bookings. Start small: one table, one afternoon, a few guests.</p>
            <ButtonLink href="/host" variant="secondary" className="mt-[22px]">
              Learn about hosting
            </ButtonLink>
          </div>
          <div className="arch relative aspect-[3/4] w-[min(100%,260px)] justify-self-center bg-line">
            <AmbientVideo video={HOST_BAND_VIDEO} />
          </div>
        </div>
      </section>
    </>
  );
  return <PageDocumentContent document={document} pageId="home" fallback={fallback} slots={{ ExperienceGrid: (props) => (
    <section className="container-page pt-14 lg:pt-[88px]" aria-label="Experiences">
      <SectionHeading
        eyebrow={cards.length ? `${numberWord(cards.length)} to choose from` : undefined}
        title={blockText(props, "heading", "Experiences hosted by neighbors")}
        action={cards.length ? <Link href="/experiences" className="link-leaf">See all</Link> : null}
      />
      {cards.length ? (
        <ul className={`grid gap-x-6 gap-y-11 sm:grid-cols-2 ${props.columns === "two" ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          {cards.map((card, index) => <li key={card.slug}><ExperienceCard card={card} priority={index === 0} dates={cardDates} /></li>)}
          <li><InviteCard /></li>
        </ul>
      ) : <><EmptyResults clearHref={null} />{props.emptyMessage ? <p>{String(props.emptyMessage)}</p> : null}</>}
    </section>
  ) }} />;
}

/** The editor's feature for the community dinner: words from lib/themes.ts, NIHO's own photos, the schedule from the data. */
function FeaturedStory({ experience: e }: { experience: ExperienceDetailForSite }) {
  const line = scheduleLine(e.offers, { compact: true });
  return (
    <section className="container-page pt-[72px] lg:pt-[104px]" aria-labelledby="featured-heading">
      <div className="grid items-center gap-7 lg:grid-cols-[0.9fr_1.3fr] lg:gap-16">
        <div>
          {line ? <p className="eyebrow">{line}</p> : null}
          <h2 id="featured-heading" className="mt-2 text-[2rem] lg:text-[2.75rem]">
            {FEATURED_STORY.heading}
          </h2>
          <p className="mt-3.5 max-w-[30rem] text-ink-soft">{FEATURED_STORY.body}</p>
          <ButtonLink href={`/experiences/${e.slug}`} variant="secondary" className="mt-[22px]">
            {FEATURED_STORY.cta}
          </ButtonLink>
        </div>
        <div className="grid h-80 grid-cols-[1fr_1fr_1.3fr] grid-rows-2 gap-1 overflow-hidden rounded-[22px] lg:h-[480px]">
          {FEATURED_STORY.photos.map((photo, index) => (
            <div key={photo.src} className={`relative min-h-0 ${index === 2 ? "col-start-3 row-span-2 row-start-1" : ""}`}>
              <NextImage
                src={photo.src}
                alt={photo.alt}
                fill
                unoptimized
                sizes="(min-width: 64rem) 320px, 40vw"
                className="object-cover"
                style={{ objectPosition: photo.position }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Without the editor's feature: the first experience with five or more photos. */
function Featured({ experience: e }: { experience: ExperienceDetailForSite }) {
  const [a, b, c, d, f] = e.photos;
  const line = scheduleLine(e.offers);
  const tile = (image: typeof a, className = "") => (
    <Photo image={image ?? null} alt="" aspect="" rounded="" className={`h-full min-h-0 ${className}`} sizes="(min-width: 64rem) 320px, 40vw" />
  );
  return (
    <section className="container-page pt-[72px] lg:pt-[104px]" aria-labelledby="featured-heading">
      <div className="grid items-center gap-7 lg:grid-cols-[0.9fr_1.3fr] lg:gap-16">
        <div>
          {line ? <p className="eyebrow">{line}</p> : null}
          <h2 id="featured-heading" className="mt-2 text-[2rem] lg:text-[2.75rem]">
            {e.title}
          </h2>
          <p className="mt-3.5 max-w-[30rem] text-ink-soft">{e.lead}</p>
          <ButtonLink href={`/experiences/${e.slug}`} variant="secondary" className="mt-[22px]">
            See details
          </ButtonLink>
        </div>
        <div className="relative grid h-80 grid-cols-[1fr_1fr_1.3fr] grid-rows-2 gap-1 overflow-hidden rounded-[22px] lg:h-[480px]">
          {tile(b)}
          {tile(c)}
          {tile(a, "col-start-3 row-span-2 row-start-1")}
          {tile(d)}
          {tile(f)}
        </div>
      </div>
    </section>
  );
}

/** Hosts with names first (catalog order), then experiences run without named hosts; one face per person. */
function hostRow(listed: ExperienceDetailForSite[], current: ExperienceDetailForSite, pilotPreview: boolean) {
  const rows: { face: Face; slug: string; name: string; current: boolean }[] = [];
  for (const item of [...listed.filter((e) => e.hosts.length), ...listed.filter((e) => !e.hosts.length)]) {
    const face = cardFaceOf(item, pilotPreview);
    if (rows.some((row) => row.face.name === face.name)) continue;
    rows.push({ face, slug: item.slug, name: shortName(item, pilotPreview), current: item.slug === current.slug });
  }
  return rows;
}

function HostFeature({ experience: e, listed, pilotPreview }: { experience: ExperienceDetailForSite; listed: ExperienceDetailForSite[]; pilotPreview: boolean }) {
  const name = e.hosts[0]?.displayName ?? e.provider.name;
  // The editor's words and clip while the featured slug is listed; otherwise the provider's own line and cover.
  const editorial = pilotPreview && e.slug === FEATURED_HOST.slug && e.hosts.length ? FEATURED_HOST : null;
  const faces = hostRow(listed, e, pilotPreview);
  return (
    <section className="mt-[72px] bg-sand pt-16 pb-[76px] lg:mt-[104px] lg:pt-24 lg:pb-[104px]" aria-labelledby="hosts-heading">
      <div className="container-page">
        <SectionHeading align="center" eyebrow="Meet your neighbors" title="The people are the point" id="hosts-heading" />
        <div className="grid items-center gap-11 lg:grid-cols-2 lg:gap-[72px]">
          <div className="postage aspect-[4/5] w-[min(100%,380px)] justify-self-center lg:order-2 lg:w-[min(100%,420px)]">
            <div className="postage-paper">
              {editorial ? (
                <div className="h-full w-full overflow-hidden">
                  <AmbientVideo video={editorial.video} />
                </div>
              ) : (
                <Photo image={e.cover} alt="" aspect="" rounded="" className="h-full w-full" sizes="(min-width: 64rem) 420px, 90vw" />
              )}
            </div>
            <RubberStamp className="absolute -bottom-[30px] -left-6 size-[124px] -rotate-[14deg] text-moss" />
          </div>
          <div>
            <p className="hand text-[3.5rem]">{name}</p>
            {editorial ? (
              <p className="mt-2 font-extrabold text-ink-soft">{editorial.role}</p>
            ) : e.provider.tagline ? (
              <p className="mt-2 font-extrabold text-ink-soft">{e.provider.tagline}</p>
            ) : null}
            <p className="mt-3.5 max-w-[30rem] text-ink-soft">{editorial ? editorial.story : e.lead}</p>
            <ButtonLink href={`/experiences/${e.slug}`} variant="secondary" className="mt-6">
              See {name}&apos;s workshop
            </ButtonLink>
            {faces.length > 1 ? (
              <ul className="mt-7 flex flex-wrap items-center gap-2.5" aria-label="More hosts">
                {faces.map((entry) => (
                  <li key={entry.slug}>
                    <Link href={`/experiences/${entry.slug}`} aria-label={`${entry.face.name}: ${entry.name}`} className="block rounded-full">
                      <FaceBadge
                        face={entry.face}
                        className={`size-[46px] rounded-full border-[3px] text-lg ${entry.current ? "border-leaf" : `border-transparent ${entry.face.image ? "opacity-50 hover:opacity-100" : ""}`}`}
                        sizes="46px"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Figure({ value, unit, note }: { value: string; unit: string; note: string }) {
  return (
    <li>
      <p>
        <b className="block font-display text-[3.875rem] leading-none font-light tracking-[-0.03em] lg:text-[5.5rem]">{value}</b>
        <span className="hand mt-0.5 block text-[1.875rem]">{unit}</span>
      </p>
      <p className="mx-auto mt-2 max-w-[15rem] text-sm leading-[1.6] text-muted">{note}</p>
    </li>
  );
}

