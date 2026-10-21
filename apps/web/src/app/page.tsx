import Link from "next/link";
import type { Metadata } from "next";
import { EN_STATIC_COPY_V1, HomeViewV1, type DisplayImageV1, type ExperienceCardModelV1, type HomeViewModelV1 } from "@niho/experience-presentation/v1";
import { PageDocumentContent, blockText } from "@/components/PageDocument";
import { ExperienceCard, InviteCard } from "@/components/ExperienceCard";
import { HomeFinder } from "@/components/HomeFinder";
import { EmptyResults, ErrorState } from "@/components/States";
import { SectionHeading } from "@/components/ui";
import { PRESENTATION_PRIMITIVES_V1 } from "@/components/PresentationV1";
import { CardDates, type CardDatesSource } from "@/components/CardDates";
import { getApi, listExperiencesForSite } from "@/lib/api";
import { buildCardModels, cardFaceOf, type CardModel, type Face } from "@/lib/card-model";
import { loadDetails } from "@/lib/catalog";
import { config, isPilotPreview, isPreview } from "@/lib/config";
import { upcomingDays } from "@/lib/date-filter";
import type { SearchParams } from "@/lib/filters";
import { scheduleLine } from "@/lib/schedule";
import { BANNER_VIDEO, HERO_PHOTO, HOST_BAND_VIDEO, POSTCARDS, STRIP_VIDEOS, type SitePhoto, type SiteVideo } from "@/lib/site-media";
import { editorialOf, FEATURED_HOST, FEATURED_STORY, shortName, themeEntries, themeOf, topicsLine, type Theme } from "@/lib/themes";
import type { ExperienceDetailForSite, PublicImageForSite } from "@/lib/experience-types";
import { getPublishedPageDocument } from "@/lib/page-documents";
import { imageAlt } from "@/lib/experience-copy";
import { publicMetadata, SITE_DESCRIPTION } from "@/lib/public-metadata";

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedPageDocument("home");
  return publicMetadata(document?.title ?? "Meet the people of Kamakura", SITE_DESCRIPTION, `${config.siteUrl}/`);
}

const displayPhoto = (photo: SitePhoto): DisplayImageV1 => ({ src: photo.src, alt: photo.alt, position: photo.position });
const displayImage = (image: PublicImageForSite | null, fallback = ""): DisplayImageV1 | null => image ? ({ src: image.url, alt: imageAlt(image, fallback) }) : null;
const displayVideo = (video: SiteVideo) => ({ src: video.src, poster: video.poster });
const displayFace = (face: Face) => ({ ...face, image: displayImage(face.image) });

function cardModel(card: CardModel): ExperienceCardModelV1 {
  return { ...card, href: `/experiences/${card.slug}`, cover: displayImage(card.cover, card.title), face: displayFace(card.face), priceSuffix: " / adult" };
}

function hostRow(listed: ExperienceDetailForSite[], current: ExperienceDetailForSite, pilotPreview: boolean) {
  const rows: { face: Face; slug: string; name: string; current: boolean }[] = [];
  for (const item of [...listed.filter((experience) => experience.hosts.length), ...listed.filter((experience) => !experience.hosts.length)]) {
    const face = cardFaceOf(item, pilotPreview);
    if (rows.some((row) => row.face.name === face.name)) continue;
    rows.push({ face, slug: item.slug, name: shortName(item, pilotPreview), current: item.slug === current.slug });
  }
  return rows;
}

