import type { Metadata } from "next";
import { TrackView } from "@/components/Analytics";
import { PageDocumentContent, blockText, type BlockProps } from "@/components/PageDocument";
import { ExperienceList } from "@/components/ExperienceList";
import { ExperienceFiltersForm } from "@/components/ExperienceFiltersForm";
import { EmptyResults, ErrorState } from "@/components/States";
import { getApi, listExperiencesForSite } from "@/lib/api";
import { buildCardModels } from "@/lib/card-model";
import { loadDetails } from "@/lib/catalog";
import { config, isPreview } from "@/lib/config";
import { dayOption, parseDateParam, parseGuestsParam, upcomingDays } from "@/lib/date-filter";
import { filterExperienceSummaries, normalizeExperienceDate, normalizeExperienceQuery, normalizeExperienceTheme, type SearchParams } from "@/lib/filters";
import { getPublishedPageDocument } from "@/lib/page-documents";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const query = await searchParams;
  const filtered = query.theme !== undefined || query.date !== undefined || query.guests !== undefined || normalizeExperienceQuery(query.q) !== "";
  const document = await getPublishedPageDocument("experiences");
  return {
    title: document?.title ?? "Kamakura Experiences with Local Hosts",
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
  const [api, result, document] = await Promise.all([getApi(query), listExperiencesForSite("kamakura", query), getPublishedPageDocument("experiences")]);
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const catalog = result.ok ? result.data.experiences : [];
  const items = filterExperienceSummaries(catalog, searchQuery);
  const cards = buildCardModels(items, await loadDetails(api, items, config.publicApiVersion !== "1.0"));

  const now = new Date();
  const finderDays = upcomingDays(now, FINDER_DAYS);
  const catalogDate = config.publicApiVersion === "1.2" ? normalizeExperienceDate(query.date) : undefined;
  const initialDate = catalogDate ?? parseDateParam(query.date, finderDays);
  const theme = config.publicApiVersion === "1.2" ? normalizeExperienceTheme(query.theme) : undefined;
  const date = config.publicApiVersion === "1.2" ? normalizeExperienceDate(query.date) : undefined;
  const initialGuests = parseGuestsParam(query.guests);
  const days = upcomingDays(now, CHIP_DAYS);
  if (initialDate && !days.some((day) => day.key === initialDate)) days.push(dayOption(initialDate));

  const searchProps = {
    searchQuery,
    theme,
    date,
    filtersEnabled: config.publicApiVersion === "1.2",
    filtersActive: Boolean(searchQuery || theme || date || initialGuests !== null),
  };
  const listContent = (props: BlockProps = {}) => (
    <div className="pt-9 sm:pt-14">
      <header className="container-page">
        <p className="eyebrow">small groups · local hosts</p>
        <h1 className="mt-1.5 text-[2.5rem] sm:text-[3.625rem]">{blockText(props, "heading", "Experiences in Kamakura")}</h1>
        <p className="mt-2.5 text-[0.9375rem] text-muted">Prices in Japanese yen, tax included. Times in Japan time (JST).</p>
      </header>
      <ExperienceList
        key={`${initialDate ?? "any"}:${initialGuests ?? "any"}`}
        cards={cards}
        days={days}
        initialDate={initialDate}
        initialGuests={initialGuests}
        catalogDateFiltered={config.publicApiVersion === "1.2" && Boolean(date)}
        preview={isPreview}
        nihoWebOrigin={config.nihoWebOrigin}
        search={<ExperienceFiltersForm {...searchProps} placement="bar" />}
        inlineSearch={<ExperienceFiltersForm {...searchProps} placement="inline" />}
        columns={props.columns === "two" ? "two" : "three"}
        empty={<><EmptyResults clearHref={searchQuery || theme || date || initialGuests !== null ? "/experiences" : null} searchActive={Boolean(searchQuery)} />{props.emptyMessage ? <p>{String(props.emptyMessage)}</p> : null}</>}
      />
    </div>
  );
  return <>
    <TrackView event="list_view" props={{ theme: theme ?? "all", date_filtered: initialDate !== null, result_count: items.length }} />
    <PageDocumentContent document={document} pageId="experiences" fallback={listContent()} slots={{ ExperienceGrid: (props) => listContent(props) }} />
  </>;
}
