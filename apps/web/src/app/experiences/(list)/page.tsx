import type { Metadata } from "next";
import Link from "next/link";
import { TrackView } from "@/components/Analytics";
import { ExperienceGrid } from "@/components/ExperienceCard";
import { EmptyResults, ErrorState } from "@/components/States";
import { buttonClass } from "@/components/ui";
import { listExperiencesForSite } from "@/lib/api";
import { config, isPreview, previewListingLabel } from "@/lib/config";
import {
  EXPERIENCE_SITE_THEMES,
  EXPERIENCE_THEME_LABELS,
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

    <form role="search" action="/experiences" method="get" className="mt-7 max-w-4xl space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
      <label htmlFor="experience-search" className="block font-bold">Search experiences and hosts
        <input id="experience-search" name="q" type="search" maxLength={80} defaultValue={searchQuery} placeholder="Try pottery, cycling or dinner" className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base font-normal" />
      </label>
      {filtersEnabled ? <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label htmlFor="experience-theme" className="block font-bold">Theme
          <select id="experience-theme" name="theme" defaultValue={theme ?? ""} className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base font-normal">
            <option value="">Any theme</option>
            {EXPERIENCE_SITE_THEMES.map((value) => <option key={value} value={value}>{EXPERIENCE_THEME_LABELS[value]}</option>)}
          </select>
        </label>
        <div>
          <label htmlFor="experience-date" className="block font-bold">Date
            <input id="experience-date" name="date" type="date" defaultValue={date ?? ""} aria-describedby="experience-date-help" className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base font-normal" />
          </label>
          <p id="experience-date-help" className="mt-1 text-xs leading-5 text-muted">Scheduled dates only; availability is checked before checkout.</p>
        </div>
        <button type="submit" className={buttonClass("primary", "min-h-12")}>Apply filters</button>
      </div> : <div><button type="submit" className={buttonClass("primary", "min-h-12")}>Search</button></div>}
      {filtersEnabled && filtersActive ? <div><Link href="/experiences" className="font-bold text-moss underline">Clear filters</Link></div> : null}
    </form>

    <p className="mt-6 text-ink-soft" role="status">{pluralize(items.length, "experience")}</p>
    <div className="mt-6">{items.length
      ? <ExperienceGrid items={items} priorityCount={2} preview={isPreview} previewLabel={previewListingLabel} />
      : <EmptyResults clearHref={filtersActive ? "/experiences" : null} searchActive={Boolean(searchQuery)} />}
    </div>
  </div>;
}
