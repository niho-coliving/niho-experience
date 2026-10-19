import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceGrid } from "@/components/ExperienceCard";
import { Photo } from "@/components/Photo";
import { EmptyResults } from "@/components/States";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getApi } from "@/lib/api";
import { config } from "@/lib/config";
import type { SearchParams } from "@/lib/filters";

export function generateMetadata(): Metadata {
  return { alternates: { canonical: `${config.siteUrl}/` } };
}

const HERO = {
  url: "/placeholders/hero.svg",
  alt: "Placeholder illustration: houses among green hills sloping down to the sea in Kamakura",
  width: 1600,
  height: 1000,
  placeholder: true,
};

const STEPS = [
  { title: "Choose a host", body: "Each experience is small and run by someone who lives here. Read who they are before you decide." },
  { title: "Book as a guest", body: "Pick a date and group size, see the full price in yen, and pay securely. No account needed." },
  { title: "Meet in the neighborhood", body: "Your host's meeting details arrive by email. Come hungry, curious, or both." },
];

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const catalog = await getApi(await searchParams).getCatalog({ area: "kamakura" });
  const featured = catalog.items.slice(0, 3);
  const hosts = catalog.items.filter((i) => i.host.portrait).slice(0, 4);

  return (
    <>
      <section className="container-page pt-6 sm:pt-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="order-2 space-y-5 lg:order-1">
            <p className="eyebrow">Kamakura · Small group experiences</p>
            <h1 className="text-[2.5rem] leading-[1.08] sm:text-6xl">Meet the people who make Kamakura home</h1>
            <p className="max-w-xl text-lg text-ink-soft">
              Cook with a neighbor, carve wood with a craftsperson, or walk the hills with someone who knows every path. Hosted by locals, in small groups.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href="/experiences">Find an experience</ButtonLink>
              <ButtonLink href="/host" variant="secondary">
                Host with NIHO
              </ButtonLink>
            </div>
          </div>
          <Photo image={HERO} priority sizes="(min-width: 64rem) 560px, 100vw" className="order-1 lg:order-2" aspect="aspect-[16/10]" />
        </div>
      </section>

      <section className="container-page mt-20" aria-labelledby="featured">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading id="featured" eyebrow="This season" title="Experiences hosted by neighbors" />
          {catalog.items.length > featured.length ? (
            <Link href="/experiences" className="mb-6 font-bold text-moss hover:underline">
              See all {catalog.items.length} experiences
            </Link>
          ) : null}
        </div>
        {featured.length ? <ExperienceGrid items={featured} /> : <EmptyResults clearHref={null} />}
      </section>

      {catalog.themes.length > 1 ? (
        <section className="container-page mt-20" aria-labelledby="themes">
          <SectionHeading id="themes" eyebrow="Browse" title="What would you like to do?" />
          <ul className="flex flex-wrap gap-3">
            {catalog.themes.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/experiences?theme=${t.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-5 font-bold hover:border-ink"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-20 bg-sand py-16" aria-labelledby="how">
        <div className="container-page">
          <SectionHeading id="how" eyebrow="How it works" title="Simple to book, personal when you arrive" />
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-[var(--radius-card)] bg-surface p-6 shadow-[var(--shadow-card)]">
                <span className="flex size-9 items-center justify-center rounded-full bg-leaf-pale font-display text-lg font-semibold text-moss" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl">{s.title}</h3>
                <p className="mt-2 text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {hosts.length ? (
        <section className="container-page mt-20" aria-labelledby="hosts">
          <SectionHeading id="hosts" eyebrow="The hosts" title="Real people, not tour scripts">
            <p>Hosts share what they already love doing. NIHO helps them prepare, write and take bookings.</p>
          </SectionHeading>
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {hosts.map((e) => (
              <li key={e.id}>
                <Link href={`/experiences/${e.slug}`} className="group block text-center">
                  <Photo image={e.host.portrait!} sizes="160px" aspect="aspect-square" rounded="rounded-full" className="mx-auto w-28 sm:w-36" label={false} />
                  <p className="mt-3 font-bold group-hover:underline">{e.host.displayName}</p>
                  <p className="text-sm text-muted">{e.host.role}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="container-page mt-20" aria-labelledby="host-cta">
        <div className="grid gap-6 rounded-[var(--radius-card)] bg-moss px-6 py-10 text-white sm:px-10 md:grid-cols-[2fr_1fr] md:items-center">
          <div className="space-y-3">
            <h2 id="host-cta" className="text-3xl">
              Live in Kamakura? Share what you love.
            </h2>
            <p className="text-white/85">NIHO helps you turn a meal, a craft or a favorite walk into an experience for travelers, and handles bookings with you.</p>
          </div>
          <div className="md:text-right">
            <Link href="/host" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 font-bold text-moss hover:bg-leaf-pale">
              Learn about hosting
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
