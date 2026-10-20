import Link from "next/link";
import type { CardModel } from "@/lib/card-model";
import { imageAlt } from "@/lib/experience-copy";
import { CardDates, type CardDatesSource } from "./CardDates";
import { FaceBadge } from "./Face";
import { HandIcon } from "./HandIcon";
import { Photo } from "./Photo";

export type CardOptions = {
  /** List page: 2-line lead and a 4:3 cover on phones. */
  variant?: "home" | "list";
  priority?: boolean;
  /** Where the next dates come from (the list's own read, or a read by the card). Without it the weekday summary shows. */
  dates?: CardDatesSource;
  /** "Sat 24 Oct · 6:00 PM" when a date is chosen on the list. */
  highlight?: string | null;
};

/** One whole-card link (the title's link covers the card). No popularity, scarcity or review claims. */
export function ExperienceCard({ card, variant = "home", priority = false, dates = { kind: "given", occurrences: null }, highlight = null }: { card: CardModel } & CardOptions) {
  const list = variant === "list";
  return (
    <article className="group relative flex h-full min-w-0 flex-col">
      <div className="relative">
        <Photo
          image={card.cover}
          alt={imageAlt(card.cover, card.title)}
          priority={priority}
          rounded="rounded-[var(--radius-card)]"
          aspect={list ? "aspect-[4/3] sm:aspect-[4/5]" : "aspect-[4/5]"}
          sizes="(min-width: 64rem) 380px, (min-width: 40rem) 50vw, 85vw"
        />
        {card.groupLabel ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[0.8125rem] font-extrabold text-ink">{card.groupLabel}</span>
        ) : null}
        <FaceBadge face={card.face} className="absolute right-3.5 -bottom-6 size-16 rounded-[18px] border-[3px] border-white text-2xl shadow-[0_6px_16px_rgb(0_0_0/0.14)]" />
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <p className="min-h-[1.375rem] pr-20 text-sm font-bold text-muted">{card.withLabel}</p>
        <h3 className="mt-1 text-[1.375rem] leading-[1.18]">
          <Link
            href={`/experiences/${card.slug}`}
            className="bg-[linear-gradient(var(--color-leaf),var(--color-leaf))] bg-[length:0_3px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_3px] after:absolute after:inset-0 focus-visible:outline-none group-has-[:focus-visible]:bg-[length:100%_3px]"
          >
            {card.title}
          </Link>
        </h3>
        {list ? <p className="mt-2 line-clamp-2 text-[0.9375rem] text-ink-soft">{card.lead}</p> : null}
        <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-sm font-bold text-ink-soft">
          <li className="flex items-center gap-1.5">
            <HandIcon name="clock" className="size-[22px]" />
            {card.durationLabel}
          </li>
          {card.language ? (
            <li className="flex items-center gap-1.5">
              <HandIcon name="chat" className="size-[22px]" />
              <span aria-hidden>{card.language.short}</span>
              <span className="sr-only">{card.language.full}</span>
            </li>
          ) : null}
        </ul>
        {highlight ? (
          <p className="mt-3 inline-flex h-7 items-center gap-1.5 self-start rounded-full bg-leaf-pale pr-3 pl-2 text-sm font-extrabold text-moss">
            <HandIcon name="cal" className="size-5" />
            {highlight}
          </p>
        ) : (
          <CardDates slug={card.slug} scheduleLabel={card.scheduleLabel} source={dates} />
        )}
        <p className="mt-auto pt-3 text-[0.9375rem] text-ink-soft">
          {card.priceIsFrom ? "From " : ""}
          <b className="text-[1.1875rem] font-extrabold text-ink">{card.priceLabel}</b> / adult
        </p>
      </div>
    </article>
  );
}

/** Closing card on the home carousel: an invitation to host, not a listing. */
export function InviteCard() {
  return (
    <article className="flex aspect-[4/5] flex-col justify-center gap-3 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line-strong bg-sand p-7">
      <HandIcon name="house" className="size-14" />
      <p className="hand text-[2.125rem]">Your experience here?</p>
      <p className="text-[0.9375rem] text-ink-soft">Share what you love about Kamakura. NIHO helps local hosts prepare and take bookings.</p>
      <Link href="/host" className="link-leaf self-start">
        Host with NIHO
      </Link>
    </article>
  );
}

export function ExperienceGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="space-y-3">
          <div className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-sand" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-sand" />
          <div className="h-6 w-4/5 animate-pulse rounded bg-sand" />
        </li>
      ))}
    </ul>
  );
}