function homeModel(summaries: Parameters<typeof themeEntries>[0], cards: CardModel[], listed: ExperienceDetailForSite[], cardDates: CardDatesSource, days: ReturnType<typeof upcomingDays>): HomeViewModelV1 {
  const themes = themeEntries(summaries);
  const story = isPilotPreview ? (listed.find((experience) => experience.slug === FEATURED_STORY.slug) ?? null) : null;
  const featured = story ? null : (listed.find((experience) => experience.photos.length >= 5) ?? null);
  const strips: { theme: Theme; slug: string; name: string; video: SiteVideo }[] = [];
  for (const summary of summaries) {
    const theme = themeOf(summary);
    if (theme && !strips.some((strip) => strip.theme.key === theme.key)) strips.push({ theme, slug: summary.slug, name: shortName(summary, isPilotPreview), video: editorialOf(summary, isPilotPreview)?.video ?? STRIP_VIDEOS[theme.key] });
  }
  const hostFeature = (isPilotPreview ? listed.find((experience) => experience.slug === FEATURED_HOST.slug && experience.hosts.length) : null) ?? listed.find((experience) => experience.provider.kind === "INDIVIDUAL") ?? null;
  const capacities = listed.flatMap((experience) => experience.offers.map((offer) => offer.capacity));
  const figures: HomeViewModelV1["figures"] = [
    { value: "2", unit: EN_STATIC_COPY_V1.text("home.minutesUnit"), note: EN_STATIC_COPY_V1.text("home.stationNote") },
    ...(capacities.length ? [{ value: String(Math.max(...capacities)), unit: EN_STATIC_COPY_V1.text("home.guestsAtMostUnit"), note: EN_STATIC_COPY_V1.text("home.smallGroupNote") }] : []),
    { value: String(cards.length), unit: EN_STATIC_COPY_V1.text(cards.length === 1 ? "home.wayToStartUnit" : "home.waysToStartUnit"), note: topicsLine(summaries) ?? EN_STATIC_COPY_V1.text("home.hostedNote") },
    { value: "2", unit: EN_STATIC_COPY_V1.text("home.languagesUnit"), note: EN_STATIC_COPY_V1.text("home.languageNote") },
  ];
  const feature = story ? {
    schedule: scheduleLine(story.offers, { compact: true }) ?? undefined, heading: FEATURED_STORY.heading, body: FEATURED_STORY.body, cta: FEATURED_STORY.cta, href: `/experiences/${story.slug}`, photos: FEATURED_STORY.photos.map(displayPhoto),
  } : featured ? {
    schedule: scheduleLine(featured.offers) ?? undefined, heading: featured.title, body: featured.lead, cta: EN_STATIC_COPY_V1.text("home.featureSeeDetails"), href: `/experiences/${featured.slug}`,
    photos: [featured.photos[1], featured.photos[2], featured.photos[0], featured.photos[3], featured.photos[4]].map((photo) => displayImage(photo ?? null)!).filter(Boolean),
  } : undefined;
  const host = hostFeature ? (() => {
    const name = hostFeature.hosts[0]?.displayName ?? hostFeature.provider.name;
    const editorial = isPilotPreview && hostFeature.slug === FEATURED_HOST.slug && hostFeature.hosts.length ? FEATURED_HOST : null;
    return { headingEyebrow: EN_STATIC_COPY_V1.text("home.hostFeatureEyebrow"), headingTitle: EN_STATIC_COPY_V1.text("home.hostFeatureTitle"), moreHostsLabel: EN_STATIC_COPY_V1.text("home.moreHosts"), name, role: editorial?.role ?? hostFeature.provider.tagline ?? undefined, story: editorial?.story ?? hostFeature.lead, cta: EN_STATIC_COPY_V1.text("home.hostFeatureCta", { name }), href: `/experiences/${hostFeature.slug}`, image: editorial ? undefined : (displayImage(hostFeature.cover) ?? undefined), video: editorial ? displayVideo(editorial.video) : undefined, faces: hostRow(listed, hostFeature, isPilotPreview).map((entry) => ({ face: displayFace(entry.face), href: `/experiences/${entry.slug}`, label: entry.name, current: entry.current })) };
  })() : undefined;
  return {
    hero: displayPhoto(HERO_PHOTO), finder: <HomeFinder days={days} />,
    themes: themes.map((theme) => ({ ...theme, href: `/experiences/${theme.slug}` })), cardsEyebrow: cards.length ? EN_STATIC_COPY_V1.text("home.cardsEyebrowCount", { countWord: numberWord(cards.length) }) : undefined,
    cards: cards.map((card) => ({ model: cardModel(card), dates: <CardDates slug={card.slug} scheduleLabel={card.scheduleLabel} source={cardDates} /> })), empty: <EmptyResults clearHref={null} />, feature,
    strips: strips.map((strip) => ({ key: strip.theme.key, href: `/experiences/${strip.slug}`, verb: strip.theme.verb, name: strip.name, video: displayVideo(strip.video) })),
    stripsEyebrow: EN_STATIC_COPY_V1.text(strips.length === 1 ? "home.stripsEyebrowOne" : "home.stripsEyebrowMany", { countWord: numberWord(strips.length) }), banner: displayVideo(BANNER_VIDEO), hostFeature: host, figures,
    postcards: POSTCARDS.map((card) => ({ id: card.src, image: displayPhoto(card), place: card.place, rotate: card.rotate })), hostBand: displayVideo(HOST_BAND_VIDEO),
  };
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const [api, result, document] = await Promise.all([getApi(query), listExperiencesForSite("kamakura", query), getPublishedPageDocument("home")]);
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const summaries = result.ok ? result.data.experiences : [];
  const details = await loadDetails(api, summaries, config.publicApiVersion !== "1.0");
  const cards = buildCardModels(summaries, details, isPilotPreview);
  const listed = summaries.map((summary) => details.get(summary.slug)).filter((detail): detail is ExperienceDetailForSite => Boolean(detail));
  const cardDates: CardDatesSource = { kind: "read", preview: isPreview, nihoWebOrigin: config.nihoWebOrigin };
  const fallback = <HomeViewV1 model={homeModel(summaries, cards, listed, cardDates, upcomingDays(new Date(), 14))} primitives={PRESENTATION_PRIMITIVES_V1} />;
  return <PageDocumentContent document={document} pageId="home" fallback={fallback} slots={{ ExperienceGrid: (props) => (
    <section className="container-page pt-14 lg:pt-[88px]" aria-label="Experiences"><SectionHeading eyebrow={cards.length ? `${numberWord(cards.length)} to choose from` : undefined} title={blockText(props, "heading", "Experiences hosted by neighbors")} action={cards.length ? <Link href="/experiences" className="link-leaf">See all</Link> : null} />{cards.length ? <ul className={`grid gap-x-6 gap-y-11 sm:grid-cols-2 ${props.columns === "two" ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>{cards.map((card, index) => <li key={card.slug}><ExperienceCard card={card} priority={index === 0} dates={cardDates} /></li>)}<li><InviteCard /></li></ul> : <><EmptyResults clearHref={null} />{props.emptyMessage ? <p>{String(props.emptyMessage)}</p> : null}</>}</section>
  ) }} />;
}
