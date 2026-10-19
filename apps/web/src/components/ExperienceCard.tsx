import Link from "next/link";
import type { ExperienceSummary } from "@niho-experience/api-client";
import { formatDay, formatDuration, formatLanguages, formatTime, formatYen, unitLabel } from "@/lib/format";
import { AvailabilityPill } from "./Availability";
import { Photo } from "./Photo";
import { Pill } from "./ui";

export function ExperienceCard({ experience: e, priority = false }: { experience: ExperienceSummary; priority?: boolean }) {
  const inactive = e.availability.status !== "bookable";
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative">
        <Photo
          image={e.heroImage}
          priority={priority}
          label={!e.synthetic}
          sizes="(min-width: 64rem) 380px, (min-width: 40rem) 50vw, 100vw"
          className={`transition-transform duration-300 group-hover:scale-[1.01] ${inactive ? "opacity-80" : ""}`}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <AvailabilityPill status={e.availability.status} />
          {e.synthetic ? <Pill tone="sample">Sample</Pill> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-4">
        <p className="eyebrow">{e.themes.map((t) => t.label).join(" · ")}</p>
        <h3 className="text-xl">
          <Link href={`/experiences/${e.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none group-has-[:focus-visible]:underline">
            {e.title}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">
          With <span className="font-bold text-ink">{e.host.displayName}</span>, {e.host.role.toLowerCase()}
        </p>
        <p className="text-sm text-muted">
          {formatDuration(e.durationMinutes)} · {formatLanguages(e.languages)}
        </p>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-2">
          <p>
            <span className="text-sm text-muted">From </span>
            <span className="text-lg font-extrabold">{formatYen(e.price.from)}</span>
            <span className="text-sm text-muted"> {unitLabel(e.price.unit)}</span>
          </p>
          {e.availability.nextStartsAt ? (
            <p className="text-sm text-ink-soft">
              Next: {formatDay(e.availability.nextStartsAt)}, {formatTime(e.availability.nextStartsAt)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ExperienceGrid({ items, priorityCount = 0 }: { items: ExperienceSummary[]; priorityCount?: number }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((e, i) => (
        <li key={e.id}>
          <ExperienceCard experience={e} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

export function ExperienceGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="space-y-3">
          <div className="aspect-[4/3] animate-pulse rounded-[var(--radius-card)] bg-sand" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-sand" />
          <div className="h-6 w-4/5 animate-pulse rounded bg-sand" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-sand" />
        </li>
      ))}
    </ul>
  );
}
