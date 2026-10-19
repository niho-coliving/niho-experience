import Link from "next/link";
import { ExperienceGrid } from "@/components/ExperienceCard";
import { Photo } from "@/components/Photo";
import { EmptyResults, ErrorState } from "@/components/States";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getApi } from "@/lib/api";
import { isPreview, previewListingLabel } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const result = await (await getApi(await searchParams)).listExperiences({ region: "kamakura" });
  if (!result.ok && result.kind !== "not_found") return <ErrorState title="We couldn't load experiences" />;
  const items = result.ok ? result.data.experiences : [];
  return <>
    <section className="container-page grid items-center gap-8 pt-10 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-5"><p className="eyebrow">Kamakura · Small group experiences</p><h1 className="text-[2.5rem] leading-[1.08] sm:text-6xl">Meet the people who make Kamakura home</h1><p className="max-w-xl text-lg text-ink-soft">Cook, create and explore with local hosts. Find a small experience that feels right for you.</p><ButtonLink href="/experiences">Find an experience</ButtonLink></div>
      {items[0]?.cover ? <Photo image={items[0].cover} alt={items[0].title} sizes="(min-width: 64rem) 560px, 100vw" aspect="aspect-[16/10]" preview={isPreview} priority /> : <div className="aspect-[16/10] rounded-[var(--radius-card)] bg-sand" aria-hidden />}
    </section>
    <section className="container-page mt-20"><SectionHeading eyebrow="This season" title="Experiences hosted by neighbors" />{items.length ? <ExperienceGrid items={items.slice(0, 3)} preview={isPreview} previewLabel={previewListingLabel} /> : <EmptyResults clearHref={null} />}{items.length > 3 ? <Link href="/experiences" className="mt-6 inline-block font-bold text-moss underline">See all experiences</Link> : null}</section>
    <section className="container-page mt-20 rounded-[var(--radius-card)] bg-sand px-6 py-10"><h2 className="text-3xl">Share what you love about Kamakura</h2><p className="mt-3 text-ink-soft">NIHO helps local hosts prepare and take bookings.</p><div className="mt-5"><ButtonLink href="/host" variant="secondary">Learn about hosting</ButtonLink></div></section>
  </>;
}
