import type { Metadata } from "next";
import { TrackView } from "@/components/Analytics";
import { ExperienceGrid } from "@/components/ExperienceCard";
import { EmptyResults, ErrorState } from "@/components/States";
import { getApi } from "@/lib/api";
import { config, isPreview, previewListingLabel } from "@/lib/config";
import { filterExperienceSummaries, normalizeExperienceQuery, type SearchParams } from "@/lib/filters";
import { pluralize } from "@/lib/format";
import { buttonClass } from "@/components/ui";
import Link from "next/link";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const query = await searchParams;
  const filtered = query.theme !== undefined || query.date !== undefined || normalizeExperienceQuery(query.q) !== "";
  return {
    title: "Kamakura Experiences with Local Hosts",
    description: "Small-group experiences in Kamakura hosted by people who live here. Prices in Japanese yen, times in JST, and no account needed to book.",
    alternates: { canonical: `${config.siteUrl}/experiences` },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const searchQuery = normalizeExperienceQuery(query.q);
  const result = await (await getApi(query)).listExperiences({ region: "kamakura" });
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const catalog = result.ok ? result.data.experiences : [];
  const items = filterExperienceSummaries(catalog, searchQuery);
  return <div className="container-page pt-8 sm:pt-12"><TrackView event="list_view" props={{ theme: "all", date_filtered: false, result_count: items.length }} /><header className="max-w-2xl space-y-3"><p className="eyebrow">Kamakura</p><h1 className="text-4xl sm:text-5xl">Experiences</h1><p className="text-lg text-ink-soft">A small selection of experiences with local hosts. Prices are in Japanese yen; times are Japan time (JST).</p></header><form role="search" action="/experiences" method="get" className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end"><label htmlFor="experience-search" className="flex-1 font-bold">Search experiences and hosts<input id="experience-search" name="q" type="search" maxLength={80} defaultValue={searchQuery} placeholder="Try pottery, cycling or dinner" className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base font-normal" /></label><div className="flex gap-3"><button type="submit" className={buttonClass("primary")}>Search</button>{searchQuery && items.length ? <Link href="/experiences" className={buttonClass("secondary")}>Clear search</Link> : null}</div></form><p className="mt-6 text-ink-soft" role="status">{pluralize(items.length, "experience")}</p><div className="mt-6">{items.length ? <ExperienceGrid items={items} priorityCount={2} preview={isPreview} previewLabel={previewListingLabel} /> : <EmptyResults clearHref={searchQuery ? "/experiences" : null} searchActive={Boolean(searchQuery)} />}</div></div>;
}
