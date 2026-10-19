import type { Metadata } from "next";
import Link from "next/link";
import { TrackView } from "@/components/Analytics";
import { ExperienceGrid } from "@/components/ExperienceCard";
import { EmptyResults } from "@/components/States";
import { buttonClass } from "@/components/ui";
import { getApi } from "@/lib/api";
import { config } from "@/lib/config";
import { filtersHref, hasFilters, parseFilters, type SearchParams } from "@/lib/filters";
import { formatLongDay, pluralize } from "@/lib/format";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const filtered = hasFilters(parseFilters(await searchParams));
  return {
    title: "Experiences in Kamakura",
    description: "Small group experiences in Kamakura hosted by locals: food, craft, nature walks and local life.",
    alternates: { canonical: `${config.siteUrl}/experiences` },
    // Filter combinations are not separate pages for search engines (#12).
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = parseFilters(params);
  const catalog = await getApi(params).getCatalog({ area: "kamakura", ...query });
  const filtered = hasFilters(query);
  const activeTheme = catalog.themes.find((t) => t.slug === query.theme);

  return (
    <div className="container-page pt-8 sm:pt-12">
      <TrackView event="list_view" props={{ theme: query.theme ?? "all", date_filtered: Boolean(query.date), result_count: catalog.items.length }} />
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">Kamakura</p>
        <h1 className="text-4xl sm:text-5xl">Experiences</h1>
        <p className="text-lg text-ink-soft">A small, hand-picked set of experiences with local hosts. Prices are in Japanese yen; times are Japan time (JST).</p>
      </header>

      <section aria-label="Filters" className="mt-8 space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
        <div>
          <h2 className="mb-2 font-sans text-sm font-bold text-ink-soft">Theme</h2>
          <ul className="flex flex-wrap gap-2">
            <li>
              <ThemeChip href={filtersHref(query, { theme: null })} active={!query.theme} label="All" />
            </li>
            {catalog.themes.map((t) => (
              <li key={t.slug}>
                <ThemeChip href={filtersHref(query, { theme: t.slug })} active={query.theme === t.slug} label={t.label} />
              </li>
            ))}
          </ul>
        </div>
        <form action="/experiences" method="get" className="flex flex-wrap items-end gap-3">
          {query.theme ? <input type="hidden" name="theme" value={query.theme} /> : null}
          <div className="min-w-0">
            <label htmlFor="date" className="mb-1 block text-sm font-bold text-ink-soft">
              Date (JST)
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={query.date}
              className="min-h-11 rounded-xl border border-line-strong bg-surface px-3 text-base"
            />
          </div>
          <button type="submit" className={buttonClass("secondary")}>
            Show dates
          </button>
          {filtered ? (
            <Link href="/experiences" className="min-h-11 content-center px-2 font-bold text-moss underline-offset-4 hover:underline">
              Clear all filters
            </Link>
          ) : null}
        </form>
      </section>

      <p className="mt-6 text-ink-soft" role="status">
        {pluralize(catalog.items.length, "experience")}
        {activeTheme ? ` in ${activeTheme.label}` : ""}
        {query.date ? ` with open spots on ${formatLongDay(`${query.date}T12:00:00+09:00`)}` : ""}
      </p>

      <div className="mt-6">
        {catalog.items.length ? (
          <ExperienceGrid items={catalog.items} priorityCount={2} />
        ) : (
          <EmptyResults clearHref={filtered ? "/experiences" : null} />
        )}
      </div>
    </div>
  );
}

function ThemeChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 items-center rounded-full border px-4 font-bold ${
        active ? "border-moss bg-moss text-white" : "border-line-strong bg-surface hover:border-ink"
      }`}
    >
      {label}
    </Link>
  );
}
