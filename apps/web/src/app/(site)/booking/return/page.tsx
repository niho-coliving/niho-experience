import type { Metadata } from "next";
import { ButtonLink, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Booking status", robots: { index: false, follow: false } };
/** NIHO owns payment return and confirmation. This legacy URL shows no booking status. */
export default function BookingReturnPage() {
  return <div className="container-page max-w-2xl py-12"><h1 className="text-3xl">Check your booking with NIHO</h1><div className="mt-5"><Notice tone="info" title="Your booking status is on NIHO">Please use the confirmation link sent by NIHO. This page cannot confirm a booking or payment.</Notice></div><div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/help">Booking help</ButtonLink><ButtonLink href="/experiences" variant="secondary">Browse experiences</ButtonLink></div></div>;
}
