"use client";

import { useId, useMemo, useState } from "react";
import type { PriceUnit, Slot } from "@niho-experience/api-client";
import { track } from "@/lib/analytics";
import { formatDay, formatTimeRange, formatYen, jstDateKey, unitLabel } from "@/lib/format";
import { buttonClass } from "./ui";

const INITIAL_DATES = 6;

/**
 * Date and party size selection. Works as a plain GET form without JS; with
 * JS it adds a stepper and a live estimate. The estimate is never the final
 * price: the next step asks the API for a quote.
 */
export function SlotPicker({
  slug,
  slots,
  groupSize,
  unit,
}: {
  slug: string;
  slots: Slot[];
  groupSize: { min: number; max: number };
  unit: PriceUnit;
}) {
  const [slotId, setSlotId] = useState<string | null>(null);
  const [guests, setGuests] = useState(Math.max(groupSize.min, Math.min(2, groupSize.max)));
  const ids = { guests: useId(), estimate: useId(), legend: useId() };

  const selected = slots.find((s) => s.id === slotId) ?? null;
  const max = selected ? Math.min(groupSize.max, selected.maxGuests) : groupSize.max;
  const clamped = Math.min(Math.max(guests, groupSize.min), max);

  const byDate = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = jstDateKey(s.startsAt);
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    return [...groups.values()];
  }, [slots]);

  const estimate = selected ? selected.price.unitAmount.amount * (selected.price.unit === "per_person" ? clamped : 1) : null;
  const anyOpen = slots.some((s) => s.status === "open");
  const firstDates = byDate.slice(0, INITIAL_DATES);
  const moreDates = byDate.slice(INITIAL_DATES);

  const renderDay = (daySlots: Slot[]) => (
    <li key={daySlots[0]!.id}>
      <p className="mb-1.5 text-sm font-bold text-ink-soft">{formatDay(daySlots[0]!.startsAt)}</p>
      <ul className="space-y-2">
        {daySlots.map((s) => {
          const open = s.status === "open";
          return (
            <li key={s.id}>
              <label
                className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 has-[:checked]:border-moss has-[:checked]:bg-leaf-pale has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-moss ${
                  open ? "border-line-strong bg-surface hover:border-ink" : "cursor-not-allowed border-line bg-sand text-muted"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="radio"
                    name="slot"
                    value={s.id}
                    required
                    disabled={!open}
                    checked={slotId === s.id}
                    onChange={() => setSlotId(s.id)}
                    className="size-5 shrink-0 accent-moss"
                  />
                  <span className="min-w-0">
                    <span className="block font-bold">{formatTimeRange(s.startsAt, s.endsAt)}</span>
                    {!open ? <span className="block text-sm">{s.status === "sold_out" ? "Fully booked" : "Booking closed"}</span> : null}
                  </span>
                </span>
                {open ? (
                  <span className="shrink-0 text-sm">
                    {formatYen(s.price.unitAmount)} <span className="text-muted">{unitLabel(s.price.unit)}</span>
                  </span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </li>
  );

  return (
    <form
      action={`/experiences/${slug}/book`}
      method="get"
      className="space-y-5"
      onSubmit={() => track("slot_continue", { experience: slug, guests: clamped })}
    >
      <fieldset>
        <legend id={ids.legend} className="mb-3 font-display text-xl font-semibold">
          Choose a date
        </legend>
        <p className="-mt-2 mb-3 text-sm text-muted">All times are Japan time (JST).</p>
        <ul className="space-y-4">{firstDates.map(renderDay)}</ul>
        {moreDates.length ? (
          <details className="mt-4">
            <summary className="cursor-pointer font-bold text-moss">Show {moreDates.length} more dates</summary>
            <ul className="mt-4 space-y-4">{moreDates.map(renderDay)}</ul>
          </details>
        ) : null}
      </fieldset>

      {anyOpen ? (
        <>
          <div>
            <label htmlFor={ids.guests} className="mb-2 block font-bold">
              Guests
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Fewer guests"
                aria-controls={ids.guests}
                disabled={clamped <= groupSize.min}
                onClick={() => setGuests(clamped - 1)}
                className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-xl font-bold disabled:opacity-40"
              >
                −
              </button>
              <input
                id={ids.guests}
                name="guests"
                type="number"
                inputMode="numeric"
                min={groupSize.min}
                max={max}
                value={clamped}
                onChange={(e) => setGuests(Number(e.target.value) || groupSize.min)}
                aria-describedby={ids.estimate}
                className="min-h-11 w-16 rounded-xl border border-line-strong bg-surface text-center text-lg font-bold"
              />
              <button
                type="button"
                aria-label="More guests"
                aria-controls={ids.guests}
                disabled={clamped >= max}
                onClick={() => setGuests(clamped + 1)}
                className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-xl font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">
              {groupSize.min === groupSize.max
                ? `${groupSize.min} guests per booking.`
                : `${groupSize.min}–${groupSize.max} guests per booking.`}
              {unit === "per_group" ? " One price for the whole group." : ""}
            </p>
          </div>

          <div id={ids.estimate} aria-live="polite" className="rounded-xl bg-sand p-3 text-sm">
            {estimate !== null ? (
              <p>
                <span className="font-bold">Estimated total {formatYen({ amount: estimate, currency: "JPY" })}</span>
                <span className="block text-muted">The final price is confirmed on the next step, before you pay.</span>
              </p>
            ) : (
              <p className="text-muted">Choose a date to see the estimated total.</p>
            )}
          </div>

          <button type="submit" className={buttonClass("primary", "w-full")}>
            Continue
          </button>
        </>
      ) : null}
    </form>
  );
}
