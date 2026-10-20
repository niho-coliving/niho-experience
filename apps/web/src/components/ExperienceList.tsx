"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Occurrence } from "@niho-experience/api-client";
import { readAvailability } from "@/lib/browser-availability";
import type { CardModel } from "@/lib/card-model";
import { dayOption, fitsPartySize, matchingOccurrence, MAX_GUESTS, type DayOption } from "@/lib/date-filter";
import { formatTime, pluralize } from "@/lib/format";
import { ExperienceCard } from "./ExperienceCard";
import { HandIcon } from "./HandIcon";
import { buttonClass } from "./ui";

type Availability = { state: "loading" } | { state: "failed" } | { state: "ready"; bySlug: Map<string, Occurrence[]> };

/**
 * The list with date chips and a party-size filter. Cards are server-rendered for
 * every experience; the browser reads each experience's availability once and then
 * shows only those with a bookable session that fits the chosen day and group.
 * If availability cannot be read, the date filter fails open.
 */
export function ExperienceList({
  cards,
  days,
  initialDate,
  initialGuests,
  catalogDateFiltered,
  preview,
  previewLabel,
  nihoWebOrigin,
  empty,
}: {
  cards: CardModel[];
  days: DayOption[];
  initialDate: string | null;
  initialGuests: number | null;
  catalogDateFiltered: boolean;
  preview: boolean;
  previewLabel: string;
  nihoWebOrigin: string;
  /** Shown instead of the list when the server returned no experiences (search or empty catalog). */
  empty: ReactNode;
}) {
  const router = useRouter();
  const [date, setDate] = useState<string | null>(initialDate);
  const [guests, setGuests] = useState<number | null>(initialGuests);
  const [availability, setAvailability] = useState<Availability>({ state: "loading" });
  const chips = useRef<HTMLDivElement>(null);

  // A date arriving in the URL (e.g. from the home finder) may be off-screen on a phone.
  useEffect(() => {
    const row = chips.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row && chip && initialDate) row.scrollLeft = chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2;
  }, [initialDate]);

  useEffect(() => {
    if (!cards.length) return;
    let active = true;
    Promise.all(cards.map((card) => readAvailability(card.slug, preview, nihoWebOrigin))).then((reads) => {
      if (!active) return;
      if (reads.some((read) => !read.ok)) {
        setAvailability({ state: "failed" });
        return;
      }
      const bySlug = new Map<string, Occurrence[]>();
      reads.forEach((read, index) => {
        if (read.ok) bySlug.set(cards[index]!.slug, read.occurrences);
      });
      setAvailability({ state: "ready", bySlug });
    });
    return () => {
      active = false;
    };
  }, [cards, preview, nihoWebOrigin]);

  const ready = availability.state === "ready" ? availability.bySlug : null;
  const failed = availability.state === "failed";

  const matches = useMemo(() => {
    if (!ready || !date) return null;
    const found = new Map<string, Occurrence>();
    for (const card of cards) {
      const occurrence = matchingOccurrence(ready.get(card.slug) ?? [], card.offers, date, guests);
      if (occurrence) found.set(card.slug, occurrence);
    }
    return found;
  }, [ready, date, guests, cards]);

  const counts = useMemo(() => {
    if (!ready) return null;
    return new Map(days.map((day) => [day.key, cards.filter((card) => matchingOccurrence(ready.get(card.slug) ?? [], card.offers, day.key, guests)).length]));
  }, [ready, days, cards, guests]);

  if (!cards.length) return <div className="container-page mt-8">{empty}</div>;

  const visible = cards.filter((card) => fitsPartySize(card.offers, guests) && (failed || !matches || matches.has(card.slug)));
  const chosenDay = date ? (days.find((day) => day.key === date) ?? dayOption(date)) : null;

  function syncUrl(nextDate: string | null, nextGuests: number | null) {
    const params = new URLSearchParams(window.location.search);
    if (nextDate) params.set("date", nextDate);
    else params.delete("date");
    if (nextGuests !== null) params.set("guests", String(nextGuests));
    else params.delete("guests");
    const query = params.toString();
    router.push(query ? `${window.location.pathname}?${query}` : window.location.pathname, { scroll: false });
  }
  function chooseDate(next: string | null) {
    setDate(next);
    syncUrl(next, guests);
  }
  function chooseGuests(next: number | null) {
    setGuests(next);
    syncUrl(date, next);
  }

  const party = guests === null ? "" : ` for ${guests} guest${guests === 1 ? "" : "s"}`;
  let status: string;
  if (chosenDay && !failed && !ready) status = `Checking which experiences run on ${chosenDay.label}…`;
  else if (chosenDay && !failed) status = `${pluralize(visible.length, "experience")} on ${chosenDay.label}${party}`;
  else status = `${pluralize(visible.length, "experience")}${party} · prices in yen, tax included · times in JST`;

  return (
    <div>
      {failed ? (
        <div className="container-page mt-6">
          <p className="flex items-start gap-2 rounded-2xl bg-sand p-4 text-ink-soft">
            <HandIcon name="cal" className="size-6 text-moss" />
            <span>We couldn&apos;t check dates just now, so date filtering is paused. Known group-size limits still apply; you can choose a date on each experience.</span>
          </p>
        </div>
      ) : (
        <div className="sticky top-16 z-20 mt-6 border-y border-line bg-white/95 backdrop-blur">
          <div className="container-page flex items-center gap-3 py-3">
            <div ref={chips} role="group" aria-label="Date (Japan time)" className="scrollbar-none relative flex min-w-0 flex-1 gap-2 overflow-x-auto">
              <button
                type="button"
                aria-pressed={date === null}
                onClick={() => chooseDate(null)}
                className={`flex h-[68px] shrink-0 items-center rounded-2xl border px-4 text-sm font-extrabold ${date === null ? "border-ink bg-ink text-white" : "border-line-strong bg-white"}`}
              >
                Any day
              </button>
              {days.map((day) => {
                const selected = date === day.key;
                const count = catalogDateFiltered && !selected ? undefined : counts?.get(day.key);
                const disabled = !catalogDateFiltered && count === 0 && !selected;
                return (
                  <button
                    key={day.key}
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled}
                    aria-label={`${day.label}${count === undefined ? "" : `, ${count ? pluralize(count, "experience") : "nothing on this day"}`}`}
                    onClick={() => chooseDate(day.key)}
                    className={`flex h-[68px] w-14 shrink-0 flex-col items-center justify-center rounded-2xl border leading-[1.15] disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "border-ink bg-ink text-white" : "border-line-strong bg-white"}`}
                  >
                    <small className={`text-xs font-extrabold ${selected ? "text-white/85" : "text-muted"}`}>{day.weekday}</small>
                    <b className="text-[1.1875rem] font-extrabold">{day.day}</b>
                    <i className={`text-[0.6875rem] font-extrabold not-italic ${selected ? "text-white/85" : "text-moss"}`} aria-hidden>
                      {count === undefined ? "·" : count || "—"}
                    </i>
                  </button>
                );
              })}
            </div>
            <label className="relative flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-white pr-3 pl-2.5 text-sm font-extrabold">
              <HandIcon name="people" className="size-[22px]" />
              <span className="sr-only">Guests</span>
              <select
                value={guests ?? ""}
                onChange={(event) => chooseGuests(event.target.value ? Number(event.target.value) : null)}
                className="h-full cursor-pointer appearance-none bg-transparent pr-1"
              >
                <option value="">Any group</option>
                {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {pluralize(n, "guest")}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <section className="container-page" aria-label="Experiences">
        <p role="status" className="py-5 text-[0.9375rem] text-ink-soft">
          {status}
        </p>
        {visible.length ? (
          <ul className="grid gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((card, index) => {
              const occurrence = matches?.get(card.slug);
              return (
                <li key={card.slug}>
                  <ExperienceCard
                    card={card}
                    variant="list"
                    priority={index < 2}
                    preview={preview}
                    previewLabel={previewLabel}
                    highlight={occurrence ? `${dayOption(occurrence.date).label} · ${formatTime(occurrence.startAt)}` : null}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-sand px-6 py-12 text-center">
            <h2 className="text-2xl">{chosenDay ? `Nothing on ${chosenDay.label}${party}` : `No experiences for ${guests} guests`}</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-soft">{chosenDay ? "Try another day or fewer guests." : "Each experience has a party-size limit. Try a smaller group."}</p>
            <div className="mt-6 flex justify-center">
              {chosenDay ? (
                <button type="button" className={buttonClass("primary")} onClick={() => chooseDate(null)}>
                  Show any day
                </button>
              ) : (
                <button type="button" className={buttonClass("primary")} onClick={() => chooseGuests(null)}>
                  Show all experiences
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
