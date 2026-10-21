import Link from "next/link";
import { HostIcon } from "./HostIcon";

/** Phones, on a page under a section: "‹ 体験" and the page's title instead of the brand header. PC keeps the sidebar. */
export function HostSubHeader({ backHref, backLabel, title }: { backHref: string; backLabel: string; title: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas md:hidden">
      <div className="flex h-[52px] items-center gap-2.5 pr-3.5 pl-4">
        <Link href={backHref} aria-label={`${backLabel}へ戻る`} className="-ml-1.5 inline-flex h-11 shrink-0 items-center pr-1.5 text-[0.9375rem] font-extrabold">
          <HostIcon name="chevronLeft" className="size-[22px]" />
          {backLabel}
        </Link>
        <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-extrabold">{title}</p>
      </div>
    </header>
  );
}
