import type { Metadata } from "next";
import { TrackView } from "@/components/Analytics";
import { ExperienceGrid } from "@/components/ExperienceCard";
import { ExperienceFiltersForm } from "@/components/ExperienceFiltersForm";
import { EmptyResults, ErrorState } from "@/components/States";
import { listExperiencesForSite } from "@/lib/api";
import { config, isPreview, previewListingLabel } from "@/lib/config";
import {
  filterExperienceSummaries,
  normalizeExperienceDate,
  normalizeExperienceQuery,
  normalizeExperienceTheme,
  type SearchParams,
} from "@/lib/filters";
import { pluralize } from "@/lib/format";

function hasV12Filters(query: SearchParams): boolean {
  return config.publicApiVersion === "1.2" &&
    (normalizeExperienceTheme(query.theme) !== undefined || normalizeExperienceDate(query.date) !== undefined);
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const query = await searchParams;
  const filtered = normalizeExperienceQuery(query.q) !== "" || hasV12Filters(query);
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
  const theme = config.publicApiVersion === "1.2" ? normalizeExperienceTheme(query.theme) : undefined;
  const date = config.publicApiVersion === "1.2" ? normalizeExperienceDate(query.date) : undefined;
  const result = await listExperiencesForSite("kamakura", { ...query, theme, date });
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const catalog = result.ok ? result.data.experiences : [];
  const items = filterExperienceSummaries(catalog, searchQuery);
  const filtersActive = Boolean(searchQuery || theme || date);
  const filtersEnabled = config.publicApiVersion === "1.2";

  return <div className="container-page pt-8 sm:pt-12">
    <TrackView event="list_view" props={{ theme: theme ?? "all", date_filtered: Boolean(date), result_count: items.length }} />
    <header className="max-w-2xl space-y-3">
      <p className="eyebrow">Kamakura</p>
      <h1 className="text-4xl sm:text-5xl">Experiences</h1>
      <p className="text-lg text-ink-soft">A small selection of experiences with local hosts. Prices are in Japanese yen; times are Japan time (JST).</p>
    </header>

    <ExperienceFiltersForm searchQuery={searchQuery} theme={theme} date={date} filtersEnabled={filtersEnabled} filtersActive={filtersActive} />

    <p className="mt-6 text-ink-soft" role="status">{pluralize(items.length, "experience")}</p>
    <div className="mt-6">{items.length
      ? <ExperienceGrid items={items} priorityCount={2} preview={isPreview} previewLabel={previewListingLabel} />
      : <EmptyResults clearHref={filtersActive ? "/experiences" : null} searchActive={Boolean(searchQuery)} />}
    </div>
  </div>;
}
