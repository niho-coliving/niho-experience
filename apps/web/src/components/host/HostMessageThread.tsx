"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { draftReplyEnglish } from "@/host/actions";
import { bookingsHref, shortDateTime } from "@/host/bookings";
import {
  guestMessageView,
  MESSAGE_TEXT_LIMIT,
  REPLY_DRAFT_FAILED_TEXT,
  REPLY_STATUS,
  replyDraftState,
  threadContext,
  threadHeading,
} from "@/host/messages";
import type { HostGuestMessage, HostReplyMessage, HostThread } from "@/host/types";
import { DISABLED, FIELD_LABEL, useFocusAfterRender } from "./editor-parts";
import { TEXTAREA } from "./fields";
import { consoleButtonClass, HOST_SURFACE } from "./host-ui";
import { HostIcon } from "./HostIcon";

/*
 * One thread of メッセージ (#106, the journey mock's H2): the guest's words in Japanese with their
 * own under them, the host's replies with the English that was sent, and the reply to write.
 * The host writes Japanese, lets NIHO make the English (英語にする, a server action), checks or
 * corrects it, and sends that English; English NIHO made from older Japanese is never sent.
 */

const BUBBLE = "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.875rem] leading-[1.55] [overflow-wrap:anywhere]";
const BUBBLE_META = "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5 text-xs leading-normal text-muted";
/** A second part of a bubble under a dashed line: the original, the English that was sent. */
const BUBBLE_PART = "mt-2 border-t border-dashed border-line-strong pt-2 text-[0.8125rem]";

function MessageTime({ at }: { at: string }) {
  return (
    <time dateTime={`${at}+09:00`} className="tabular-nums">
      {shortDateTime(at)}
    </time>
  );
}

/** The guest's message on the left: NIHO's translation, the original under it (or the original alone when it could not be translated). */
function GuestBubble({ message, guest }: { message: HostGuestMessage; guest: string }) {
  const view = guestMessageView(message);
  return (
    <li className="flex flex-col items-start">
      <div className={`${BUBBLE} rounded-tl-md bg-sand`}>
        <span className="sr-only">{guest} さん：</span>
        <p lang={view.lang} className="whitespace-pre-wrap">
          {view.text}
        </p>
        {view.original ? (
          <p lang={message.language} className={`${BUBBLE_PART} whitespace-pre-wrap text-muted`}>
            <span lang="ja" className="sr-only">
              原文：
            </span>
            {view.original}
          </p>
        ) : null}
      </div>
      <p className={BUBBLE_META}>
        {view.note ? (
          <span className={`inline-flex items-center rounded-full px-2 font-extrabold ${view.untranslated ? "bg-warn-pale text-warn" : "bg-info-pale text-info"}`}>{view.note}</span>
        ) : null}
        {message.viaEmail ? <span>メールで返信</span> : null}
        <MessageTime at={message.at} />
      </p>
    </li>
  );
}

/** The host's reply on the right: the Japanese they wrote, and the English the guest got behind 送った英語. */
function ReplyBubble({ message, providerName }: { message: HostReplyMessage; providerName: string }) {
  const sent = message.status === "sent";
  return (
    <li className="flex flex-col items-end">
      <div className={`${BUBBLE} rounded-tr-md bg-leaf-pale`}>
        <span className="sr-only">{providerName}：</span>
        {message.japanese ? (
          <>
            <p className="whitespace-pre-wrap">{message.japanese}</p>
            <details className={`group ${BUBBLE_PART}`}>
              <summary className="inline-flex cursor-pointer list-none items-center gap-0.5 text-xs font-extrabold text-moss [&::-webkit-details-marker]:hidden">
                送った英語
                <HostIcon name="chevronDown" className="size-3.5 group-open:rotate-180" />
              </summary>
              <p lang="en" className="mt-1 whitespace-pre-wrap text-ink-soft">
                {message.english}
              </p>
            </details>
          </>
        ) : (
          <p lang="en" className="whitespace-pre-wrap">
            {message.english}
          </p>
        )}
      </div>
      <p className={`${BUBBLE_META} justify-end`}>
        <span className={`inline-flex items-center gap-0.5 font-bold ${sent ? "text-moss" : "text-danger"}`}>
          <HostIcon name={sent ? "check" : "close"} className="size-3.5" />
          {REPLY_STATUS[message.status]}
        </span>
        <MessageTime at={message.at} />
      </p>
    </li>
  );
}

