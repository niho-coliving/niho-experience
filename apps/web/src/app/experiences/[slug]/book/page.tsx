import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/Analytics";
import { BookingFlow } from "@/components/BookingFlow";
import { ButtonLink, Notice } from "@/components/ui";
import { getApi } from "@/lib/api";
import { config, isPreview } from "@/lib/config";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await (await getApi()).getExperience(slug);
  if (!result.ok) { if (result.kind === "not_found") notFound(); throw new Error("Public experience unavailable"); }
  const experience = result.data.experience;
  if (!config.bookingsEnabled || !experience.booking.checkoutAvailable) {
    return <div className="container-page max-w-2xl pt-6"><TrackView event="booking_unavailable" props={{ experience: slug, error_code: "bookings_paused" }} /><Link href={`/experiences/${slug}`} className="text-sm font-bold text-moss hover:underline">← Back to {experience.title}</Link><h1 className="mt-4 text-3xl sm:text-4xl">Review and book</h1><div className="mt-8"><Notice role="alert" tone="warn" title="Online booking is paused for now">New bookings are unavailable. Please check back later.</Notice></div><div className="mt-6"><ButtonLink href={`/experiences/${slug}`} variant="secondary">Back to the experience</ButtonLink></div></div>;
  }
  return <div className="container-page max-w-5xl pt-6"><Link href={`/experiences/${slug}`} className="text-sm font-bold text-moss hover:underline">← Back to {experience.title}</Link><h1 className="mt-4 text-3xl sm:text-4xl">Review and book</h1><p className="mt-2 max-w-2xl text-ink-soft">Choose a date and party size, then review the full price and terms. No account is needed.</p><div className="mt-8 max-w-2xl"><BookingFlow experience={experience} preview={isPreview} nihoWebOrigin={config.nihoWebOrigin} /></div></div>;
}
