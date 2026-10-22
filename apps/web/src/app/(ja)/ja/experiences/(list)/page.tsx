import type { Metadata } from "next";
import { CatalogueViewV1 } from "@niho/experience-presentation/v1";
import { PageDocumentContent, blockText, type BlockProps } from "@/components/PageDocument";
import { ExperienceList } from "@/components/ExperienceList";
import { ExperienceFiltersForm } from "@/components/ExperienceFiltersForm";
import { EmptyResults } from "@/components/States";
import { JapaneseUnavailable } from "@/components/JapaneseUnavailable";
import { getApi } from "@/lib/api";
import { buildCardModels } from "@/lib/card-model";
import { loadDetails } from "@/lib/catalog";
import { config } from "@/lib/config";
import { dayOption, parseDateParam, parseGuestsParam, upcomingDays } from "@/lib/date-filter";
import { filterExperienceSummaries, normalizeExperienceQuery, type SearchParams } from "@/lib/filters";
import { assertSameJapaneseRelease, getJapaneseCatalog, getJapaneseCopy, getJapanesePage, japaneseRenderableDocument } from "@/lib/localized-content";
import { japaneseStaticMetadata } from "@/lib/locale-metadata";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  try {
    const query = await searchParams;
    const filtered = query.date !== undefined || query.guests !== undefined || normalizeExperienceQuery(query.q) !== "";
    return await japaneseStaticMetadata("experiences", filtered);
  } catch { return { title: "Japanese experiences unavailable", robots: { index: false, follow: false } }; }
}

const CHIP_DAYS = 7;
const FINDER_DAYS = 14;

export default async function JapaneseExperiencesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  let data;
  try {
    const [copy, page, catalog, api] = await Promise.all([getJapaneseCopy(), getJapanesePage("experiences"), getJapaneseCatalog(), getApi()]);
    assertSameJapaneseRelease(copy.releaseId, page, catalog);
    const document = japaneseRenderableDocument(page);
    const searchQuery = normalizeExperienceQuery(query.q);
    const items = filterExperienceSummaries(catalog.experiences, searchQuery);
    const cards = buildCardModels(items, await loadDetails(api, items, true, "ja", copy.releaseId), false, "ja", copy.copy);
    const now = new Date(), finderDays = upcomingDays(now, FINDER_DAYS, "ja");
    const initialDate = parseDateParam(query.date, finderDays);
    const initialGuests = parseGuestsParam(query.guests);
    const days = upcomingDays(now, CHIP_DAYS, "ja");
    if (initialDate && !days.some((day) => day.key === initialDate)) days.push(dayOption(initialDate, "ja"));
    data = { copy, document, cards, searchQuery, initialDate, initialGuests, days };
  } catch { return <JapaneseUnavailable />; }
  const { copy, document, cards, searchQuery, initialDate, initialGuests, days } = data;
  const searchProps = { searchQuery, theme: undefined, date: initialDate ?? undefined, guests: initialGuests, filtersEnabled: false, filtersActive: Boolean(searchQuery || initialDate || initialGuests !== null) };
  const listContent = (props: BlockProps = {}) => <CatalogueViewV1 copy={copy.copy} heading={blockText(props, "heading", copy.copy.text("catalogue.title"))} content={<ExperienceList
      key={JSON.stringify([searchQuery, initialDate, initialGuests])} cards={cards} days={days} initialDate={initialDate} initialGuests={initialGuests} browseContext={{ q: searchQuery || undefined }} catalogDateFiltered={false} preview={false} nihoWebOrigin={config.nihoWebOrigin}
      search={<ExperienceFiltersForm key="bar-search" {...searchProps} placement="bar" />} inlineSearch={<ExperienceFiltersForm key="inline-search" {...searchProps} placement="inline" />} columns={props.columns === "two" ? "two" : "three"}
      empty={<><EmptyResults key="empty-results" clearHref={searchQuery || initialDate || initialGuests !== null ? "/experiences" : null} searchActive={Boolean(searchQuery)} />{props.emptyMessage ? <p key="empty-message">{String(props.emptyMessage)}</p> : null}</>}
    />} />;
  return <PageDocumentContent document={document} pageId="experiences" fallback={<JapaneseUnavailable />} slots={{ ExperienceGrid: (props) => listContent(props) }} />;
}
