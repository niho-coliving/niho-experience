import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const variants: Record<Variant, string> = {
  primary: "bg-moss text-white hover:bg-moss-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
  ghost: "text-moss underline-offset-4 hover:underline",
};

export const buttonClass = (variant: Variant = "primary", extra = "") => `${base} ${variants[variant]} ${extra}`;

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

type Tone = "info" | "warn" | "danger" | "success" | "neutral";

const tones: Record<Tone, { box: string; icon: string; label: string }> = {
  info: { box: "border-info/25 bg-info-pale text-info", icon: "i", label: "Note" },
  warn: { box: "border-warn/25 bg-warn-pale text-warn", icon: "!", label: "Heads up" },
  danger: { box: "border-danger/25 bg-danger-pale text-danger", icon: "!", label: "Problem" },
  success: { box: "border-moss/25 bg-leaf-pale text-moss", icon: "✓", label: "Done" },
  neutral: { box: "border-line bg-sand text-ink-soft", icon: "i", label: "Note" },
};

/** Status message with an icon and a visually hidden tone label, so colour is never the only signal. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  role,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert";
}) {
  const t = tones[tone];
  return (
    <div role={role} className={`flex gap-3 rounded-2xl border p-4 ${t.box}`}>
      <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-current text-sm font-black">
        <span className="text-white mix-blend-normal">{t.icon}</span>
      </span>
      <div className="min-w-0 space-y-1">
        <p className="font-bold">
          <span className="sr-only">{t.label}: </span>
          {title}
        </p>
        {children ? <div className="text-ink-soft">{children}</div> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "muted" | "sample" }) {
  const styles = {
    neutral: "bg-surface/95 text-ink border-line",
    warn: "bg-warn-pale text-warn border-warn/20",
    muted: "bg-sand text-ink-soft border-line",
    sample: "bg-persimmon-pale text-persimmon border-persimmon/20",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-bold ${styles}`}>{children}</span>;
}

export function SectionHeading({ eyebrow, title, id, children }: { eyebrow?: string; title: string; id?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 max-w-2xl space-y-2">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="text-2xl sm:text-3xl">
        {title}
      </h2>
      {children ? <div className="text-ink-soft">{children}</div> : null}
    </div>
  );
}
