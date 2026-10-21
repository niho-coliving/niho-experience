"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  BOOKING_TEXT_LIMITS,
  bookingWhen,
  CANCEL_REASONS,
  cancelConfirmLabel,
  defaultCancelMessage,
  defaultCancelReason,
  REFUND_CHOICES,
  refundChoicesFor,
  refundNowYen,
  type BookingCancellation,
} from "@/host/bookings";
import { yen } from "@/host/format";
import type { HostBooking, HostCancelReason, HostRefundChoice } from "@/host/types";
import { DISABLED, FIELD_LABEL } from "./editor-parts";
import { TEXTAREA } from "./fields";
import { consoleButtonClass } from "./host-ui";

/*
 * The booking actions' confirmations (#90): 承認, お断り and 取消（と返金）, each in a modal
 * <dialog> on the page (the offer dialog's make). Nothing happens until its own button is
 * pressed; Esc and やめる close it and change nothing. The dialog closes first, then hands
 * the choice to the page, which applies it and moves focus to the booking's name.
 */

const DIALOG =
  "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[460px] overflow-hidden rounded-2xl border-0 bg-canvas p-0 text-[0.875rem] leading-[1.6] text-ink shadow-[0_20px_60px_rgb(0_0_0/0.2)] backdrop:bg-ink/40";

/** The irreversible actions: danger text on white with the field line (mock v2 `.btn-danger`). */
export const DANGER_BUTTON =
  "inline-flex h-[38px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-line-strong bg-canvas px-4 text-[0.84375rem] leading-none font-extrabold text-danger hover:bg-danger-pale";

const GROUP_LABEL = `${FIELD_LABEL} mb-1.5 block`;

/** 対象・開催回・金額: what the action is about, above its choices. */
function BookingSummary({ booking }: { booking: HostBooking }) {
  const rows = [
    ["対象", booking.guest],
    ["開催回", bookingWhen(booking)],
    ["金額", yen(booking.amountYen)],
  ] as const;
  return (
    <dl className="mt-3 rounded-xl bg-sand px-3 py-2">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[56px_minmax(0,1fr)] gap-2 py-0.5 text-[0.8125rem]">
          <dt className="font-bold text-muted">{label}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface ConfirmDialogProps {
  title: string;
  description: string;
  /** What gets focus when it opens: the safe choice, or the first field. */
  focusRef: RefObject<HTMLElement | null>;
  stayRef?: RefObject<HTMLButtonElement | null>;
  /** The confirming button (type="submit"). */
  confirm: ReactNode;
  /** Said next to the buttons while the confirming one waits for something. */
  hint?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}

function ConfirmDialog({ title, description, focusRef, stayRef, confirm, hint, onConfirm, onClose, children }: ConfirmDialogProps) {
  const baseId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    // Opened once: removing the element when the dialog is done closes it without a "close" event.
    if (element && !element.open) element.showModal();
    focusRef.current?.focus();
  }, [focusRef]);
  const close = () => dialog.current?.close();
  return (
    <dialog ref={dialog} aria-labelledby={`${baseId}-title`} aria-describedby={`${baseId}-body`} onClose={onClose} className={DIALOG}>
      <form
        className="flex max-h-[calc(100dvh-2rem)] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (!event.currentTarget.reportValidity()) return;
          // Closed first: the page under a modal dialog cannot take focus.
          close();
          onConfirm();
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4 md:px-5 md:pt-5">
          <h2 id={`${baseId}-title`} className="font-sans text-[0.9375rem] leading-normal font-extrabold tracking-normal">
            {title}
          </h2>
          <p id={`${baseId}-body`} className="mt-1 text-ink-soft">
            {description}
          </p>
          {children}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3 md:px-5">
          {hint}
          <button ref={stayRef} type="button" onClick={close} className={consoleButtonClass("secondary")}>
            やめる
          </button>
          {confirm}
        </div>
      </form>
    </dialog>
  );
}

/** 承認 or お断り of a request. Focus starts on やめる. */
export function BookingDecisionDialog({ kind, booking, onConfirm, onClose }: { kind: "approve" | "decline"; booking: HostBooking; onConfirm: () => void; onClose: () => void }) {
  const stay = useRef<HTMLButtonElement>(null);
  const approve = kind === "approve";
  return (
    <ConfirmDialog
      title={approve ? "申込を承認しますか？" : "申込をお断りしますか？"}
      description={approve ? "カードに請求し、決済できたら予約が確定します。" : "カードの仮押さえを取り消し、席を空けます。この操作は元に戻せません。"}
      focusRef={stay}
      stayRef={stay}
      confirm={
        <button type="submit" className={approve ? consoleButtonClass("primary") : DANGER_BUTTON}>
          {approve ? "決済して承認" : "申込を断る"}
        </button>
      }
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <BookingSummary booking={booking} />
    </ConfirmDialog>
  );
}