export interface ReplyInput {
  japanese: string;
  english: string;
}

/**
 * 送信欄: 日本語で書く → 英語にする → "{名前} さんに届く英語" (英語を作り直す / 英語を直す) →
 * この英語で送る. On phones it stays at the bottom of the screen. While NIHO makes the English,
 * or when it fails, the Japanese stays as written.
 */
function ReplyComposer({ thread, providerId, onSend }: { thread: HostThread; providerId: string; onSend: (reply: ReplyInput) => void }) {
  const baseId = useId();
  const japaneseId = `${baseId}-ja`;
  const englishId = `${baseId}-en`;
  const [japanese, setJapanese] = useState("");
  const [english, setEnglish] = useState("");
  /** The Japanese NIHO made the English from; null once the host corrects or writes it. */
  const [madeFrom, setMadeFrom] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const japaneseField = useRef<HTMLTextAreaElement>(null);
  const focusLater = useFocusAfterRender();
  const { stale, canSend } = replyDraftState({ japanese, english, madeFrom });
  const hasEnglish = editing || english !== "";

  const makeEnglish = async () => {
    const source = japanese;
    if (!source.trim() || drafting) return;
    setDrafting(true);
    setError("");
    setSent(false);
    try {
      const result = await draftReplyEnglish({ providerId, threadId: thread.id, japanese: source });
      if (result.ok) {
        setEnglish(result.english);
        setMadeFrom(source);
        setEditing(false);
      } else {
        setError(result.message);
      }
    } catch {
      setError(REPLY_DRAFT_FAILED_TEXT);
    } finally {
      setDrafting(false);
    }
  };

  /** 英語を直す / 英語を直接書く: the English becomes the host's own, sent as they write it. */
  const writeEnglish = () => {
    setEditing(true);
    setMadeFrom(null);
    setSent(false);
    focusLater(englishId);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend || drafting) return;
    onSend({ japanese, english });
    setJapanese("");
    setEnglish("");
    setMadeFrom(null);
    setEditing(false);
    setError("");
    setSent(true);
    // The button pressed waits for the next English: the next reply starts in the Japanese.
    japaneseField.current?.focus();
  };

  return (
    <form onSubmit={submit} aria-label="返信" className="sticky bottom-0 z-10 mt-auto rounded-b-2xl border-t border-line bg-canvas px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:px-5">
      <label htmlFor={japaneseId} className={FIELD_LABEL}>
        日本語で書く
      </label>
      <textarea
        ref={japaneseField}
        id={japaneseId}
        rows={3}
        maxLength={MESSAGE_TEXT_LIMIT}
        value={japanese}
        onChange={(event) => {
          setJapanese(event.currentTarget.value);
          setSent(false);
        }}
        className={`${TEXTAREA} mt-1.5 min-h-[76px]`}
      />

      {hasEnglish ? (
        editing ? (
          <div className="mt-2.5 flex flex-col gap-1.5">
            <label htmlFor={englishId} className={FIELD_LABEL}>
              {thread.guest} さんに届く英語
            </label>
            <textarea
              id={englishId}
              lang="en"
              rows={3}
              maxLength={MESSAGE_TEXT_LIMIT}
              value={english}
              onChange={(event) => {
                setEnglish(event.currentTarget.value);
                setSent(false);
              }}
              className={`${TEXTAREA} min-h-[76px]`}
            />
          </div>
        ) : (
          <div className="mt-2.5 rounded-xl bg-info-pale px-3 py-2.5 text-[0.84375rem] leading-normal">
            <p className="text-xs font-extrabold text-info">{thread.guest} さんに届く英語</p>
            <p lang="en" className="mt-0.5 whitespace-pre-wrap [overflow-wrap:anywhere]">
              {english}
            </p>
          </div>
        )
      ) : null}

      <p role="status" className={stale ? "mt-2 text-[0.78125rem] leading-normal font-extrabold text-warn" : "sr-only"}>
        {stale ? "日本語を変えました。英語を作り直してください" : ""}
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-[0.78125rem] leading-normal font-extrabold text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={makeEnglish} disabled={!japanese.trim() || drafting} className={consoleButtonClass("secondary", "sm", DISABLED)}>
          {drafting ? "英語にしています…" : hasEnglish ? "英語を作り直す" : "英語にする"}
        </button>
        {editing ? null : (
          <button type="button" onClick={writeEnglish} className={consoleButtonClass(hasEnglish ? "secondary" : "ghost", "sm")}>
            {hasEnglish ? "英語を直す" : "英語を直接書く"}
          </button>
        )}
        <button type="submit" disabled={!canSend || drafting} className={consoleButtonClass("primary", "md", `ml-auto ${DISABLED}`)}>
          この英語で送る
        </button>
      </div>
      <p className="mt-2 text-xs leading-normal text-muted">{thread.guest} さんにはメールで届きます</p>
      <p role="status" className={sent ? "mt-1 flex items-center gap-1 text-[0.78125rem] leading-normal font-extrabold text-moss" : "sr-only"}>
        {sent ? (
          <>
            <HostIcon name="check" className="size-3.5" />
            送りました
          </>
        ) : null}
      </p>
    </form>
  );
}

