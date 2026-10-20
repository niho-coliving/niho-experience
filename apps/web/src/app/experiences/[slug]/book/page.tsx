import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/Analytics";
import { BookingFlow } from "@/components/BookingFlow";
import { PageDocumentContent } from "@/components/PageDocument";
import { ButtonLink, Notice } from "@/components/ui";
import { getExperienceForSite } from "@/lib/api";
import { config, isPreview } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";
import { getPublishedPageDocument } from "@/lib/page-documents";

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
  const panel = available
    ? <BookingFlow experience={experience} preview={isPreview} availabilityIsProvisional={isPreview && config.mockCatalog === "pilot"} nihoWebOrigin={config.nihoWebOrigin} attributionEnabled={config.publicApiVersion === "1.2"} initialOfferId={initialOfferId} initialDate={initialDate} />
    : <><TrackView event="booking_unavailable" props={{ experience: slug, error_code: "bookings_paused" }} /><Notice role="alert" tone="warn" title="Online booking is paused for now">New bookings are unavailable. Please check back later.</Notice><div className="mt-6"><ButtonLink href={`/experiences/${slug}`} variant="secondary">Back to the experience</ButtonLink></div></>;
  const fallback = <><h1 className="mt-4 text-3xl sm:text-4xl">Review and book</h1>{available && <p className="mt-2 max-w-2xl text-ink-soft">Choose a date and party size, then review the full price and terms. No account is needed.</p>}<div className="mt-8 max-w-2xl">{panel}</div></>;
  return <div className={`container-page pt-6 ${available ? "max-w-5xl" : "max-w-2xl"}`}><Link href={`/experiences/${slug}`} className="text-sm font-bold text-moss hover:underline">← Back to {experience.title}</Link><PageDocumentContent document={document} pageId="booking" fallback={fallback} slots={{ BookingPanel: () => <div className="mt-8 max-w-2xl">{panel}</div> }} /></div>;
}
