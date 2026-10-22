import Link from "next/link";
import type { ReactNode } from "react";
import type { StatusLabel } from "@/host/status";
import { HOST_HEADING } from "./host-ui";
import { HostIcon } from "./HostIcon";

/*
 * Host console parts (mock v2 of the provider workspace, #84). Same tokens as the
 * traveler site (canvas / ink / leaf / moss, Fraunces + Nunito) at the denser sizes
 * of a work screen. Nothing here goes below 12px (docs/design-system.md §2.2).
 */

export interface HostAccount {
  displayName: string;
  iconUrl: string | null;
}

/** Page column: 1040px wide at most, mock v2 paddings. */
export function HostPageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1040px] px-4 pt-3.5 pb-6 md:px-9 md:pt-7 md:pb-10 ${className}`.trim()}>{children}</div>;
}

/** Page title (the display serif; Japanese falls back to Mincho) and the page's own actions on the right. */
export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-4 md:mb-[18px] md:items-end">
      <h1 className="shrink-0 font-display text-[1.375rem] leading-[1.2] font-medium tracking-[-0.01em] md:text-[1.625rem]">{title}</h1>
      {children ? <div className="flex min-w-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** The small label at the top of a panel (次にすること, 提供者情報). `focusable` lets the page move focus to it after an action. */
export function SectionTitle({ id, focusable = false, children }: { id?: string; focusable?: boolean; children: ReactNode }) {
  return (
    <h2 id={id} tabIndex={focusable ? -1 : undefined} className={`${HOST_HEADING} text-[0.78125rem] leading-normal text-ink-soft ${focusable ? "focus:outline-none" : ""}`.trim()}>
      {children}
    </h2>
  );
}

/** "予約を見る ›" on the right of a panel's title. */
export function MoreLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="inline-flex min-h-6 shrink-0 items-center gap-0.5 text-[0.78125rem] font-extrabold text-ink-soft hover:text-ink">
      {children}
      <HostIcon name="chevronRight" className="size-3.5" />
    </Link>
  );
}

const PILL_TONES: Record<StatusLabel["tone"], string> = {
  ok: "bg-leaf-pale text-moss",
  wait: "bg-warn-pale text-warn",
  draft: "bg-sand text-ink-soft",
  stop: "bg-danger-pale text-danger",
};

/** A state in words, with a small dot in the same color. */
export function StatusPill({ status }: { status: StatusLabel }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold whitespace-nowrap ${PILL_TONES[status.tone]}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-75" />
      {status.label}
    </span>
  );
}

function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "?";
}

/** A name's first letter in a pale circle. The name is always written next to it (or in the control's label). */
export function InitialAvatar({ name, className = "size-7 text-[0.8125rem]" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-leaf-pale font-extrabold text-moss ${className}`}>
      {initialOf(name)}
    </span>
  );
}

/** The NIHO account's photo when NIHO has one, else its initial. */
export function AccountAvatar({ account, className = "size-7 text-[0.8125rem]" }: { account: HostAccount; className?: string }) {
  if (account.iconUrl) {
    // A remote NIHO profile photo; next/image would need every NIHO image host configured at build time.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={account.iconUrl} alt="" referrerPolicy="no-referrer" className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return <InitialAvatar name={account.displayName || "NIHO"} className={className} />;
}
