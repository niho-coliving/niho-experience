import type { PageDocument } from "@niho/web/core";
import { notFound } from "next/navigation";
import { BookingPageViewV1, EN_STATIC_COPY_V1 } from "@niho/experience-presentation/v1";
import { TrackView } from "@/components/Analytics";
import { BookingFlow } from "@/components/BookingFlow";
import { BookingSummaryCard } from "@/components/BookingParts";
import { PageDocumentContent } from "@/components/PageDocument";
import { ButtonLink, Notice } from "@/components/ui";
import { getExperienceForSite } from "@/lib/api";
import { config, isPilotPreview, isPreview } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";
import { browseHref, readBrowseContext } from "@/lib/browse-context";
import { getPublishedPageDocument } from "@/lib/page-documents";
import { shortName } from "@/lib/themes";
import { PRESENTATION_PRIMITIVES_V1 } from "@/components/PresentationV1";
import { JapaneseUnavailable } from "@/components/JapaneseUnavailable";
import { assertSameJapaneseRelease, getJapaneseCopy, getJapaneseDetail, getJapaneseSidecar, japaneseBookingAllowed, japaneseRenderableDocument, type SiteLocale } from "@/lib/localized-content";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { getEnglishStaticCopy } from "@/lib/presentation-source";

export async function BookingPageContent({ params, searchParams, locale }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams>; locale: SiteLocale }) {
  const { slug } = await params;
  const query = await searchParams;
  let experience: ExperienceDetailForSite, document: PageDocument | null, copy = EN_STATIC_COPY_V1, bookingReady = true;
  if (locale === "ja") {
    try {
      const [selected, siteCopy, sidecar] = await Promise.all([getJapaneseDetail(slug), getJapaneseCopy(), getJapaneseSidecar("booking")]);
      assertSameJapaneseRelease(siteCopy.releaseId, selected, sidecar);
      experience = selected.experience; document = japaneseRenderableDocument(sidecar); copy = siteCopy.copy; bookingReady = japaneseBookingAllowed(selected);
    } catch { return <JapaneseUnavailable />; }
  } else {
    const result = await getExperienceForSite(slug, query);
    if (!result.ok) { if (result.kind === "not_found") notFound(); throw new Error("Public experience unavailable"); }
    experience = result.data.experience;
    [document, copy] = await Promise.all([getPublishedPageDocument("booking"), getEnglishStaticCopy()]);
  }
  const available = config.bookingsEnabled && experience.booking.checkoutAvailable && bookingReady;
  // A date picked on the detail page (public schedule data only; guest details never travel in the URL).
  const browseContext = readBrowseContext(query);
  const initialDate = browseContext.date;
  const initialOfferId = typeof query.offer === "string" && experience.offers.some((offer) => offer.id === query.offer) ? query.offer : undefined;
  // Without a published document the experience title is the page's h1; a published document brings its own heading.
  const panel = (titleAs: "h1" | "p") => available
    ? <BookingFlow experience={experience} preview={isPreview} availabilityIsProvisional={isPreview && config.mockCatalog === "pilot"} nihoWebOrigin={config.nihoWebOrigin} attributionEnabled={locale === "en" && config.publicApiVersion === "1.2"} publicApiVersion={config.publicApiVersion} initialOfferId={initialOfferId} initialDate={initialDate} initialAdultCount={browseContext.guests} titleAs={titleAs} />
    : <div className="max-w-2xl">{locale === "en" ? <TrackView event="booking_unavailable" props={{ experience: slug, error_code: "bookings_paused" }} /> : null}<BookingSummaryCard experience={experience} offer={null} titleAs={titleAs} /><div className="mt-6"><Notice role="alert" tone="warn" title={locale === "ja" && !bookingReady ? copy.text("booking.unavailableJa") : copy.text("booking.paused")}>{copy.text("booking.pausedBody")}</Notice></div><div className="mt-6"><ButtonLink href={`/experiences/${slug}`} variant="secondary">{copy.text("booking.back")}</ButtonLink></div></div>;
  const backLabel = shortName(experience, isPilotPreview);
  // Code-default page: full page width on desktop for the two-column booking views. A published document keeps its narrow layout.
  return <BookingPageViewV1 wide={!document} primitives={PRESENTATION_PRIMITIVES_V1} copy={copy} backHref={browseHref(`/experiences/${slug}`, browseContext, initialOfferId)} backLabel={backLabel} backAccessibleLabel={copy.text("booking.back")} panel={<PageDocumentContent document={document} pageId="booking" fallback={panel("h1")} slots={{ BookingPanel: () => <div className="mt-6">{panel("p")}</div> }} />} />;
}
