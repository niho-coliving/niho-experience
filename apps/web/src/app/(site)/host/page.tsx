import type { Metadata } from "next";
import { HostPageContent, englishHostMetadata } from "@/components/pages/HostPageContent";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SearchParams> };

export function generateMetadata(): Promise<Metadata> {
  return englishHostMetadata();
}

export default function HostPage(props: Props) {
  return HostPageContent({ ...props, locale: "en" });
}
