import type { Metadata } from "next";
import { PageDocumentContent, blockText } from "@/components/PageDocument";
import { ExperienceCard, InviteCard } from "@/components/ExperienceCard";
import { EmptyResults } from "@/components/States";
import { SectionHeading } from "@/components/ui";
import { JapaneseUnavailable } from "@/components/JapaneseUnavailable";
import type { CardDatesSource } from "@/components/CardDates";
import { getApi } from "@/lib/api";
import { buildCardModels } from "@/lib/card-model";
import { loadDetails } from "@/lib/catalog";
import { config } from "@/lib/config";
import { assertSameJapaneseRelease, getJapaneseCatalog, getJapaneseCopy, getJapanesePage, japaneseRenderableDocument } from "@/lib/localized-content";
import { japaneseStaticMetadata } from "@/lib/locale-metadata";

export async function generateMetadata(): Promise<Metadata> {
  try { return await japaneseStaticMetadata("home"); }
  catch { return { title: "Japanese version unavailable", robots: { index: false, follow: false } }; }
}

export default async function JapaneseHome() {
  let data;
  try {
    const [copy, page, catalog, api] = await Promise.all([getJapaneseCopy(), getJapanesePage("home"), getJapaneseCatalog(), getApi()]);
    assertSameJapaneseRelease(copy.releaseId, page, catalog);
    const document = japaneseRenderableDocument(page);
    const details = await loadDetails(api, catalog.experiences, true, "ja", copy.releaseId);
    const cards = buildCardModels(catalog.experiences, details, false, "ja", copy.copy);
    data = { copy, document, cards };
  } catch { return <JapaneseUnavailable />; }
  const { copy, document, cards } = data;
  const cardDates: CardDatesSource = { kind: "read", preview: false, nihoWebOrigin: config.nihoWebOrigin };
  return <PageDocumentContent document={document} pageId="home" fallback={<JapaneseUnavailable />} slots={{ ExperienceGrid: (props) => (
      <section className="container-page pt-14 lg:pt-[88px]" aria-label={copy.copy.text("chrome.experiences")}>
        <SectionHeading title={blockText(props, "heading", copy.copy.text("home.hostedBy"))} />
        {cards.length ? <ul className={`grid gap-x-6 gap-y-11 sm:grid-cols-2 ${props.columns === "two" ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>{cards.map((card, index) => <li key={card.slug}><ExperienceCard card={card} priority={index === 0} dates={cardDates} /></li>)}<li><InviteCard /></li></ul> : <><EmptyResults clearHref={null} />{props.emptyMessage ? <p>{String(props.emptyMessage)}</p> : null}</>}
      </section>
    ) }} />;
}
