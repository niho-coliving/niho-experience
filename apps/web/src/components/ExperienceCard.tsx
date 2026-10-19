import Link from "next/link";
import type { ExperienceSummary } from "@niho-experience/api-client";
import { formatDuration, formatYen } from "@/lib/format";
import { Photo } from "./Photo";
import { Pill } from "./ui";

export function ExperienceCard({ experience: e, priority = false, preview = false, previewLabel = "Sample listing" }: { experience: ExperienceSummary; priority?: boolean; preview?: boolean; previewLabel?: string }) {
  return <article className="group relative flex h-full flex-col">
    <div className="relative">
      <Photo image={e.cover} alt={e.title} priority={priority} preview={preview} sizes="(min-width: 64rem) 380px, (min-width: 40rem) 50vw, 100vw" />
      {preview ? <div className="absolute top-3 left-3"><Pill tone="sample">{previewLabel}</Pill></div> : null}
    </div>
    <div className="flex flex-1 flex-col gap-2 pt-4">
      <p className="eyebrow">{e.region.name}</p>
      <h3 className="text-xl"><Link href={`/experiences/${e.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none group-has-[:focus-visible]:underline">{e.title}</Link></h3>
      <p className="text-sm text-ink-soft">With <span className="font-bold text-ink">{e.provider.name}</span></p>
      <p className="line-clamp-3 text-base text-ink-soft">{e.lead}</p>
      <p className="text-sm text-muted">{formatDuration(e.duration.minMinutes)}{e.duration.maxMinutes !== e.duration.minMinutes ? `–${formatDuration(e.duration.maxMinutes)}` : ""}</p>
      <p className="mt-auto pt-2"><span className="text-sm text-muted">From </span><span className="text-lg font-extrabold">{formatYen(e.priceFrom.amountYen)}</span><span className="text-sm text-muted"> per adult</span></p>
    </div>
  </article>;
}
export function ExperienceGrid({ items, priorityCount = 0, preview = false, previewLabel }: { items: ExperienceSummary[]; priorityCount?: number; preview?: boolean; previewLabel?: string }) {
  return <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{items.map((e, i) => <li key={e.slug}><ExperienceCard experience={e} priority={i < priorityCount} preview={preview} previewLabel={previewLabel} /></li>)}</ul>;
}
export function ExperienceGridSkeleton({ count = 3 }: { count?: number }) {
  return <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>{Array.from({ length: count }, (_, i) => <li key={i} className="space-y-3"><div className="aspect-[4/3] animate-pulse rounded-[var(--radius-card)] bg-sand" /><div className="h-3 w-1/3 animate-pulse rounded bg-sand" /><div className="h-6 w-4/5 animate-pulse rounded bg-sand" /></li>)}</ul>;
}
