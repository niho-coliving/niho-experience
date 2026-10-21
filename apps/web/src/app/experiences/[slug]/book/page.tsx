import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPageViewV1 } from "@niho/experience-presentation/v1";
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

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };
export default async function BookPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }) {
  const { slug } = await params;
  const query = await searchParams;
  const result = await getExperienceForSite(slug, query);
  if (!result.ok) { if (result.kind === "not_found") notFound(); throw new Error("Public experience unavailable"); }
  const experience = result.data.experience;
  const available = config.bookingsEnabled && experience.booking.checkoutAvailable;
  const document = await getPublishedPageDocument("booking");
  // A date picked on the detail page (public schedule data only; guest details never travel in the URL).
  const browseContext = readBrowseContext(query);
  const initialDate = browseContext.date;
  const initialOfferId = typeof query.offer === "string" && experience.offers.some((offer) => offer.id === query.offer) ? query.offer : undefined;
  // Without a published document the experience title is the page's h1; a published document brings its own heading.
  const panel = (titleAs: "h1" | "p") => available
    ? <BookingFlow experience={experience} preview={isPreview} availabilityIsProvisional={isPreview && config.mockCatalog === "pilot"} nihoWebOrigin={config.nihoWebOrigin} attributionEnabled={config.publicApiVersion === "1.2"} publicApiVersion={config.publicApiVersion} initialOfferId={initialOfferId} initialDate={initialDate} initialAdultCount={browseContext.guests} titleAs={titleAs} />
    : <><TrackView event="booking_unavailable" props={{ experience: slug, error_code: "bookings_paused" }} /><BookingSummaryCard experience={experience} offer={null} titleAs={titleAs} /><div className="mt-6"><Notice role="alert" tone="warn" title="Online booking is paused for now">New bookings are unavailable. Please check back later.</Notice></div><div className="mt-6"><ButtonLink href={`/experiences/${slug}`} variant="secondary">Back to the experience</ButtonLink></div></>;
  const backLabel = shortName(experience, isPilotPreview);
  return <BookingPageViewV1 primitives={PRESENTATION_PRIMITIVES_V1} backHref={browseHref(`/experiences/${slug}`, browseContext, initialOfferId)} backLabel={backLabel} backAccessibleLabel={`Back to ${backLabel}`} panel={<PageDocumentContent document={document} pageId="booking" fallback={panel("h1")} slots={{ BookingPanel: () => <div className="mt-6">{panel("p")}</div> }} />} />;
}
