import Link from "next/link";
import type { ReactNode } from "react";

export function AdminShell({ actorName, children }: { actorName: string | null; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-sand/45 text-[0.875rem] leading-[1.6]">
      <header className="border-b border-line bg-canvas">
        <div className="mx-auto flex min-h-14 w-full max-w-[1400px] items-center gap-4 px-4 md:px-7">
          <Link href="/admin/bookings" className="font-extrabold tracking-[0.04em]">NIHO 管理</Link>
          <nav aria-label="管理メニュー" className="flex-1">
            <Link href="/admin/bookings" className="inline-flex min-h-8 items-center rounded-full bg-sand px-3 font-extrabold" aria-current="page">予約支援</Link>
          </nav>
          {actorName ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden max-w-48 truncate text-ink-soft sm:inline">{actorName}</span>
              <form method="post" action="/admin/auth/logout">
                <button type="submit" className="min-h-8 rounded-full border border-line-strong px-3 font-extrabold hover:bg-sand">ログアウト</button>
              </form>
            </div>
          ) : null}
        </div>
      </header>
      <main id="main">{children}</main>
    </div>
  );
}

