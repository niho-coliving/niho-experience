"use client";

import { useRef, useState, type ReactNode } from "react";
import type { HostSettings } from "@/host/types";
import { PROVIDER_REVIEW_STATUS, payoutStatus } from "@/host/status";
import { FieldRow, FieldSection, INPUT, KindSegment, NARROW, TEXTAREA } from "./fields";
import { consoleButtonClass } from "./host-ui";
import { HostIcon } from "./HostIcon";

function payoutText(payout: HostSettings["payout"]): string {
  if (!payout) return "口座の状態はまだ表示できません";
  if (payout.reason === "NOT_CONNECTED") return "まだ口座がありません";
  return payout.label ?? "受取口座";
}

/**
 * 設定 (mock v2): one panel per group and one 保存. Saving is not connected to NIHO yet
 * (#88), so 保存 checks the fields and only says so on screen; the fields carry no
 * `name` and nothing leaves the browser. The account panel is passed in because its
 * sign-out form cannot sit inside this form.
 */
export function HostSettingsForm({ settings, preview, account }: { settings: HostSettings; preview: boolean; account: ReactNode }) {
  const form = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState<"saved" | "unavailable" | null>(null);
  const payout = settings.payout;
  const save = () => {
    if (!form.current?.reportValidity()) return;
    setNotice(preview ? "saved" : "unavailable");
  };
  return (
    <>
      <form ref={form} className="flex flex-col gap-3.5" onSubmit={(event) => event.preventDefault()} onChange={() => setNotice(null)}>
        <FieldSection id="settings-provider" title="提供者情報" status={settings.reviewStatus ? PROVIDER_REVIEW_STATUS[settings.reviewStatus] : null}>
          <FieldRow label="掲載名" htmlFor="settings-display-name">
            <input id="settings-display-name" required maxLength={120} defaultValue={settings.displayName} className={`${INPUT} ${NARROW}`} />
          </FieldRow>
          <FieldRow label="種別" labelId="settings-kind-label">
            <KindSegment name="settings-kind" labelId="settings-kind-label" defaultValue={settings.kind} />
          </FieldRow>
          <FieldRow label="紹介" htmlFor="settings-bio">
            <textarea id="settings-bio" rows={3} maxLength={4000} defaultValue={settings.bio} className={TEXTAREA} />
          </FieldRow>
          <FieldRow label="特商法表示 URL" htmlFor="settings-seller-url">
            <input id="settings-seller-url" type="url" inputMode="url" placeholder="https://" defaultValue={settings.sellerDisclosureUrl} className={`${INPUT} ${NARROW}`} />
          </FieldRow>
        </FieldSection>

        <FieldSection id="settings-payout" title="売上受取口座" status={payout ? payoutStatus(payout.reason) : null}>
          <FieldRow label="Stripe" labelId="settings-stripe-label">
            <div role="group" aria-labelledby="settings-stripe-label" className="flex min-h-10 flex-wrap items-center gap-2.5">
              <span>{payoutText(payout)}</span>
              {payout ? (
                // Opens Stripe once the provider API is connected (#88); the preview stops here.
                <button type="button" className={consoleButtonClass("secondary", "sm")}>
                  <HostIcon name="external" className="size-3.5" />
                  {payout.reason === "NOT_CONNECTED" ? "Stripe で設定" : "Stripe で確認"}
                </button>
              ) : null}
            </div>
          </FieldRow>
        </FieldSection>

        <FieldSection id="settings-meeting" title="既定の集合案内">
          <FieldRow label="公開する集合エリア" htmlFor="settings-meeting-area">
            <input id="settings-meeting-area" defaultValue={settings.meetingPoint.area} className={`${INPUT} ${NARROW}`} />
          </FieldRow>
          <FieldRow label="地図 URL" htmlFor="settings-map-url">
            <input id="settings-map-url" type="url" inputMode="url" placeholder="https://" defaultValue={settings.meetingPoint.mapUrl} className={`${INPUT} ${NARROW}`} />
          </FieldRow>
          <FieldRow label="入口の案内（予約確定後）" htmlFor="settings-entrance">
            <textarea id="settings-entrance" rows={3} defaultValue={settings.meetingPoint.entrance} className={TEXTAREA} />
          </FieldRow>
        </FieldSection>

        <FieldSection id="settings-notification" title="通知">
          <FieldRow label="予約の通知先" htmlFor="settings-notification-email">
            <input id="settings-notification-email" type="email" inputMode="email" autoComplete="email" defaultValue={settings.notificationEmail} className={`${INPUT} ${NARROW}`} />
          </FieldRow>
        </FieldSection>
      </form>

      <div className="mt-3.5">{account}</div>

      {/* PC: a leaf pill floating at the bottom right. Phones: a full-width band just above the bottom tabs. */}
      <div className="sticky bottom-[var(--host-tabbar)] z-10 -mx-4 mt-4 -mb-6 border-t border-line bg-canvas px-4 pt-2.5 pb-3.5 md:pointer-events-none md:bottom-4 md:mx-0 md:mb-0 md:flex md:items-center md:justify-end md:gap-3 md:border-0 md:bg-transparent md:p-0">
        <p role="status" className="text-center text-[0.78125rem] font-extrabold text-moss md:text-right">
          {notice ? (
            <span className="inline-flex items-center gap-1 pb-2 md:rounded-full md:bg-canvas md:px-3 md:py-1.5">
              {notice === "saved" ? <HostIcon name="check" className="size-3.5" /> : null}
              {notice === "saved" ? "保存しました" : "保存はまだ使えません（準備中）"}
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={save}
          className="block h-12 w-full rounded-xl bg-leaf text-[0.9375rem] font-extrabold text-ink hover:bg-leaf-hover md:pointer-events-auto md:h-11 md:w-auto md:rounded-full md:px-6 md:shadow-[0_8px_24px_rgb(0_0_0/0.14)]"
        >
          保存
        </button>
      </div>
    </>
  );
}
