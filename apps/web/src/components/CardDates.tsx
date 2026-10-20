"use client";

import { useEffect, useState } from "react";
import type { Occurrence } from "@niho-experience/api-client";
import { readAvailability } from "@/lib/browser-availability";
import { dayOption, nextBookable } from "@/lib/date-filter";
import { HandIcon } from "./HandIcon";

const NEXT_DATES = 3;

export type CardDatesSource =
  /** The list has already read availability for every card: null while loading or after a failure. */
  | { kind: "given"; occurrences: readonly Occurrence[] | null }
  /** The home page: read this experience's availability in the browser (shared with other reads of the same slug). */
  | { kind: "read"; preview: boolean; nihoWebOrigin: string };

/** The next bookable dates (one per day), soonest first. Seats left are never shown. */
export function nextDateKeys(occurrences: readonly Occurrence[], limit = NEXT_DATES): string[] {
  const keys: string[] = [];
  for (const occurrence of nextBookable(occurrences, Number.POSITIVE_INFINITY)) {
    if (!keys.includes(occurrence.date)) keys.push(occurrence.date);
    if (keys.length === limit) break;
  }
  return keys;
}

function useOccurrences(slug: string, source: CardDatesSource): readonly Occurrence[] | null {
  const [read, setRead] = useState<readonly Occurrence[] | null>(null);
  const preview = source.kind === "read" ? source.preview : false;
  const origin = source.kind === "read" ? source.nihoWebOrigin : null;
  useEffect(() => {
    if (origin === null) return;
    let active = true;
    readAvailability(slug, preview, origin).then((result) => {
      if (active && result.ok) setRead(result.occurrences);
    });
    return () => {
      active = false;
    };
  }, [slug, preview, origin]);
  return source.kind === "given" ? source.occurrences : read;
}

/**
 * "Next  Thu 22  Sat 24  Tue 27" on a card. Until availability is read (or when it cannot be),
 * the weekday summary stands in. One fixed line either way, so the card never jumps; pills
 * that do not fit a narrow card wrap out of sight but stay readable to screen readers.
 */
export function CardDates({ slug, scheduleLabel, source }: { slug: string; scheduleLabel: string | null; source: CardDatesSource }) {
  const occurrences = useOccurrences(slug, source);
  const keys = occurrences ? nextDateKeys(occurrences) : [];
  return (
    <div className="mt-3 h-7 overflow-hidden">
      {keys.length ? (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-2" data-next-dates>
          <span className="mr-0.5 text-[0.8125rem] font-extrabold text-muted">
            Next<span className="sr-only"> dates (Japan time):</span>
          </span>
          {keys.map((key) => {
            const day = dayOption(key);
            return (
              <span key={key} className="rounded-full border border-line-strong px-2.5 py-0.5 text-[0.8125rem] font-bold">
                {day.weekday} {day.day}
              </span>
            );
          })}
        </p>
      ) : scheduleLabel ? (
        <p className="flex h-7 min-w-0 items-center gap-1.5 text-sm font-bold text-ink-soft">
          <HandIcon name="cal" className="size-[22px]" />
          <span className="truncate">
            {scheduleLabel} <span className="font-normal text-muted">JST</span>
          </span>
        </p>
      ) : null}
    </div>
  );
}
