"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { addReply, lastMessage, listTimeLabel, messagePreview, messagesHref, sortThreads, threadHeading, threadWhen, waitingSince } from "@/host/messages";
import { THREAD_WAITING } from "@/host/status";
import type { HostThread } from "@/host/types";
import { HOST_HOME_PATH, withProvider } from "@/lib/host/routes";
import { HostIcon } from "./HostIcon";
import { HostMessageThread, type ReplyInput } from "./HostMessageThread";
import { HostSubHeader } from "./HostSubHeader";
import { HOST_SURFACE } from "./host-ui";
import { HostPageBody, InitialAvatar, PageHead, StatusPill } from "./ui";

/** The list and one thread side by side from lg (64rem); below it, one of them at a time. */
const TWO_COLUMNS = "(min-width: 64rem)";
const THREAD_HEADING = "thread-heading";
const rowId = (id: string) => `thread-row-${id}`;

/** A plain left click moves inside the screen; a click meant for a new tab or window follows the link as usual. */
function plainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export interface HostMessagesProps {
  threads: readonly HostThread[];
  /** `?booking=` naming a booking without a thread yet: its empty thread, which the first reply starts. */
  newThread: HostThread | null;
  experiences: readonly { id: string; title: string }[];
  /** The day the list's times count from (YYYY-MM-DD, JST). */
  today: string;
  /** The moment replies are dated with (YYYY-MM-DDTHH:MM, JST; the preview's fixed one in mock mode). */
  now: string;
  /** The URL's own `?providerId=` (when well formed), carried on every link. */
  linkProviderId: string | null;
  /** The provider shown: 英語にする asks NIHO for its threads. */
  providerId: string;
  providerName: string;
}

/**
 * メッセージ (#106, the journey mock's H2; laid out like 予約 #90): the threads on the left, the
 * waiting ones first, and one thread on the right (PC). On phones the thread is a screen of its
 * own (`?thread=`, or `?booking=` for a booking's): "‹ メッセージ" instead of the header, and the
 * page itself is under ホーム ("‹ ホーム", no bottom tabs).
 *
 * The thread lives in the URL and changes with pushState, so the page is not loaded again and the
 * threads keep the replies sent on this screen (mock mode: on this screen only; the preview note
 * says nothing is kept). TODO(#87): send the reply to NIHO and show the thread it reads back.
 */
