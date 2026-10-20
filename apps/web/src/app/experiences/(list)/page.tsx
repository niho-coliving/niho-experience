import type { Metadata } from "next";
import Link from "next/link";
import { TrackView } from "@/components/Analytics";
import { ExperienceList } from "@/components/ExperienceList";
import { EmptyResults, ErrorState } from "@/components/States";
import { buttonClass } from "@/components/ui";
import { getApi } from "@/lib/api";
import { buildCardModels } from "@/lib/card-model";
import { loadDetails } from "@/lib/catalog";
import { config, isPreview, previewListingLabel } from "@/lib/config";
import { dayOption, parseDateParam, parseGuestsParam, upcomingDays } from "@/lib/date-filter";
import { filterExperienceSummaries, normalizeExperienceQuery, type SearchParams } from "@/lib/filters";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const query = await searchParams;
  const filtered = query.theme !== undefined || query.date !== undefined || query.guests !== undefined || normalizeExperienceQuery(query.q) !== "";
  return {
    title: "Kamakura Experiences with Local Hosts",
    description: "Small-group experiences in Kamakura hosted by people who live here. Prices in Japanese yen, times in JST, and no account needed to book.",
    alternates: { canonical: `${config.siteUrl}/experiences` },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Date chips cover a week; the home finder offers two weeks, so a later date from there gets its own chip. */
const CHIP_DAYS = 7;
const FINDER_DAYS = 14;

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const searchQuery = normalizeExperienceQuery(query.q);
  const api = await getApi(query);
  const result = await api.listExperiences({ region: "kamakura" });
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const catalog = result.ok ? result.data.experiences : [];
  const items = filterExperienceSummaries(catalog, searchQuery);
  const cards = buildCardModels(items, await loadDetails(api, items));

  const now = new Date();
  const finderDays = upcomingDays(now, FINDER_DAYS);
  const initialDate = parseDateParam(query.date, finderDays);
  const days = upcomingDays(now, CHIP_DAYS);
  if (initialDate && !days.some((day) => day.key === initialDate)) days.push(dayOption(initialDate));

  return (
    <div className="pt-9 sm:pt-14">
      <TrackView event="list_view" props={{ theme: "all", date_filtered: initialDate !== null, result_count: items.length }} />
      <header className="container-page">
        <p className="eyebrow">small groups · local hosts</p>
        <h1 className="mt-1.5 text-[2.5rem] sm:text-[3.625rem]">Experiences in Kamakura</h1>
        <p className="mt-2.5 text-[0.9375rem] text-muted">Prices in Japanese yen, tax included. Times in Japan time (JST).</p>
        <form role="search" action="/experiences" method="get" className="mt-5 flex max-w-xl flex-wrap items-center gap-2">
          <label htmlFor="experience-search" className="sr-only">
            Search experiences and hosts
          </label>
          <input
            id="experience-search"
            name="q"
            type="search"
            maxLength={80}
            defaultValue={searchQuery}
            placeholder="Try pottery, coffee or dinner"
            className="min-h-12 min-w-0 flex-1 basis-56 rounded-full border border-line-strong bg-surface px-4 text-base"
          />
          <button type="submit" className={buttonClass("secondary", "min-h-12")}>
            Search
          </button>
          {searchQuery && items.length ? (
            <Link href="/experiences" className="link-leaf px-2 text-sm">
              Clear search
            </Link>
          ) : null}
        </form>
      </header>
      <ExperienceList
        cards={cards}
        days={days}
        initialDate={initialDate}
        initialGuests={parseGuestsParam(query.guests)}
        preview={isPreview}
        previewLabel={previewListingLabel}
        nihoWebOrigin={config.nihoWebOrigin}
        empty={<EmptyResults clearHref={searchQuery ? "/experiences" : null} searchActive={Boolean(searchQuery)} />}
      />
    </div>
  );
}
