"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormEvent } from "react";
import type { ExperienceSiteTheme } from "@niho-experience/api-client";
import { EXPERIENCE_SITE_THEMES, EXPERIENCE_THEME_LABELS } from "@/lib/filters";
import { buttonClass } from "./ui";

export function ExperienceFiltersForm({
  searchQuery,
  theme,
  date,
  filtersEnabled,
  filtersActive,
}: {
  searchQuery: string;
  theme: ExperienceSiteTheme | undefined;
  date: string | undefined;
  filtersEnabled: boolean;
  filtersActive: boolean;
}) {
  const router = useRouter();

  function submitWithClientNavigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") params.append(name, value);
    }
    const query = params.toString();
    router.push(query ? `/experiences?${query}` : "/experiences");
  }

  return <form role="search" action="/experiences" method="get" onSubmit={submitWithClientNavigation} className="mt-7 max-w-4xl space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
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
  </form>;
}
