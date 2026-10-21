import type { Metadata } from "next";
import Link from "next/link";
import { HostIcon } from "@/components/host/HostIcon";
import { HostRegisterPrompt } from "@/components/host/HostRegisterPrompt";
import { consoleButtonClass, HOST_SURFACE } from "@/components/host/host-ui";
import { HostPageBody, PageHead, SectionTitle, StatusPill } from "@/components/host/ui";
import { hostPageContext, loadHostConsoleData } from "@/host/data";
import { HOST_BOOKINGS_PATH, HOST_SALES_PATH, withProvider } from "@/lib/host/routes";

export const metadata: Metadata = { title: "ホーム" };

type SearchParams = Record<string, string | string[] | undefined>;

const ROW = "flex min-h-[52px] items-center gap-3 px-3.5 py-3 md:px-4";
const ROW_TITLE = "text-[0.875rem] leading-[1.4] font-extrabold [overflow-wrap:anywhere]";
const ROW_DETAIL = "text-[0.78125rem] leading-normal text-muted";

function MoreLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="inline-flex min-h-6 shrink-0 items-center gap-0.5 text-[0.78125rem] font-extrabold text-ink-soft hover:text-ink">
      {children}
      <HostIcon name="chevronRight" className="size-3.5" />
    </Link>
  );
}

/** ホーム (mock v2): what needs doing, the sessions coming up, and this month's numbers. */
export default async function HostHomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await hostPageContext(await searchParams);
  // The console layout shows sign-in, refresh and error states.
  if (!context) return null;
  const { provider, providerNotFound, linkProviderId } = context;
  if (!provider) return <HostRegisterPrompt title="ホーム" />;
  const { home } = await loadHostConsoleData(provider);
  const link = (path: string) => withProvider(path, linkProviderId);

  return (
    <HostPageBody>
      <PageHead title="ホーム" />
      {providerNotFound ? (
        <p role="alert" className="mb-3.5 rounded-2xl border border-warn/20 bg-warn-pale px-4 py-3 text-warn">
          指定された提供者を開けませんでした。権限が無いか、URL が正しくありません。{provider.displayName}を表示しています。
        </p>
      ) : null}

      <section aria-labelledby="home-todo" className={HOST_SURFACE}>
        <div className="px-4 pt-4 pb-2 md:px-5">
          <SectionTitle id="home-todo">次にすること</SectionTitle>
        </div>
        {home.todos.length ? (
          <ul>
            {home.todos.map((todo) => (
              <li key={todo.key} className={`${ROW} flex-wrap border-t border-line first:border-t-0 max-md:items-start`}>
                <StatusPill status={todo.status} />
                {/* 170px keeps the pill and the words on one line down to a 360px phone; the button wraps below. */}
                <div className="min-w-0 flex-[1_1_170px]">
                  <p className={ROW_TITLE}>{todo.title}</p>
                  <p className={ROW_DETAIL}>{todo.detail}</p>
                </div>
                {todo.action ? (
                  <Link href={link(todo.action.href)} className={consoleButtonClass(todo.action.primary ? "primary" : "secondary", "sm", "max-md:ml-auto")}>
                    {todo.action.label}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 pb-4 text-muted md:px-5">いま対応が必要なことはありません。</p>
        )}
      </section>

      <div className="mt-3.5 grid items-start gap-3.5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="home-upcoming" className={HOST_SURFACE}>
          <div className="flex items-center justify-between gap-2.5 px-4 pt-4 pb-2 md:px-5">
            <SectionTitle id="home-upcoming">これからの開催</SectionTitle>
            <MoreLink href={link(HOST_BOOKINGS_PATH)}>予約を見る</MoreLink>
          </div>
          {home.upcoming.length ? (
            <ul>
              {home.upcoming.map((item) => (
                <li key={item.key} className="border-t border-line first:border-t-0">
                  <Link href={link(HOST_BOOKINGS_PATH)} className={`${ROW} hover:bg-sand/60`}>
                    <span className="sr-only">{item.dateLabel}</span>
                    <span aria-hidden="true" className="w-11 shrink-0 text-center leading-[1.1]">
                      <span className="block text-xs font-extrabold text-muted">{item.weekday}</span>
                      <span className="mt-0.5 block font-display text-[1.3125rem] font-medium">{item.day}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block ${ROW_TITLE}`}>{item.title}</span>
                      <span className={`block ${ROW_DETAIL}`}>{item.detail}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[0.875rem] leading-[1.4] font-extrabold whitespace-nowrap">{item.seats}</span>
                      <span className={`block ${ROW_DETAIL}`}>{item.bookings}</span>
                    </span>
                    <HostIcon name="chevronRight" className="size-4 text-line-strong max-md:hidden" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 pb-4 text-muted md:px-5">これからの開催はまだありません。</p>
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
