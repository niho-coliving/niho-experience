import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { HostIcon } from "./HostIcon";

/**
 * Phones, on a page under a section: "‹ 体験", the page's title and (optionally) one small
 * action instead of the brand header. PC keeps the sidebar. A screen that keeps its own state
 * across the way back (予約 and one booking) passes `onBack` and moves inside the page.
 */
export function HostSubHeader({ backHref, backLabel, title, action, onBack }: { backHref: string; backLabel: string; title: string; action?: ReactNode; onBack?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas md:hidden">
      <div className="flex h-[52px] items-center gap-2.5 pr-3.5 pl-4">
        <Link href={backHref} onClick={onBack} aria-label={`${backLabel}へ戻る`} className="-ml-1.5 inline-flex h-11 shrink-0 items-center pr-1.5 text-[0.9375rem] font-extrabold">
          <HostIcon name="chevronLeft" className="size-[22px]" />
          {backLabel}
        </Link>
        <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-extrabold">{title}</p>
        {action}
      </div>
    </header>
  );
}
