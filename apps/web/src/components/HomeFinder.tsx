"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MAX_GUESTS, type DayOption } from "@/lib/date-filter";
import { pluralize } from "@/lib/format";
import { HandIcon } from "./HandIcon";
import { buttonClass } from "./ui";

/** Date and party size (2 adults unless changed), sent as a plain GET to the list (works without JavaScript). */
export function HomeFinder({ days }: { days: DayOption[] }) {
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const name of ["date", "guests"] as const) {
      const value = values.get(name);
      if (typeof value === "string" && value) params.set(name, value);
    }
    const query = params.toString();
    router.push(query ? `/experiences?${query}` : "/experiences");
  }

  const cell = "flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 hover:bg-sand lg:rounded-full";
  const select = "w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent text-[0.9375rem] leading-tight font-bold text-ink";
  return (
    <form
      action="/experiences"
      method="get"
      role="search"
      aria-label="Find experiences"
      onSubmit={submit}
      className="relative z-[3] mx-4 -mt-9 grid grid-cols-2 gap-1 rounded-[22px] bg-white p-2 shadow-[0_10px_30px_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.06)] lg:absolute lg:bottom-[-38px] lg:left-1/2 lg:mx-0 lg:mt-0 lg:w-[min(780px,calc(100%_-_80px))] lg:-translate-x-1/2 lg:grid-cols-[1fr_1fr_auto] lg:rounded-full lg:py-2 lg:pr-2 lg:pl-3.5"
    >
      <label className={cell}>
        <HandIcon name="cal" className="size-[30px]" />
        <span className="flex min-w-0 flex-1 flex-col">
          <small className="text-xs font-extrabold text-muted">When</small>
          <select name="date" defaultValue="" className={select}>
            <option value="">Any day</option>
            {days.map((day) => <option key={day.key} value={day.key}>{day.label}</option>)}
          </select>
        </span>
      </label>
      <label className={cell}>
        <HandIcon name="people" className="size-[30px]" />
        <span className="flex min-w-0 flex-1 flex-col">
          <small className="text-xs font-extrabold text-muted">Guests</small>
          <select name="guests" defaultValue="2" className={select}>
            {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{pluralize(n, "adult")}</option>)}
          </select>
        </span>
      </label>
      <button type="submit" className={buttonClass("primary", "col-span-2 lg:col-span-1 lg:min-h-14 lg:px-[30px]")}>
        Find experiences
      </button>
    </form>
  );
}
