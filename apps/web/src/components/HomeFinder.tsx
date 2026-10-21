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

  // The package's @scope(.nexp-v1) CSS beats this app's lg: utilities by scope proximity, so anything that changes at lg is a max-lg:/lg: pair, never a base class the package also defines.
  const cell = "flex min-w-0 items-center gap-2.5 px-3 py-2.5 hover:bg-sand max-lg:rounded-2xl lg:rounded-full";
  const select = "w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent text-[0.9375rem] leading-tight font-bold text-ink";
  const button = [
    ...buttonClass("primary").split(" ").filter((name) => name && name !== "min-h-12" && name !== "px-6"),
    "max-lg:col-span-2 max-lg:min-h-12 max-lg:px-6 lg:min-h-14 lg:px-[30px]",
  ].join(" ");
  return (
    <form
      action="/experiences"
      method="get"
      role="search"
      aria-label="Find experiences"
      onSubmit={submit}
      className="z-[3] grid gap-1 bg-white py-2 pr-2 shadow-[0_10px_30px_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.06)] max-lg:relative max-lg:mx-4 max-lg:-mt-9 max-lg:grid-cols-2 max-lg:rounded-[22px] max-lg:pl-2 lg:absolute lg:bottom-[-38px] lg:left-1/2 lg:w-[min(780px,calc(100%_-_80px))] lg:-translate-x-1/2 lg:grid-cols-[1fr_1fr_auto] lg:rounded-full lg:pl-3.5"
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
      <button type="submit" className={button}>
        Find experiences
      </button>
    </form>
  );
}