export function HostMessages({ threads: initialThreads, newThread, experiences, today, now, linkProviderId, providerId, providerName }: HostMessagesProps) {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<readonly HostThread[]>(initialThreads);
  const focusDetail = useRef(false);
  const lastOpened = useRef<string | null>(null);

  const threadId = searchParams.get("thread") || null;
  const bookingId = threadId ? null : searchParams.get("booking") || null;
  const opened = threadId ?? bookingId;
  const sub = opened !== null;
  const listHref = messagesHref({ providerId: linkProviderId });

  const sorted = sortThreads(threads);
  const selected = threadId
    ? (threads.find((thread) => thread.id === threadId) ?? null)
    : bookingId
      ? (threads.find((thread) => thread.booking?.id === bookingId) ?? (newThread?.booking?.id === bookingId ? newThread : null))
      : null;
  const selectedId = selected?.id ?? null;
  // From lg the first thread of the list shows until one is chosen; below lg the list does.
  const shown = sub ? selected : (sorted[0] ?? null);
  const titleOf = (id: string) => experiences.find((experience) => experience.id === id)?.title ?? "";

  // Below lg, opening a thread replaces the list: focus its title. Coming back puts focus on its row again.
  useEffect(() => {
    if (opened) {
      lastOpened.current = selectedId;
      if (focusDetail.current) document.getElementById(THREAD_HEADING)?.focus();
      focusDetail.current = false;
      return;
    }
    const back = lastOpened.current;
    lastOpened.current = null;
    if (back && !window.matchMedia(TWO_COLUMNS).matches) document.getElementById(rowId(back))?.focus();
  }, [opened, selectedId]);

  /** Another view of this screen, without loading the page again. */
  const move = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!plainClick(event)) return;
    event.preventDefault();
    window.history.pushState(null, "", href);
  };

  const open = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!plainClick(event)) return;
    event.preventDefault();
    window.history.pushState(null, "", messagesHref({ providerId: linkProviderId, thread: id }));
    if (!window.matchMedia(TWO_COLUMNS).matches) {
      window.scrollTo(0, 0);
      focusDetail.current = true;
    }
  };

  /**
   * The reply joins its thread (a booking's empty thread becomes one), which then no longer waits.
   * One shown without being chosen (the first of the list) becomes the chosen one, so it stays on
   * screen while the list sorts again.
   */
  const send = (thread: HostThread, reply: ReplyInput) => {
    const updated = addReply(thread, reply, now);
    setThreads(threads.some((item) => item.id === thread.id) ? threads.map((item) => (item.id === thread.id ? updated : item)) : [...threads, updated]);
    if (!sub) window.history.replaceState(null, "", messagesHref({ providerId: linkProviderId, thread: thread.id }));
  };

  return (
    <>
      {sub ? (
        <HostSubHeader backHref={listHref} backLabel="メッセージ" title={shown ? threadHeading(shown) : "メッセージ"} onBack={(event) => move(event, listHref)} />
      ) : (
        <HostSubHeader backHref={withProvider(HOST_HOME_PATH, linkProviderId)} backLabel="ホーム" title="" />
      )}
      <HostPageBody>
        <div data-sub={sub ? "thread" : undefined} className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-5">
          <div className={`min-w-0 ${sub ? "max-lg:hidden" : ""}`}>
            <PageHead title="メッセージ" />
            <section aria-label="メッセージの一覧" className={`${HOST_SURFACE} overflow-hidden`}>
              {sorted.length ? (
                <ul>
                  {sorted.map((thread) => {
                    const last = lastMessage(thread);
                    const chosen = thread.id === selectedId;
                    // From lg, the thread shown on the right without being chosen is marked the same way.
                    const marked = chosen ? "bg-sand" : thread.id === shown?.id ? "hover:bg-sand/60 lg:bg-sand" : "hover:bg-sand/60";
                    return (
                      <li key={thread.id} className="border-t border-line first:border-t-0">
                        <a
                          id={rowId(thread.id)}
                          href={messagesHref({ providerId: linkProviderId, thread: thread.id })}
                          aria-current={chosen ? "true" : undefined}
                          onClick={(event) => open(event, thread.id)}
                          className={`flex items-start gap-3 px-3.5 py-3 focus-visible:outline-offset-[-3px] md:px-4 ${marked}`}
                        >
                          <InitialAvatar name={thread.guest} className="mt-0.5 size-9 text-[0.875rem]" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className="min-w-0 flex-1 truncate text-[0.875rem] leading-[1.4] font-extrabold">{thread.guest}</span>
                              {last ? (
                                <time dateTime={`${last.at}+09:00`} className="shrink-0 text-xs text-muted tabular-nums">
                                  {listTimeLabel(last.at, today)}
                                </time>
                              ) : null}
                            </span>
                            {/* "予約前" first: a long experience title is what gets cut. */}
                            <span className="block truncate text-xs leading-normal text-muted">
                              {[threadWhen(thread), titleOf(thread.experienceId)].filter(Boolean).join(" · ")}
                            </span>
                            <span className="mt-1 flex items-center gap-2">
                              <span className="min-w-0 flex-1 truncate text-[0.8125rem] leading-normal text-ink-soft">{last ? messagePreview(last) : ""}</span>
                              {waitingSince(thread) ? <StatusPill status={THREAD_WAITING} /> : null}
                            </span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-6 text-muted md:px-5">質問や連絡はまだありません</p>
              )}
            </section>
          </div>

          <div className={`min-w-0 ${sub ? "" : "max-lg:hidden"} lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto`}>
            {sub ? (
              <>
                {/* The list, with the page's title, is hidden below lg while one thread is open. */}
                <h1 className="sr-only lg:hidden">メッセージ</h1>
                <a href={listHref} onClick={(event) => move(event, listHref)} className="mb-3 hidden h-9 items-center pr-1.5 text-[0.9375rem] font-extrabold md:inline-flex lg:hidden">
                  <HostIcon name="chevronLeft" className="size-5" />
                  メッセージ<span className="sr-only">へ戻る</span>
                </a>
              </>
            ) : null}
            {shown ? (
              <HostMessageThread
                // Each thread starts with its own reply.
                key={shown.id}
                thread={shown}
                experienceTitle={titleOf(shown.experienceId)}
                headingId={THREAD_HEADING}
                linkProviderId={linkProviderId}
                providerId={providerId}
                providerName={providerName}
                onSend={(reply) => send(shown, reply)}
              />
            ) : sub ? (
              <section className={`${HOST_SURFACE} px-5 py-8`}>
                <h2 className="font-sans text-[0.9375rem] leading-normal font-extrabold tracking-normal">このやりとりは見つかりませんでした</h2>
                <p className="mt-1 text-ink-soft">一覧から選び直してください。</p>
              </section>
            ) : null}
          </div>
        </div>
      </HostPageBody>
    </>
  );
}
