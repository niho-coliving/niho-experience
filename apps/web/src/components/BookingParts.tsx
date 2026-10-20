import NextImage from "next/image";
import type { ReactNode } from "react";
import type { ExperienceOffer } from "@niho-experience/api-client";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { formatDuration } from "@/lib/format";
import { formatClock } from "@/lib/schedule";

/**
 * Presentational pieces shared by the booking page's two screens (SlotPicker → BookingForm).
 * They only lay out what those components already decide; no booking logic lives here.
 */

/** Cover thumbnail, title and "1 hr 30 min · 3:30 PM JST · Calligraphy workshop". The title is the page's h1 unless a published document supplies the heading. */
export function BookingSummaryCard({ experience, offer, titleAs = "h1" }: { experience: ExperienceDetailForSite; offer: ExperienceOffer | null; titleAs?: "h1" | "p" }) {
  const Title = titleAs;
  return (
    <div className="mt-3.5 flex items-center gap-3.5 rounded-[20px] border border-line p-3">
      <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[14px] bg-sand">
        {experience.cover ? <NextImage src={experience.cover.url} alt="" fill unoptimized sizes="72px" className="object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <Title className="font-display text-lg leading-[1.2] font-[450] tracking-[-0.01em] text-ink">{experience.title}</Title>
        {offer ? (
          <p className="mt-1 text-[0.84375rem] font-bold text-muted">
            {formatDuration(offer.durationMinutes)} · {formatClock(offer.startTime)} JST · {offer.name}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** "step 1" in hand-writing above a short heading. */
export function StepHeading({ id, step, children }: { id: string; step: number; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-[30px] mb-3 text-[1.625rem] tracking-[-0.01em]">
      <span className="hand mb-1 block text-[1.375rem]">step {step}</span>
      {children}
    </h2>
  );
}

/** Bottom bar that stays in reach while the guest scrolls the screen: the total, the date and the one action. */
export function BookingBar({ total, line, action, stack = false }: { total: ReactNode; line: ReactNode; action: ReactNode; stack?: boolean }) {
  return (
    <div
      data-sticky-bar
      className={`sticky bottom-0 z-20 -mx-5 mt-10 flex gap-x-3 gap-y-2.5 border-t border-line bg-white/95 px-5 pt-3 pb-3.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 ${
        stack ? "flex-col min-[30rem]:flex-row min-[30rem]:items-center min-[30rem]:justify-between" : "items-center justify-between"
      }`}
    >
      <div className="min-w-0 leading-tight" aria-live="polite">
        <p className="text-sm text-ink-soft">{total}</p>
        <p className="mt-1 truncate text-[0.8125rem] font-extrabold text-moss">{line}</p>
      </div>
      {action}
    </div>
  );
}

/** Mock `.fld`: a bold label above a roomy input. */
export const fieldLabelClass = "mt-3.5 block text-[0.90625rem] font-extrabold";
export const fieldInputClass =
  "mt-1.5 block min-h-[50px] w-full rounded-[14px] border border-line-strong bg-white px-3.5 py-3 text-base leading-snug font-normal text-ink focus-visible:border-transparent focus-visible:outline-offset-1 aria-[invalid=true]:border-danger";
