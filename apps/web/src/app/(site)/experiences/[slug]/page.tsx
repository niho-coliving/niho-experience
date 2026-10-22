import type { Metadata } from "next";
import { ExperiencePageContent, englishExperienceMetadata } from "@/components/pages/ExperiencePageContent";
import type { SearchParams } from "@/lib/filters";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export function generateMetadata(props: Props): Promise<Metadata> {
  return englishExperienceMetadata(props);
}

export default function ExperiencePage(props: Props) {
  return ExperiencePageContent({ ...props, locale: "en" });
}
