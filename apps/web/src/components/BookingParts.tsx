import type { ReactNode } from "react";
import type { ExperienceOffer } from "@niho-experience/api-client";
import {
  BOOKING_FIELD_INPUT_CLASS_V1,
  BOOKING_FIELD_LABEL_CLASS_V1,
  BookingBarV1,
  BookingStepHeadingV1,
  BookingSummaryV1,
  EN_STATIC_COPY_V1,
} from "@niho/experience-presentation/v1";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { formatDuration } from "@/lib/format";
import { formatClock } from "@/lib/schedule";
import { PRESENTATION_PRIMITIVES_V1 } from "./PresentationV1";

/** Presentational booking parts are owned by frozen v1; this wrapper maps live public data only. */
export function BookingSummaryCard({ experience, offer, titleAs = "h1" }: { experience: ExperienceDetailForSite; offer: ExperienceOffer | null; titleAs?: "h1" | "p" }) {
  return <BookingSummaryV1
    titleAs={titleAs}
    primitives={PRESENTATION_PRIMITIVES_V1}
    model={{
      title: experience.title,
      image: experience.cover ? { src: experience.cover.url, alt: "" } : null,
      summary: offer ? `${formatDuration(offer.durationMinutes)} · ${formatClock(offer.startTime)} JST · ${offer.name}` : undefined,
    }}
  />;
}

export function StepHeading({ id, step, children }: { id: string; step: number; children: ReactNode }) {
  return <BookingStepHeadingV1 id={id} step={step} label={EN_STATIC_COPY_V1.text("booking.step")}>{children}</BookingStepHeadingV1>;
}

export function BookingBar({ total, line, action, stack = false }: { total: ReactNode; line: ReactNode; action: ReactNode; stack?: boolean }) {
  return <BookingBarV1 total={total} line={line} action={action} stack={stack} />;
}

export const fieldLabelClass = BOOKING_FIELD_LABEL_CLASS_V1;
export const fieldInputClass = BOOKING_FIELD_INPUT_CLASS_V1;
