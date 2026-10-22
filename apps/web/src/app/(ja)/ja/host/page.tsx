import type { Metadata } from "next";
import { HostPageContent, japaneseHostMetadata } from "@/components/pages/HostPageContent";

type SearchParams = Record<string, string | string[] | undefined>;
export function generateMetadata(): Promise<Metadata> {
  return japaneseHostMetadata();
}

export default function JapaneseHostPage(props: { searchParams: Promise<SearchParams> }) {
  return HostPageContent({ ...props, locale: "ja" });
}
