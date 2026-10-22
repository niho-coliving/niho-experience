import type { Metadata } from "next";
import { ExperiencePageContent, japaneseExperienceMetadata } from "@/components/pages/ExperiencePageContent";
import type { SearchParams } from "@/lib/filters";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export function generateMetadata(props: Props): Promise<Metadata> {
  return japaneseExperienceMetadata(props);
}

export default function JapaneseExperiencePage(props: Props) {
  return ExperiencePageContent({ ...props, locale: "ja" });
}
