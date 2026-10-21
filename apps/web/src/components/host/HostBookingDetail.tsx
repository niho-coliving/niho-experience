"use client";

import { useId, useState, type ReactNode } from "react";
import {
  BOOKING_TEXT_LIMITS,
  bookingActions,
  bookingRequestRows,
  bookingStateRows,
  bookingStatusLabel,
  bookingWhen,
  MESSAGE_STATUS,
  respondByLabel,
  shortDateTime,
  type BookingCancellation,
  type BookingMessageInput,
  type BookingRow,
} from "@/host/bookings";
import { monthDayJa, yen } from "@/host/format";
import type { HostBooking } from "@/host/types";
import { FIELD_LABEL } from "./editor-parts";
import { INPUT, TEXTAREA } from "./fields";
import { BookingCancelDialog, BookingDecisionDialog, DANGER_BUTTON } from "./HostBookingDialogs";
import { consoleButtonClass, HOST_SURFACE } from "./host-ui";
import { HostIcon } from "./HostIcon";
import { StatusPill } from "./ui";

/** One part of the booking (申込内容, 状態, メッセージ, 時系列) under a hairline. */
function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mt-3.5 border-t border-line pt-3.5">
      <h3 id={id} className="mb-2 font-sans text-xs leading-normal font-extrabold tracking-[0.04em] text-ink-soft">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Label 72px + value, the mock's `.dkv`. */