/** A choice of a radio group; the corners come with each use. */
const CHOICE =
  "relative border border-line-strong bg-canvas text-ink-soft has-[:checked]:border-moss has-[:checked]:bg-leaf-pale has-[:checked]:text-moss has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-moss";
/** The invisible radio covers its whole choice, like the booking date cards. */
const CHOICE_INPUT = "absolute inset-0 z-[1] size-full cursor-pointer appearance-none opacity-0 focus-visible:outline-none";

/**
 * 取消（と返金）: how much goes back (全額 / 半額 / 返金なし; a traveler's own request is
 * refunded in full), why, and what the guest is told. The button names the refund; it waits
 * for a reason and a message.
 */
export function BookingCancelDialog({ booking, onConfirm, onClose }: { booking: HostBooking; onConfirm: (cancellation: BookingCancellation) => void; onClose: () => void }) {
  const baseId = useId();
  const choices = refundChoicesFor(booking.status);
  const [refund, setRefund] = useState<HostRefundChoice>(choices[0] ?? "full");
  const [reason, setReason] = useState<HostCancelReason | null>(() => defaultCancelReason(booking.status));
  const [message, setMessage] = useState(() => defaultCancelMessage(booking));
  const first = useRef<HTMLInputElement>(null);
  const refundNow = refundNowYen(booking, refund);
  const waiting = !reason ? "取消理由を選ぶと取り消せます" : !message.trim() ? "旅行者へのメッセージを入れてください" : null;
  const hintId = `${baseId}-waiting`;

  return (
    <ConfirmDialog
      title="予約を取り消しますか？"
      description={`${booking.guest}さんの予約を取り消します。この操作は元に戻せません。`}
      focusRef={first}
      hint={
        waiting ? (
          <p id={hintId} className="basis-full text-xs text-muted">
            {waiting}
          </p>
        ) : null
      }
      confirm={
        <button type="submit" disabled={waiting !== null} aria-describedby={waiting ? hintId : undefined} className={`${DANGER_BUTTON} ${DISABLED}`}>
          {cancelConfirmLabel(refundNow)}
        </button>
      }
      onConfirm={() => {
        if (reason) onConfirm({ refund, reason, message });
      }}
      onClose={onClose}
    >
      <BookingSummary booking={booking} />

      {choices.length > 1 ? (
        <fieldset className="mt-4 min-w-0">
          <legend className={GROUP_LABEL}>返金</legend>
          <div className="grid grid-cols-3 gap-2">
            {REFUND_CHOICES.map((choice) => (
              <label key={choice.value} className={`${CHOICE} rounded-xl px-2 py-2 text-center`}>
                <input ref={choice.value === refund ? first : undefined} type="radio" name={`${baseId}-refund`} value={choice.value} checked={refund === choice.value} onChange={() => setRefund(choice.value)} className={`${CHOICE_INPUT} rounded-xl`} />
                <span className="block text-[0.8125rem] leading-snug font-extrabold">{choice.label}</span>
                <span className="block text-xs leading-snug tabular-nums">{yen(refundNowYen(booking, choice.value))}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="mt-4">
          <p className={GROUP_LABEL}>返金</p>
          <p className="text-[0.8125rem]">
            <span className="font-extrabold">全額 {yen(refundNow)}</span>
            <span className="text-ink-soft"> · 旅行者からの取消依頼は全額を返金します</span>
          </p>
        </div>
      )}
      <p className="mt-2 text-xs text-muted tabular-nums">
        今回の返金 {yen(refundNow)} · 返金後の合計 {yen(booking.refundedYen + refundNow)}
      </p>

      <fieldset className="mt-4 min-w-0">
        <legend className={GROUP_LABEL}>取消理由</legend>
        <div className="flex flex-wrap gap-2">
          {CANCEL_REASONS.map((item) => (
            <label key={item.value} className={`${CHOICE} inline-flex h-9 items-center rounded-full px-3.5 text-[0.8125rem] font-extrabold`}>
              <input
                ref={choices.length > 1 || item.value !== reason ? undefined : first}
                type="radio"
                name={`${baseId}-reason`}
                value={item.value}
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                className={`${CHOICE_INPUT} rounded-full`}
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor={`${baseId}-message`} className={FIELD_LABEL}>
          旅行者へのメッセージ
        </label>
        <textarea id={`${baseId}-message`} required maxLength={BOOKING_TEXT_LIMITS.cancelMessage} rows={4} value={message} onChange={(event) => setMessage(event.currentTarget.value)} className={TEXTAREA} />
        <p className="text-xs text-muted">取消のお知らせと一緒に、NIHO からメールで届きます。</p>
      </div>
    </ConfirmDialog>
  );
}
