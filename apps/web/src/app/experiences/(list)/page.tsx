import type { Metadata } from "next";
import { TrackView } from "@/components/Analytics";
import { ExperienceGrid } from "@/components/ExperienceCard";
import { EmptyResults, ErrorState } from "@/components/States";
import { listExperiencesForSite } from "@/lib/api";
import { config, isPreview, previewListingLabel } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";
import { pluralize } from "@/lib/format";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const query = await searchParams;
  const filtered = query.theme !== undefined || query.date !== undefined;
  return {
    title: "Kamakura Experiences with Local Hosts",
    description: "Small-group experiences in Kamakura hosted by people who live here. Prices in Japanese yen, times in JST, and no account needed to book.",
    alternates: { canonical: `${config.siteUrl}/experiences` },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const result = await listExperiencesForSite("kamakura", query);
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const items = result.ok ? result.data.experiences : [];
  return <div className="container-page pt-8 sm:pt-12"><TrackView event="list_view" props={{ theme: "all", date_filtered: false, result_count: items.length }} /><header className="max-w-2xl space-y-3"><p className="eyebrow">Kamakura</p><h1 className="text-4xl sm:text-5xl">Experiences</h1><p className="text-lg text-ink-soft">A small selection of experiences with local hosts. Prices are in Japanese yen; times are Japan time (JST).</p></header><p className="mt-6 text-ink-soft" role="status">{pluralize(items.length, "experience")}</p><div className="mt-6">{items.length ? <ExperienceGrid items={items} priorityCount={2} preview={isPreview} previewLabel={previewListingLabel} /> : <EmptyResults clearHref={null} />}</div></div>;
}