function Rows({ rows }: { rows: readonly BookingRow[] }) {
  return (
    <dl>
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[72px_minmax(0,1fr)] gap-2 py-[5px] text-[0.8125rem] leading-normal">
          <dt className="font-bold text-muted">{row.label}</dt>
          {"answers" in row ? (
            <dd className="min-w-0">
              <ul className="flex flex-col gap-1.5">
                {row.answers.map((answer, index) => (
                  <li key={index} className="[overflow-wrap:anywhere]">
                    <span className="block text-xs text-muted">{answer.question}</span>
                    <span className="block">{answer.answer}</span>
                  </li>
                ))}
              </ul>
            </dd>
          ) : (
            <dd className={`min-w-0 [overflow-wrap:anywhere] ${row.multiline ? "whitespace-pre-wrap" : ""}`}>{row.value}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}

const WAIT_LINE = "mb-2.5 text-[0.78125rem] leading-normal font-extrabold text-warn";

/** A text that is not only spaces: the browser's own check says why it cannot be sent. */
function keepFilled(field: HTMLInputElement | HTMLTextAreaElement) {
  field.setCustomValidity(field.value && !field.value.trim() ? "空白だけでは送れません" : "");
}

/** メッセージ: what was sent (連絡の履歴, with NIHO's sending state) and a subject and body to send now. */
function MessageSection({ booking, canSend, onSend }: { booking: HostBooking; canSend: boolean; onSend: (input: BookingMessageInput) => void }) {
  const baseId = useId();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <DetailSection title="メッセージ">
      {booking.messages.length ? (
        <ol aria-label="連絡の履歴" className="mb-3 flex flex-col gap-2">
          {booking.messages.map((message) => (
            <li key={message.id} className="rounded-xl bg-sand px-3 py-2.5 text-[0.8125rem] leading-normal [overflow-wrap:anywhere]">
              <p className="font-extrabold">{message.subject}</p>
              <p className="mt-0.5 whitespace-pre-wrap text-ink-soft">{message.body}</p>
              <p className={`mt-1 flex flex-wrap items-center gap-x-1 text-xs font-bold ${message.status === "sent" ? "text-moss" : "text-danger"}`}>
                <HostIcon name={message.status === "sent" ? "check" : "close"} className="size-3.5" />
                {MESSAGE_STATUS[message.status]}
                <span className="font-normal text-muted">· {shortDateTime(message.at)}</span>
              </p>
            </li>
          ))}
        </ol>
      ) : null}
      {canSend ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!event.currentTarget.reportValidity()) return;
            onSend({ subject, body });
            setSubject("");
            setBody("");
            setSent(true);
          }}
        >
          <p className="mb-2 text-xs text-muted [overflow-wrap:anywhere]">
            宛先 {booking.guest} · {booking.email}
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${baseId}-subject`} className={FIELD_LABEL}>
              件名
            </label>
            <input
              id={`${baseId}-subject`}
              required
              maxLength={BOOKING_TEXT_LIMITS.subject}
              value={subject}
              onChange={(event) => {
                keepFilled(event.currentTarget);
                setSubject(event.currentTarget.value);
                setSent(false);
              }}
              className={INPUT}
            />
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <label htmlFor={`${baseId}-body`} className={FIELD_LABEL}>
              本文
            </label>
            <textarea
              id={`${baseId}-body`}
              required
              maxLength={BOOKING_TEXT_LIMITS.body}
              rows={3}
              value={body}
              onChange={(event) => {
                keepFilled(event.currentTarget);
                setBody(event.currentTarget.value);
                setSent(false);
              }}
              className={TEXTAREA}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <button type="submit" className={consoleButtonClass("secondary", "sm")}>
              送信する
            </button>
            <p role="status" className="text-xs font-extrabold text-moss">
              {sent ? "メッセージを送信しました" : ""}
            </p>
          </div>
        </form>
      ) : (
        <p className="text-[0.8125rem] text-muted">お断り・期限切れの申込には送れません。</p>
      )}
    </DetailSection>
  );
}

export interface HostBookingDetailProps {
  booking: HostBooking;
  experienceTitle: string;
  today: string;
  /** The name's id: the page moves focus there after an action. */
  headingId: string;
  /** What the last action did (role=status); empty until then. */
  notice: string;
  onApprove: () => void;
  onDecline: () => void;
  onCancel: (cancellation: BookingCancellation) => void;
  onMessage: (input: BookingMessageInput) => void;
}

/**
 * One booking (mock v2 `bookingDetail`): the guest and the state, 申込内容, 状態, what the
 * host can do now, メッセージ and 時系列. 承認・お断り・取消 are asked in a dialog first.
 */
export function HostBookingDetail({ booking, experienceTitle, today, headingId, notice, onApprove, onDecline, onCancel, onMessage }: HostBookingDetailProps) {
  const [asking, setAsking] = useState<"approve" | "decline" | "cancel" | null>(null);
  const actions = bookingActions(booking.status);

  let next: ReactNode = null;
  if (actions.approve) {
    next = (
      <>
        {booking.respondBy ? <p className={WAIT_LINE}>承認期限 {respondByLabel(booking.respondBy, today)}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAsking("approve")} className={consoleButtonClass("primary")}>
            承認する
          </button>
          <button type="button" onClick={() => setAsking("decline")} className={consoleButtonClass("secondary")}>
            お断りする
          </button>
        </div>
      </>
    );
  } else if (actions.cancel) {
    next = (
      <>
        {booking.status === "refund_needed" ? <p className={WAIT_LINE}>旅行者が取消を依頼しています</p> : null}
        <button type="button" onClick={() => setAsking("cancel")} className={DANGER_BUTTON}>
          取り消して返金する
        </button>
      </>
    );
  } else if (booking.status === "cancelled" && booking.cancelledAt) {
    next = (
      <p className="text-[0.8125rem] text-ink-soft">
        {monthDayJa(booking.cancelledAt.slice(0, 10))}に取消 · {booking.refundedYen > 0 ? `${yen(booking.refundedYen)} を返金済み` : "返金なし"}
      </p>
    );
  }

  return (
    <section aria-labelledby={headingId} className={`${HOST_SURFACE} p-4 md:px-5 md:py-[18px]`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h2 id={headingId} tabIndex={-1} className="font-sans text-[1.125rem] leading-[1.3] font-extrabold tracking-normal [overflow-wrap:anywhere] focus:outline-none">
            {booking.guest}
          </h2>
          <p className="mt-0.5 text-[0.78125rem] leading-normal text-muted">{bookingWhen(booking)}</p>
        </div>
        <StatusPill status={bookingStatusLabel(booking, today)} />
      </div>
      <p role="status" className={notice ? "mt-3 flex items-start gap-1.5 rounded-xl bg-leaf-pale px-3 py-2 text-[0.8125rem] leading-normal font-bold text-moss" : "sr-only"}>
        {notice ? (
          <>
            <HostIcon name="check" className="mt-0.5 size-4" />
            {notice}
          </>
        ) : null}
      </p>

      <DetailSection title="申込内容">
        <Rows rows={bookingRequestRows(booking, experienceTitle)} />
      </DetailSection>
      <DetailSection title="状態">
        <Rows rows={bookingStateRows(booking)} />
      </DetailSection>
      {next ? <div className="mt-3.5 border-t border-line pt-3.5">{next}</div> : null}
      {actions.message || booking.messages.length ? <MessageSection booking={booking} canSend={actions.message} onSend={onMessage} /> : null}
      <DetailSection title="時系列">
        <ol>
          {booking.timeline.map((event, index) => (
            <li key={index} className="flex gap-2.5 py-1 text-[0.78125rem] leading-normal">
              <time dateTime={`${event.at}+09:00`} className="w-[92px] shrink-0 text-muted tabular-nums">
                {shortDateTime(event.at)}
              </time>
              <span className="min-w-0 [overflow-wrap:anywhere]">{event.text}</span>
            </li>
          ))}
        </ol>
      </DetailSection>

      {asking === "approve" || asking === "decline" ? (
        <BookingDecisionDialog kind={asking} booking={booking} onConfirm={asking === "approve" ? onApprove : onDecline} onClose={() => setAsking(null)} />
      ) : null}
      {asking === "cancel" ? <BookingCancelDialog booking={booking} onConfirm={onCancel} onClose={() => setAsking(null)} /> : null}
    </section>
  );
}