export interface HostMessageThreadProps {
  thread: HostThread;
  experienceTitle: string;
  /** The heading's id: the page moves focus there when it opens a thread on a phone. */
  headingId: string;
  /** The URL's own `?providerId=`, carried on 予約を見る. */
  linkProviderId: string | null;
  /** The provider the reply is written for (the server action's). */
  providerId: string;
  /** Who the host's replies are from, for screen readers. */
  providerName: string;
  onSend: (reply: ReplyInput) => void;
}

/** One thread: its title and experience (with the booking when there is one), the messages in time order, and the reply. */
export function HostMessageThread({ thread, experienceTitle, headingId, linkProviderId, providerId, providerName, onSend }: HostMessageThreadProps) {
  return (
    <section aria-labelledby={headingId} className={`${HOST_SURFACE} flex flex-col`}>
      <div className="p-4 pb-3 md:px-5 md:pt-[18px]">
        <h2 id={headingId} tabIndex={-1} className="font-sans text-[1.125rem] leading-[1.3] font-extrabold tracking-normal [overflow-wrap:anywhere] focus:outline-none">
          {threadHeading(thread)}
        </h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-sand px-3 py-2.5">
          <div className="min-w-0 flex-[1_1_180px]">
            <p className="text-[0.8125rem] leading-[1.4] font-extrabold [overflow-wrap:anywhere]">{experienceTitle}</p>
            <p className="text-xs leading-normal text-muted">{threadContext(thread)}</p>
          </div>
          {thread.booking ? (
            <Link href={bookingsHref({ providerId: linkProviderId, booking: thread.booking.id })} className={consoleButtonClass("secondary", "sm")}>
              予約を見る
            </Link>
          ) : null}
        </div>
      </div>
      {thread.messages.length ? (
        <ol aria-label="やりとり" className="flex flex-col gap-3.5 px-4 pt-1 pb-4 md:px-5">
          {thread.messages.map((message) => (message.from === "guest" ? <GuestBubble key={message.id} message={message} guest={thread.guest} /> : <ReplyBubble key={message.id} message={message} providerName={providerName} />))}
        </ol>
      ) : null}
      <ReplyComposer thread={thread} providerId={providerId} onSend={onSend} />
    </section>
  );
}
