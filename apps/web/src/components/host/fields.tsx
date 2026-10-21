import type { ReactNode } from "react";
import type { StatusLabel } from "@/host/status";
import type { HostProviderKind } from "@/lib/host/providers";
import { HOST_SURFACE } from "./host-ui";
import { SectionTitle, StatusPill } from "./ui";

/*
 * Form parts for the settings and registration panels. Inputs are 16px on phones so
 * iOS does not zoom in on focus, and 14px (the console's text size) from md up.
 */
const FIELD = "block w-full rounded-[10px] border border-line-strong bg-canvas px-3 py-2 text-[1rem] text-ink md:text-[0.875rem]";
export const INPUT = `${FIELD} min-h-10 leading-normal`;
export const TEXTAREA = `${FIELD} min-h-24 resize-y leading-relaxed`;
/** A native select (its own arrow), as wide as its choices: up to the panel on phones, 360px on PC. */
export const SELECT = "block min-h-10 w-auto max-w-full rounded-[10px] border border-line-strong bg-canvas px-3 py-2 text-[1rem] leading-normal text-ink md:max-w-[360px] md:text-[0.875rem]";
/** Inputs that cannot be changed here read as such. */
export const FIELD_DISABLED = "disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-soft";
/** Short single-line values stay 360px wide on PC. */
export const NARROW = "md:max-w-[360px]";

/** One group of settings in its own panel, with its state on the right of the title. */
export function FieldSection({ id, title, status, children }: { id: string; title: string; status?: StatusLabel | null; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${HOST_SURFACE} p-4 md:px-5 md:py-[18px]`}>
      <div className="mb-3 flex min-h-6 items-center justify-between gap-2.5">
        <SectionTitle id={id}>{title}</SectionTitle>
        {status ? <StatusPill status={status} /> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

const LABEL = "text-[0.78125rem] font-extrabold text-ink-soft md:pt-[9px]";

/** "Label 168px + field" on PC, stacked on phones, rows divided by a hairline. Pass `htmlFor` for one control, `labelId` for a group. */
export function FieldRow({ label, htmlFor, labelId, children }: { label: string; htmlFor?: string; labelId?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line py-3 first:border-t-0 md:grid-cols-[168px_minmax(0,1fr)] md:gap-x-4 md:gap-y-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={LABEL}>
          {label}
        </label>
      ) : (
        <span id={labelId} className={LABEL}>
          {label}
        </span>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const KIND_OPTIONS: { value: HostProviderKind; label: string }[] = [
  { value: "INDIVIDUAL", label: "個人" },
  { value: "BUSINESS", label: "店舗・事業者" },
];

/**
 * 個人 / 店舗・事業者 as a segmented control. Native radios, so keyboard and screen readers work as
 * usual. `disabled` shows the kind without letting it change (NIHO keeps it from the registration).
 */
export function KindSegment({ name, labelId, defaultValue, disabled = false, describedBy }: { name: string; labelId: string; defaultValue: HostProviderKind | null; disabled?: boolean; describedBy?: string }) {
  return (
    <div role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy} className="inline-flex min-h-10 items-center">
      <span className="inline-flex rounded-full bg-sand p-0.5">
        {KIND_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="relative block h-8 rounded-full px-3 text-[0.8125rem] leading-8 font-extrabold text-ink-soft has-[:checked]:bg-canvas has-[:checked]:text-ink has-[:checked]:shadow-[0_1px_2px_rgb(0_0_0/0.08)] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-moss"
          >
            {/* The invisible radio covers its whole option, like the booking date cards. */}
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              disabled={disabled}
              className="absolute inset-0 z-[1] size-full cursor-pointer appearance-none rounded-full opacity-0 focus-visible:outline-none disabled:cursor-default"
            />
            {option.label}
          </label>
        ))}
      </span>
    </div>
  );
}
