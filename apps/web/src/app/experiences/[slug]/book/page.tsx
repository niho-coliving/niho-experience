import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/Analytics";
import { BookingFlow } from "@/components/BookingFlow";
import { BookingSummaryCard } from "@/components/BookingParts";
import { HandIcon } from "@/components/HandIcon";
import { PageDocumentContent } from "@/components/PageDocument";
import { ButtonLink, Notice } from "@/components/ui";
import { getExperienceForSite } from "@/lib/api";
import { config, isPilotPreview, isPreview } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";
import { getPublishedPageDocument } from "@/lib/page-documents";
import { shortName } from "@/lib/themes";

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
  const initialDate = typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : undefined;
  const initialOfferId = typeof query.offer === "string" && experience.offers.some((offer) => offer.id === query.offer) ? query.offer : undefined;
  // Without a published document the experience title is the page's h1; a published document brings its own heading.
  const panel = (titleAs: "h1" | "p") => available
    ? <BookingFlow experience={experience} preview={isPreview} availabilityIsProvisional={isPreview && config.mockCatalog === "pilot"} nihoWebOrigin={config.nihoWebOrigin} attributionEnabled={config.publicApiVersion === "1.2"} initialOfferId={initialOfferId} initialDate={initialDate} titleAs={titleAs} />
    : <><TrackView event="booking_unavailable" props={{ experience: slug, error_code: "bookings_paused" }} /><BookingSummaryCard experience={experience} offer={null} titleAs={titleAs} /><div className="mt-6"><Notice role="alert" tone="warn" title="Online booking is paused for now">New bookings are unavailable. Please check back later.</Notice></div><div className="mt-6"><ButtonLink href={`/experiences/${slug}`} variant="secondary">Back to the experience</ButtonLink></div></>;
  return <div className="container-page max-w-2xl pb-6">
    <Link href={`/experiences/${slug}`} className="mt-[18px] inline-flex items-center gap-1.5 text-sm font-extrabold text-ink-soft hover:text-ink">
      <HandIcon name="back" className="size-[18px] [stroke-width:2.2]" /><span className="sr-only">Back to </span>{shortName(experience, isPilotPreview)}
    </Link>
    <PageDocumentContent document={document} pageId="booking" fallback={panel("h1")} slots={{ BookingPanel: () => <div className="mt-6">{panel("p")}</div> }} />
  </div>;
}
