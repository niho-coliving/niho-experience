import type { Metadata } from "next";
import { BookingPageContent } from "@/components/pages/BookingPageContent";
import type { SearchParams } from "@/lib/filters";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export default function BookPage(props: Props) {
  return BookingPageContent({ ...props, locale: "en" });
}
