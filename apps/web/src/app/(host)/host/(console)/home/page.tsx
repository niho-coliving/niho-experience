import type { Metadata } from "next";
import Link from "next/link";
import { HostHomeTodos } from "@/components/host/HostHomeTodos";
import { HostIcon } from "@/components/host/HostIcon";
import { HostRegisterPrompt } from "@/components/host/HostRegisterPrompt";
import { consoleButtonClass, HOST_SURFACE, LIST_ROW, LIST_ROW_DETAIL, LIST_ROW_TITLE } from "@/components/host/host-ui";
import { HostPageBody, MoreLink, PageHead, SectionTitle } from "@/components/host/ui";
import { hostPageContext, loadHostConsoleData } from "@/host/data";
import type { HomeUpcoming } from "@/host/home";
import { HOST_BOOKINGS_PATH, HOST_SALES_PATH, withProvider } from "@/lib/host/routes";

export const metadata: Metadata = { title: "ホーム" };

type SearchParams = Record<string, string | string[] | undefined>;

/** The day of a session: its weekday over the day (the full date for screen readers). */
function SessionDay({ item }: { item: HomeUpcoming }) {
  return (
    <>
      <span className="sr-only">{item.dateLabel}</span>
      <span aria-hidden="true" className="w-11 shrink-0 text-center leading-[1.1]">
        <span className="block text-xs font-extrabold text-muted">{item.weekday}</span>
        <span className="mt-0.5 block font-display text-[1.3125rem] font-medium">{item.day}</span>
      </span>
    </>
  );
}

/**
 * 今日の開催 / 明日の開催 (#106): each session with its seats and 参加者を見る. Not shown on a day
 * without sessions. TODO(#107): 参加者を見る opens the day's own screen instead of 予約.
 */
function DaySessions({ id, title, sessions, participantsHref }: { id: string; title: string; sessions: readonly HomeUpcoming[]; participantsHref: string }) {
  if (!sessions.length) return null;
  return (
    <section aria-labelledby={id} className={`${HOST_SURFACE} mt-3.5`}>
      <div className="px-4 pt-4 pb-2 md:px-5">
        <SectionTitle id={id}>{title}</SectionTitle>
      </div>
      <ul>
        {sessions.map((item, index) => (
          <li key={item.key} className={`${LIST_ROW} flex-wrap border-t border-line first:border-t-0`}>
            <SessionDay item={item} />
            <span id={`${id}-${index}`} className="min-w-0 flex-[1_1_150px]">
              <span className={`block ${LIST_ROW_TITLE}`}>{item.title}</span>
              <span className={`block ${LIST_ROW_DETAIL}`}>{item.detail}</span>
            </span>
            <span className="shrink-0 text-[0.875rem] leading-[1.4] font-extrabold whitespace-nowrap tabular-nums max-md:ml-14">
              {item.seats} · {item.bookings}
            </span>
            <Link href={participantsHref} aria-describedby={`${id}-${index}`} className={consoleButtonClass("secondary", "sm", "max-md:ml-auto")}>
              参加者を見る
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** ホーム (mock v2, the journey mock's H1): what needs doing, today's and tomorrow's sessions, the ones after, and this month's numbers. */
export default async function HostHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await hostPageContext(await searchParams);
  // The console layout shows sign-in, refresh and error states.
  if (!context) return null;
  const { provider, providerNotFound, linkProviderId } = context;
  if (!provider) return <HostRegisterPrompt title="ホーム" />;
  const { home } = await loadHostConsoleData(provider);
  const link = (path: string) => withProvider(path, linkProviderId);
  // これからの開催 starts after the days shown above it.
  const upcoming = home.sessions.later;
  const soon = home.sessions.today.length + home.sessions.tomorrow.length > 0;

  return (
    <HostPageBody>
      <PageHead title="ホーム" />
      {providerNotFound ? (
        <p role="alert" className="mb-3.5 rounded-2xl border border-warn/20 bg-warn-pale px-4 py-3 text-warn">
          指定された提供者を開けませんでした。権限が無いか、URL が正しくありません。{provider.displayName}を表示しています。
        </p>
      ) : null}

      {/* Keyed by provider: another provider's rows start from their own list. */}
      <HostHomeTodos key={provider.id} todos={home.todos} providerId={linkProviderId} />
      <DaySessions id="home-today" title="今日の開催" sessions={home.sessions.today} participantsHref={link(HOST_BOOKINGS_PATH)} />
      <DaySessions id="home-tomorrow" title="明日の開催" sessions={home.sessions.tomorrow} participantsHref={link(HOST_BOOKINGS_PATH)} />

      <div className="mt-3.5 grid items-start gap-3.5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="home-upcoming" className={HOST_SURFACE}>
          <div className="flex items-center justify-between gap-2.5 px-4 pt-4 pb-2 md:px-5">
            <SectionTitle id="home-upcoming">これからの開催</SectionTitle>
            <MoreLink href={link(HOST_BOOKINGS_PATH)}>予約を見る</MoreLink>
          </div>
          {upcoming.length ? (
            <ul>
              {upcoming.map((item) => (
                <li key={item.key} className="border-t border-line first:border-t-0">
                  <Link href={link(HOST_BOOKINGS_PATH)} className={`${LIST_ROW} hover:bg-sand/60`}>
                    <SessionDay item={item} />
                    <span className="min-w-0 flex-1">
                      <span className={`block ${LIST_ROW_TITLE}`}>{item.title}</span>
                      <span className={`block ${LIST_ROW_DETAIL}`}>{item.detail}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[0.875rem] leading-[1.4] font-extrabold whitespace-nowrap">{item.seats}</span>
                      <span className={`block ${LIST_ROW_DETAIL}`}>{item.bookings}</span>
                    </span>
                    <HostIcon name="chevronRight" className="size-4 text-line-strong max-md:hidden" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 pb-4 text-muted md:px-5">{soon ? "明後日からの開催はまだありません。" : "これからの開催はまだありません。"}</p>
          )}
        </section>

        <section aria-labelledby="home-month" className={HOST_SURFACE}>
          <div className="flex items-center justify-between gap-2.5 px-4 pt-4 pb-2 md:px-5">
            <SectionTitle id="home-month">{home.month?.label ?? "今月"}</SectionTitle>
            <MoreLink href={link(HOST_SALES_PATH)}>売上を見る</MoreLink>
          </div>
          {home.month ? (
            <dl className="flex flex-wrap items-center gap-[18px] px-4 pb-[18px] md:gap-[22px] md:px-5">
              {[
                ["売上", home.month.sales],
                ["返金", home.month.refunds],
                ["入金予定", home.month.expected],
                ["確定した予約", home.month.confirmed],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold text-muted">{label}</dt>
                  <dd className="text-lg leading-[1.3] font-extrabold tabular-nums md:text-xl">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="px-4 pb-4 text-muted md:px-5">売上の集計は準備中です。</p>
          )}
        </section>
      </div>
    </HostPageBody>
  );
}
