import type { Metadata } from "next";
import { BookingPageContent } from "@/components/pages/BookingPageContent";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = { title: "予約", robots: { index: false, follow: false } };

export default function JapaneseBookPage(props: { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }) {
  return BookingPageContent({ ...props, locale: "ja" });
}
